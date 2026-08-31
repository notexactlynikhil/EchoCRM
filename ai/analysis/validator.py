import json
import re
from typing import Dict, Any, Tuple
from ai.config.settings import settings

class JSONValidator:
    """
    Validates and repairs LLM JSON output to enforce structured CRM schema.
    """

    @staticmethod
    def extract_json_string(text: str) -> str:
        text = text.strip()

        # Remove markdown code block fences if present
        markdown_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if markdown_match:
            return markdown_match.group(1).strip()

        # Search for first '{' and last '}'
        start_idx = text.find('{')
        end_idx = text.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            return text[start_idx:end_idx + 1].strip()

        return text

    @staticmethod
    def repair_json_string(json_str: str) -> str:
        # Strip trailing commas in objects or arrays
        repaired = re.sub(r',\s*([\}\]])', r'\1', json_str)
        return repaired

    @classmethod
    def parse_and_repair(cls, raw_response: str) -> Dict[str, Any]:
        extracted = cls.extract_json_string(raw_response)

        # First attempt: direct JSON parse
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

        # Second attempt: repair trailing commas
        repaired = cls.repair_json_string(extracted)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM JSON output after repair attempt: {str(e)}")

    @classmethod
    def validate_schema(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(data, dict):
            raise ValueError("Parsed JSON root must be an object/dict")

        validated = {}

        # 1. Summary
        summary = str(data.get("summary", "")).strip()
        if not summary:
            raise ValueError("Field 'summary' is missing or empty")
        validated["summary"] = summary

        # 2. Sentiment
        sentiment = str(data.get("sentiment", "")).strip().lower()
        if sentiment not in settings.VALID_SENTIMENTS:
            # Attempt basic normalization
            if "pos" in sentiment:
                sentiment = "positive"
            elif "neg" in sentiment:
                sentiment = "negative"
            elif "neu" in sentiment or not sentiment:
                sentiment = "neutral"
            else:
                raise ValueError(f"Invalid sentiment '{sentiment}'. Must be one of {settings.VALID_SENTIMENTS}")
        validated["sentiment"] = sentiment

        # 3. Deal Stage
        deal_stage = str(data.get("deal_stage", "")).strip().lower()
        if deal_stage not in settings.VALID_DEAL_STAGES:
            # Attempt basic normalization
            if "prospect" in deal_stage:
                deal_stage = "prospecting"
            elif "negotiat" in deal_stage:
                deal_stage = "negotiation"
            elif "clos" in deal_stage:
                deal_stage = "closing"
            elif "won" in deal_stage or "win" in deal_stage:
                deal_stage = "won"
            elif "lost" in deal_stage or "loss" in deal_stage:
                deal_stage = "lost"
            else:
                raise ValueError(f"Invalid deal_stage '{deal_stage}'. Must be one of {settings.VALID_DEAL_STAGES}")
        validated["deal_stage"] = deal_stage

        # 4. Customer Intent
        validated["customer_intent"] = str(data.get("customer_intent", "")).strip()

        # 5. Products Discussed
        products_raw = data.get("products_discussed", [])
        if isinstance(products_raw, list):
            validated["products_discussed"] = [str(p).strip() for p in products_raw if str(p).strip()]
        else:
            validated["products_discussed"] = [str(products_raw).strip()] if str(products_raw).strip() else []

        # 6. Action Items
        action_items_raw = data.get("action_items", [])
        action_items = []
        if isinstance(action_items_raw, list):
            for item in action_items_raw:
                if isinstance(item, dict):
                    desc = str(item.get("description", "")).strip()
                    due = item.get("due_date")
                    due_str = str(due).strip() if due and str(due).strip().lower() != "null" else None
                    if desc:
                        action_items.append({"description": desc, "due_date": due_str})
                elif isinstance(item, str) and item.strip():
                    action_items.append({"description": item.strip(), "due_date": None})
        validated["action_items"] = action_items

        # 7. Follow Up
        follow_up_raw = data.get("follow_up", {})
        if isinstance(follow_up_raw, dict):
            req = bool(follow_up_raw.get("required", False))
            dt = follow_up_raw.get("date")
            dt_str = str(dt).strip() if dt and str(dt).strip().lower() != "null" else None
            reason = str(follow_up_raw.get("reason", "")).strip()
            validated["follow_up"] = {
                "required": req,
                "date": dt_str,
                "reason": reason
            }
        else:
            validated["follow_up"] = {
                "required": False,
                "date": None,
                "reason": str(follow_up_raw).strip()
            }

        return validated

    @classmethod
    def validate_llm_response(cls, raw_response: str) -> Tuple[bool, Dict[str, Any], str]:
        """
        Parses, repairs, and validates raw LLM output against CRM schema.
        Returns: (is_valid, validated_data, error_message)
        """
        try:
            parsed = cls.parse_and_repair(raw_response)
            validated = cls.validate_schema(parsed)
            return True, validated, ""
        except Exception as e:
            return False, {}, str(e)
