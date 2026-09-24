# EchoCRM CRM — Iteration 3: Krill Optional Web Search Integration Summary

## 📌 Executive Summary

Iteration 3 adds **Krill web-search capabilities** to EchoCRM's existing local AI backend as an **optional, local-first external knowledge tool**.

### Core Architecture Principle
> **Local Model First.** The system processes all standard CRM operations (call transcription, summaries, action items, sentiment analysis) 100% locally using faster-whisper and LLaMA 3.2 via Ollama. **Krill web search is only invoked when a query explicitly requires external or current web information.**

---

## 1. Files Created & Modified

### Created Files

| File | Language | Description |
| :--- | :--- | :--- |
| `ai/search/__init__.py` | Python | Package initializer for `ai.search`. |
| `ai/search/web_search.py` | Python | Abstract `WebSearchTool` interface, `KrillWebSearchProvider` implementation, and `MockWebSearchProvider` fallback. |
| `ai/analysis/smart_query.py` | Python | `SmartQueryOrchestrator` implementing local-first decision logic, Krill retrieval, strict source separation, and final LLaMA response synthesis. |
| `test_krill_search.py` | Python | Automated test suite verifying local-first query routing, Krill search invocation, and graceful failure handling. |
| `KRILL_INTEGRATION_SUMMARY.md` | Markdown | Iteration summary and documentation. |

### Modified Files

| File | Language | Changes Made |
| :--- | :--- | :--- |
| `ai/config/settings.py` | Python | Added Krill configuration options (`KRILL_API_KEY`, `KRILL_SEARCH_URL`, `KRILL_ENABLED`, `KRILL_MAX_RESULTS`). |
| `ai/server.py` | Python | Added `POST /query` endpoint for interactive query requests and added Krill health metadata to `GET /health`. |
| `main.js` | JavaScript | Added `ai:query` IPC handler bridging Electron main process to Python `POST /query`. |
| `preload.js` | JavaScript | Exposed `window.ai.query(prompt, context, enableWebSearch)` to React renderer. |
| `src/types/index.ts` | TypeScript | Added `AIQueryResult` & `WebSearchResultItem` types and updated `window.ai` type definition. |
| `src/components/workspace/AIPipelineTester.tsx` | TSX | Added interactive Krill Web Search Assistant test section with preset buttons, query input, source list display, and web search indicator badge. |

---

## 2. Architecture & Data Flow

```text
                                ECHOCRM ELECTRON
                                ┌─────────────────┐
                                │  React UI       │
                                └────────┬────────┘
                                         │ IPC (window.ai.query)
                                         ▼
                                ┌─────────────────┐
                                │  Electron IPC   │
                                └────────┬────────┘
                                         │ HTTP (POST /query)
                                         ▼
                                ┌──────────────────┐
                                │ Python AI Server │
                                └────────┬─────────┘
                                         │
                                         ▼
                               ┌──────────────────┐
                               │ SmartQuery       │
                               │ Orchestrator     │
                               └────────┬─────────┘
                                        │
                         Is External Info Required?
                         /                        \
                    NO  /                          \  YES
                       ▼                            ▼
           ┌──────────────────────┐      ┌──────────────────────┐
           │ Local LLaMA (Ollama) │      │ Krill Search Engine  │
           └──────────┬───────────┘      └──────────┬───────────┘
                      │                             │ Search Snippets
                      │                             ▼
                      │                  ┌──────────────────────┐
                      │                  │ Local LLaMA (Ollama) │
                      │                  │ Synthesis + Sources  │
                      │                  └──────────┬───────────┘
                      ▼                             ▼
                Final Response                Final Response + Sources
```

---

## 3. How the System Decides When Web Search is Needed

The system uses a **Local-First Decision Engine** in `SmartQueryOrchestrator._should_search_web()`:

1. **Internal CRM & Call Queries (Local-First)**:
   - Queries involving `"summarize"`, `"action item"`, `"concern"`, `"sentiment"`, `"deal stage"`, or `"transcript"` are classified as internal context questions.
   - **Action**: Routed **directly to local LLaMA** without making any external network or Krill search calls.

2. **External Knowledge Queries (Krill Triggered)**:
   - Queries requesting external documentation, competitor pricing, external product specs, or live web info (e.g. `"What is Salesforce's current pricing?"`, `"What is the latest Salesforce API documentation?"`) are recognized as external info queries.
   - **Action**: Formulates a clean search query, calls `KrillWebSearchProvider.search()`, injects retrieved search snippets into an `EXTERNAL WEB KNOWLEDGE` block, and passes it to LLaMA.

3. **Strict Source Separation (Requirement 9)**:
   - Context is compartmentalized into:
     - `CALL TRANSCRIPT / CRM CONTEXT`
     - `EXTERNAL WEB INFORMATION (KRILL)`
   - Prompts strictly instruct LLaMA never to confuse facts found on the web with statements spoken by the customer in the call.

---

## 4. How to Configure Krill

Krill configuration is managed via environment variables in `ai/config/settings.py` (separate from Ollama configuration):

| Environment Variable | Default | Purpose |
| :--- | :--- | :--- |
| `KRILL_ENABLED` | `true` | Enables or disables Krill web search. |
| `KRILL_API_KEY` | `""` | Krill Search API Bearer token. (If empty, falls back gracefully to `MockWebSearchProvider` for offline testing). |
| `KRILL_SEARCH_URL` | `https://api.krill.sh/v1/search` | Krill API endpoint URL. |
| `KRILL_MAX_RESULTS` | `3` | Maximum search snippets to retrieve per query. |

---

## 5. How to Test the Integration

### Test 1 — Automated Python Suite (`test_krill_search.py`)
Run:
```bash
python test_krill_search.py
```
**Validates**:
- ✅ **Test 1**: Internal call queries use local LLaMA (`used_web_search == False`).
- ✅ **Test 2**: External queries trigger Krill search (`used_web_search == True`).
- ✅ **Test 3**: Simulates Krill endpoint failure to verify graceful fallback without application crash.

### Test 2 — Normal Call Processing Independence (`test_pipeline.py`)
Run:
```bash
python test_pipeline.py
```
**Validates**:
- ✅ Offline audio transcription (Whisper) and structured report extraction (LLaMA) continue working 100% locally with zero Krill or internet dependency.

### Test 3 — Interactive Desktop UI Testing
1. Launch EchoCRM:
   ```bash
   npm run dev
   ```
2. Open any workspace, click the **Calls** tab, and test:
   - Click **"Summarize this call"** -> Executes locally (`🔒 Local LLaMA Only`).
   - Click **"What is Salesforce's current pricing?"** -> Triggers Krill (`🌐 Krill Web Search Used`).

---

## 6. Limitations

1. **API Key Dependency**: Live web search requires a valid `KRILL_API_KEY`. When unconfigured or offline, the system falls back to mock search snippets to keep development testable.
2. **Context Window Protection**: Search results are capped at `KRILL_MAX_RESULTS=3` with truncated 300-character snippets to keep local LLaMA prompt context minimal and fast.
