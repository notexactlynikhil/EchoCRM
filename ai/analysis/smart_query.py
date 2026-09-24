import json
from typing import Dict, Any, Optional
from ai.analysis.llm_provider import LLMProvider, get_llm_provider
from ai.search.web_search import WebSearchTool, get_web_search_tool
from ai.config.settings import settings

INTENT_CLASSIFICATION_PROMPT = """
You are an AI intent analyzer for a CRM system.
Analyze the user's query and decide if answering it requires fetching CURRENT or EXTERNAL web information (such as live documentation, external product pricing, competitor features, live company info, external migration guides).

Respond ONLY with a JSON object in this exact format:
{
  "needs_web_search": true or false,
  "search_query": "concise search query if web search is needed, else empty string",
  "reason": "short explanation"
}

User Query: "{query}"
Provided CRM/Call Context: "{context}"
"""

SMART_RESPONSE_PROMPT = """
You are an intelligent CRM AI assistant for EchoCRM.

=== CALL TRANSCRIPT / CRM CONTEXT ===
{context_text}

=== EXTERNAL WEB INFORMATION (RETRIEVED VIA KRILL WEB SEARCH) ===
{web_context}

=== USER QUERY ===
{query}

=== CRITICAL INSTRUCTIONS ===
1. If External Web Information is provided above, use it to accurately answer external/pricing/documentation questions.
2. STRICT SOURCE SEPARATION: Clearly distinguish between what the customer/user stated in the call context versus facts found from external web search results. DO NOT attribute external web search findings to the customer unless they specifically stated it in the call.
3. Be professional, concise, and structured in markdown format.
"""

class SmartQueryOrchestrator:
    """Orchestrates local-first AI queries with optional Krill web search."""

    def __init__(self, llm_provider: Optional[LLMProvider] = None, search_tool: Optional[WebSearchTool] = None):
        self.llm = llm_provider or get_llm_provider()
        self.search_tool = search_tool or get_web_search_tool()

    def _should_search_web(self, query: str, context: str) -> tuple[bool, str]:
        """
        Uses heuristic rules + LLaMA evaluation to determine if Krill web search is required.
        Returns (needs_search: bool, search_query: str).
        """
        if not settings.KRILL_ENABLED:
            return False, ""

        q_lower = query.lower().strip()

        # Heuristic 1: Purely internal/transcript queries -> NO web search
        internal_triggers = [
            "summarize", "summary", "action item", "concern", "what did the customer say",
            "deal stage", "sentiment", "transcript", "call summary", "who called"
        ]
        if any(trig in q_lower for trig in internal_triggers) and len(q_lower.split()) < 12:
            return False, ""

        # Heuristic 2: Explicit external triggers -> YES web search
        external_triggers = [
            "salesforce", "pricing", "competitor", "latest documentation", "api doc",
            "current price", "migration process", "features of", "external"
        ]
        if any(trig in q_lower for trig in external_triggers):
            return True, query

        # Fallback to LLM intent classification if ambiguous
        try:
            prompt = INTENT_CLASSIFICATION_PROMPT.format(query=query, context=context[:500] if context else "None")
            raw_res = self.llm.generate(prompt)

            # Clean JSON markdown fences if present
            cleaned = raw_res.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            parsed = json.loads(cleaned)
            needs_search = bool(parsed.get("needs_web_search", False))
            search_query = parsed.get("search_query", query) or query
            return needs_search, search_query
        except Exception:
            # Safe local fallback on classification failure
            return False, ""

    def execute_query(self, query: str, context: Optional[str] = "", force_web_search: Optional[bool] = None) -> Dict[str, Any]:
        """
        Executes query with local-first LLaMA + optional Krill web search.
        Returns structured answer response.
        """
        context_str = context.strip() if context else "No call transcript provided."
        
        # Decide if web search is needed
        if force_web_search is not None:
            needs_search = force_web_search
            search_query = query
        else:
            needs_search, search_query = self._should_search_web(query, context_str)

        search_result_data = None
        web_context = "No external web search performed."

        if needs_search:
            # Perform web search via Krill
            search_result_data = self.search_tool.search(search_query, max_results=settings.KRILL_MAX_RESULTS)
            
            if search_result_data.get("success") and search_result_data.get("results"):
                snippets = []
                for idx, item in enumerate(search_result_data["results"], 1):
                    snippets.append(f"[{idx}] {item['title']}\nURL: {item['url']}\nSnippet: {item['snippet']}")
                web_context = "\n\n".join(snippets)
            elif search_result_data.get("error"):
                web_context = f"Attempted web search for '{search_query}', but search service reported: {search_result_data['error']}"

        # Generate response using local LLaMA
        final_prompt = SMART_RESPONSE_PROMPT.format(
            context_text=context_str,
            web_context=web_context,
            query=query
        )

        llm_response = self.llm.generate(final_prompt)

        return {
            "query": query,
            "answer": llm_response,
            "used_web_search": needs_search,
            "search_query": search_query if needs_search else None,
            "search_results": search_result_data.get("results", []) if search_result_data else [],
            "search_error": search_result_data.get("error") if search_result_data else None,
            "sources": [item["url"] for item in (search_result_data.get("results", []) if search_result_data else []) if item.get("url")],
            "metadata": {
                "llm_provider": self.llm.get_provider_name(),
                "llm_model": self.get_model_name(),
                "krill_enabled": settings.KRILL_ENABLED
            }
        }

    def get_model_name(self) -> str:
        return self.llm.get_model_name()
