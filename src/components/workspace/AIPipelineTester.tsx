import React, { useState, useEffect } from 'react';
import { AIPipelineResponse, AIHealthResponse } from '../../types';
import { 
  Bot, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Tag, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Cpu 
} from 'lucide-react';

export const AIPipelineTester: React.FC = () => {
  const [health, setHealth] = useState<AIHealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AIPipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Krill Query state
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<any | null>(null);

  const checkAIHealth = async () => {
    setCheckingHealth(true);
    setError(null);
    try {
      if (window.ai?.checkHealth) {
        const res = await window.ai.checkHealth();
        setHealth(res);
      } else {
        setHealth({ status: 'offline', error: 'window.ai bridge is not available (running in browser mode)' });
      }
    } catch (err: any) {
      setHealth({ status: 'offline', error: err?.message || 'Failed to connect to AI bridge' });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkAIHealth();
  }, []);

  const handleProcessSampleCall = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.ai?.processSampleCall) {
        const res = await window.ai.processSampleCall();
        if (res.status === 'SUCCESS') {
          setResponse(res);
        } else {
          setError(res.metadata?.errors?.join(', ') || `AI Pipeline returned status: ${res.status}`);
          setResponse(res);
        }
      } else {
        setError('window.ai bridge unavailable. Launch EchoCRM inside Electron desktop client to run local AI processing.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing sample call');
    } finally {
      setLoading(false);
    }
  };

  const handleRunQuery = async (customPrompt?: string) => {
    const promptToRun = customPrompt || queryInput;
    if (!promptToRun.trim()) return;

    setQueryLoading(true);
    setQueryResult(null);
    try {
      if (window.ai?.query) {
        const contextStr = response?.transcript || "Sample Call Context: Alex Jenkins from APEX Global discussing EchoCRM CRM platform.";
        const res = await window.ai.query(promptToRun, contextStr);
        setQueryResult(res);
      } else {
        setError('window.ai.query bridge unavailable.');
      }
    } catch (err: any) {
      setError(err?.message || 'Query execution failed');
    } finally {
      setQueryLoading(false);
    }
  };


  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Positive</span>;
      case 'negative':
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Negative</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Neutral</span>;
    }
  };

  const getStageBadge = (stage?: string) => {
    return (
      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 capitalize">
        {stage || 'Prospecting'}
      </span>
    );
  };

  return (
    <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-5 shadow-lg backdrop-blur-sm">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Phase 1 Local AI Pipeline Bridge
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Whisper + LLaMA 3.2
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Processes audio recordings using local Python service on 127.0.0.1:8000
            </p>
          </div>
        </div>

        {/* Health Status & Run Button */}
        <div className="flex items-center gap-3">
          {/* Health Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
            <span className="font-semibold text-slate-300">
              {checkingHealth ? 'Checking AI Server...' : health?.status === 'ok' ? `AI Ready (${health.llm_model})` : 'Checking AI Server...'}
            </span>
          </div>


          <button
            onClick={handleProcessSampleCall}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition duration-150 shadow-md disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing Audio & Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Process Sample Call</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">AI Pipeline Issue</div>
            <div className="mt-0.5 opacity-90">{error}</div>
          </div>
        </div>
      )}

      {/* Results View */}
      {response && response.status === 'SUCCESS' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Metadata Cards */}
          <div className="grid grid-[#121827] grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>Audio Duration</span>
              </div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {response.metadata?.audio_duration_seconds}s
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Cpu className="w-3.5 h-3.5 text-brand-400" />
                <span>Processing Latency</span>
              </div>
              <div className="text-sm font-bold text-white mt-1 font-mono">
                {response.metadata?.processing_time_seconds}s
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Whisper Model</span>
              </div>
              <div className="text-sm font-bold text-white mt-1 uppercase">
                {response.metadata?.transcription_model}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Bot className="w-3.5 h-3.5 text-brand-400" />
                <span>Local LLM</span>
              </div>
              <div className="text-sm font-bold text-white mt-1 font-mono truncate">
                {response.metadata?.llm_model}
              </div>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              Speech-to-Text Transcript
            </h4>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
              {response.transcript}
            </div>
          </div>

          {/* Structured Call Report */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              Structured Call Report
            </h4>

            {/* Badges & Key Metadata */}
            <div className="flex items-center gap-4 flex-wrap pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Sentiment:</span>
                {getSentimentBadge(response.analysis?.sentiment)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Deal Stage:</span>
                {getStageBadge(response.analysis?.deal_stage)}
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="text-xs font-semibold text-slate-400">Executive Summary:</div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {response.analysis?.summary}
              </p>
            </div>

            {/* Customer Intent */}
            {response.analysis?.customer_intent && (
              <div>
                <div className="text-xs font-semibold text-slate-400">Customer Intent:</div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {response.analysis?.customer_intent}
                </p>
              </div>
            )}

            {/* Products Discussed */}
            {response.analysis?.products_discussed && response.analysis.products_discussed.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-400" />
                  Products Discussed:
                </div>
                <div className="flex flex-wrap gap-2">
                  {response.analysis.products_discussed.map((product, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-md font-medium">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {response.analysis?.action_items && response.analysis.action_items.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                  Action Items:
                </div>
                <div className="space-y-1.5">
                  {response.analysis.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span>{item.description}</span>
                        {item.due_date && (
                          <span className="ml-2 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            Due: {item.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow Up */}
            {response.analysis?.follow_up && (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Follow Up Required: </span>
                  <span className={response.analysis.follow_up.required ? "text-amber-400 font-bold" : "text-slate-400"}>
                    {response.analysis.follow_up.required ? "Yes" : "No"}
                  </span>
                  {response.analysis.follow_up.reason && (
                    <div className="text-slate-400 mt-0.5">
                      {response.analysis.follow_up.reason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Krill Optional Web Search Tester */}
      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Krill Optional Web Search AI Assistant
          </h4>
          <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-medium">
            Local-First Heuristic Decision Engine
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Ask internal call questions (processed 100% locally) OR external knowledge queries (triggers Krill web search automatically).
        </p>

        {/* Preset Sample Query Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500">Quick Test:</span>
          <button
            onClick={() => { setQueryInput("Summarize this call"); handleRunQuery("Summarize this call"); }}
            disabled={queryLoading}
            className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-md font-medium transition"
          >
            "Summarize this call" (Local Only)
          </button>
          <button
            onClick={() => { setQueryInput("What is Salesforce's current pricing?"); handleRunQuery("What is Salesforce's current pricing?"); }}
            disabled={queryLoading}
            className="px-2.5 py-1 text-[11px] bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded-md font-medium transition"
          >
            "What is Salesforce's current pricing?" (Triggers Krill)
          </button>
        </div>

        {/* Input Box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
            placeholder="Ask a question (e.g. 'What is the latest Salesforce API documentation?')"
            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            onClick={() => handleRunQuery()}
            disabled={queryLoading || !queryInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition shadow-md disabled:cursor-not-allowed shrink-0"
          >
            {queryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Ask AI</span>
            )}
          </button>
        </div>

        {/* Query Output View */}
        {queryResult && (
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg space-y-3 animate-fadeIn">
            {/* Status Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Query:</span>
                <span className="text-slate-200 italic font-mono">"{queryResult.query}"</span>
              </div>
              <div className="flex items-center gap-2">
                {queryResult.used_web_search ? (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    🌐 Krill Web Search Used
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    🔒 Local LLaMA Only
                  </span>
                )}
              </div>
            </div>

            {/* Answer Content */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1">Answer:</div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-3 rounded-lg border border-slate-850">
                {queryResult.answer}
              </div>
            </div>

            {/* External Search Snippets & Sources */}
            {queryResult.used_web_search && queryResult.search_results && queryResult.search_results.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Retrieved External Sources (Krill Search Results):
                </div>
                <div className="space-y-1.5">
                  {queryResult.search_results.map((res: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-cyan-400">
                        <span>[{idx + 1}] {res.title}</span>
                        {res.url && (
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-cyan-400 truncate max-w-[200px]">
                            {res.url}
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {res.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

