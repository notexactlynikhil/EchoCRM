import os
import sys
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai.analysis.smart_query import SmartQueryOrchestrator
from ai.search.web_search import KrillWebSearchProvider, MockWebSearchProvider

def run_tests():
    print("====================================")
    print("WAVELENGTH KRILL SEARCH INTEGRATION TEST")
    print("====================================\n")

    orchestrator = SmartQueryOrchestrator()

    # ----------------------------------------------------
    # TEST 1: Internal Call Analysis Query (Local-First)
    # ----------------------------------------------------
    print("[TEST 1/3] Internal Call Query (Should NOT trigger Krill)...")
    call_context = "Alex Jenkins called from APEX Global interested in Wavelength CRM platform. Budget is $50k."
    internal_query = "Summarize the customer intent and budget."
    
    res1 = orchestrator.execute_query(query=internal_query, context=call_context)
    print(f"  Query: '{res1['query']}'")
    print(f"  Used Web Search: {res1['used_web_search']} (Expected: False)")
    print(f"  Answer Snippet: {res1['answer'][:120]}...\n")
    assert res1['used_web_search'] is False, "Test 1 Failed: Web search triggered for internal query"
    print("  ✓ Test 1 Passed: Local-first handling confirmed\n")

    # ----------------------------------------------------
    # TEST 2: External Information Request (Triggers Krill)
    # ----------------------------------------------------
    print("[TEST 2/3] External Info Request (Should trigger Krill Search)...")
    external_query = "What is Salesforce's current pricing?"
    
    res2 = orchestrator.execute_query(query=external_query, context=call_context)
    print(f"  Query: '{res2['query']}'")
    print(f"  Used Web Search: {res2['used_web_search']} (Expected: True)")
    print(f"  Retrieved Sources: {res2['sources']}")
    print(f"  Answer Snippet:\n{res2['answer'][:200]}...\n")
    assert res2['used_web_search'] is True, "Test 2 Failed: Web search was not triggered for external query"
    print("  ✓ Test 2 Passed: Krill external search triggered and synthesized\n")

    # ----------------------------------------------------
    # TEST 3: Krill Network / Service Error Graceful Handling
    # ----------------------------------------------------
    print("[TEST 3/3] Krill Unavailable Graceful Fallback Test...")
    # Instantiate provider pointing to invalid host to simulate network failure
    failing_provider = KrillWebSearchProvider(api_key="invalid_key", search_url="http://127.0.0.1:9999/invalid")
    res_fail = failing_provider.search("What is the Salesforce API documentation?")
    
    print(f"  Success Flag: {res_fail['success']} (Expected: False)")
    print(f"  Error Message: {res_fail['error']}")
    assert res_fail['success'] is False, "Test 3 Failed: Error flag was not set"
    assert res_fail['results'] == [], "Test 3 Failed: Results not empty on error"
    print("  ✓ Test 3 Passed: Krill network failure handled gracefully without crashing\n")

    print("====================================")
    print("ALL KRILL INTEGRATION TESTS PASSED SUCCESSFULY!")
    print("====================================")

if __name__ == "__main__":
    run_tests()
