import json
import urllib.request
import urllib.parse
import urllib.error
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from ai.config.settings import settings

class WebSearchTool(ABC):
    """Abstract base class for web search providers."""

    @abstractmethod
    def search(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        """
        Executes web search for query string.
        Returns normalized dictionary:
        {
          "query": str,
          "results": [{"title": str, "url": str, "snippet": str}],
          "success": bool,
          "error": Optional[str]
        }
        """
        pass


class KrillWebSearchProvider(WebSearchTool):
    """Krill Web Search engine provider implementation."""

    def __init__(self, api_key: Optional[str] = None, search_url: Optional[str] = None):
        self.api_key = api_key or settings.KRILL_API_KEY
        self.search_url = search_url or settings.KRILL_SEARCH_URL

    def search(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        cleaned_query = query.strip()
        if not cleaned_query:
            return {
                "query": query,
                "results": [],
                "success": False,
                "error": "Empty search query provided"
            }

        # Check if API key is configured; if not, use mock fallback mode gracefully
        if not self.api_key:
            print(f"[KrillSearch]: No KRILL_API_KEY set. Falling back to Mock Krill Search for query: '{cleaned_query}'")
            mock_provider = MockWebSearchProvider()
            return mock_provider.search(cleaned_query, max_results)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "EchoCRM-CRM/1.0"
        }

        payload = {
            "query": cleaned_query,
            "count": max_results
        }

        try:
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(self.search_url, data=req_data, headers=headers, method="POST")

            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    raw_data = json.loads(response.read().decode('utf-8'))
                    items = raw_data.get('results', raw_data.get('data', []))

                    formatted_results: List[Dict[str, str]] = []
                    for item in items[:max_results]:
                        formatted_results.append({
                            "title": item.get('title', 'No Title'),
                            "url": item.get('url', item.get('link', '')),
                            "snippet": item.get('snippet', item.get('description', item.get('content', '')))[:300]
                        })

                    return {
                        "query": cleaned_query,
                        "results": formatted_results,
                        "success": True,
                        "error": None
                    }
                else:
                    return {
                        "query": cleaned_query,
                        "results": [],
                        "success": False,
                        "error": f"Krill API returned HTTP status {response.status}"
                    }

        except urllib.error.HTTPError as e:
            return {
                "query": cleaned_query,
                "results": [],
                "success": False,
                "error": f"Krill API HTTP error {e.code}: {e.reason}"
            }
        except urllib.error.URLError as e:
            return {
                "query": cleaned_query,
                "results": [],
                "success": False,
                "error": f"Network unreachable while querying Krill API: {str(e.reason)}"
            }
        except Exception as e:
            return {
                "query": cleaned_query,
                "results": [],
                "success": False,
                "error": f"Unexpected Krill search failure: {str(e)}"
            }


class MockWebSearchProvider(WebSearchTool):
    """Mock Web Search provider for testing or fallback when Krill API key is absent/offline."""

    def search(self, query: str, max_results: int = 3) -> Dict[str, Any]:
        q_lower = query.lower()

        # Simulated search result knowledge base
        knowledge_base = [
            {
                "keywords": ["salesforce", "pricing", "cost"],
                "title": "Salesforce Pricing & Packaging Guide 2026",
                "url": "https://www.salesforce.com/products/pricing/",
                "snippet": "Salesforce Sales Cloud pricing ranges from Starter Edition ($25/user/month) to Professional ($80/user/month), Enterprise ($165/user/month), and Unlimited ($330/user/month) billed annually."
            },
            {
                "keywords": ["salesforce", "api", "documentation", "doc"],
                "title": "Salesforce REST API Developer Guide (v60.0)",
                "url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
                "snippet": "The Salesforce REST API provides powerful, convenient, and simple Web services interaction with Salesforce CRM. Supports OAuth 2.0 authentication and JSON/XML payloads."
            },
            {
                "keywords": ["salesforce", "migration", "process", "migrate"],
                "title": "Salesforce Data Migration Best Practices & Steps",
                "url": "https://help.salesforce.com/s/articleView?id=000384503",
                "snippet": "Steps for migrating to Salesforce: 1. Cleanse source data, 2. Map fields to standard/custom objects, 3. Export CSV files using Data Loader, 4. Import & validate relationships."
            },
            {
                "keywords": ["competitor", "crm", "hubspot", "features"],
                "title": "Top Enterprise CRM Feature Comparison 2026",
                "url": "https://www.g2.com/categories/crm/compare",
                "snippet": "Key competitor features include automated deal pipelines, AI email drafting, real-time telephony integration, custom reporting dashboards, and native mobile apps."
            }
        ]

        matched_results = []
        for entry in knowledge_base:
            if any(kw in q_lower for kw in entry["keywords"]):
                matched_results.append({
                    "title": entry["title"],
                    "url": entry["url"],
                    "snippet": entry["snippet"]
                })

        # Generic fallback if no specific keywords matched
        if not matched_results:
            matched_results.append({
                "title": f"Search Results for '{query}'",
                "url": f"https://search.krill.sh/q?={urllib.parse.quote(query)}",
                "snippet": f"Latest external web search information and documentation related to: '{query}'."
            })

        return {
            "query": query,
            "results": matched_results[:max_results],
            "success": True,
            "error": None
        }


def get_web_search_tool() -> WebSearchTool:
    """Returns configured WebSearchTool instance."""
    if settings.KRILL_API_KEY:
        return KrillWebSearchProvider()
    return MockWebSearchProvider()
