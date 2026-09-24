import React, { useState } from 'react'
import { CallSummary, DealStage } from '../../types'
import { Sparkles, Calendar, Edit2, Check, X, Loader2 } from 'lucide-react'

type SummaryWithCall = CallSummary & { call?: { started_at?: string; customer_id?: string } }

interface CallInsightsProps {
  summaries: SummaryWithCall[]
  loading: boolean
  onUpdate: (id: string, updates: { summary_text?: string; deal_stage?: DealStage }) => Promise<void>
}

const STAGES: DealStage[] = ['prospecting', 'negotiation', 'closing', 'won', 'lost']

const sentimentClass = (sentiment?: string) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'negative':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

export const CallInsights: React.FC<CallInsightsProps> = ({ summaries, loading, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')
  const [draftStage, setDraftStage] = useState<DealStage>('prospecting')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (summary: SummaryWithCall) => {
    setEditingId(summary.id)
    setDraftText(summary.summary_text || '')
    setDraftStage(summary.deal_stage || 'prospecting')
    setError(null)
  }

  const save = async (id: string) => {
    setSavingId(id)
    setError(null)
    try {
      await onUpdate(id, { summary_text: draftText, deal_stage: draftStage })
      setEditingId(null)
    } catch (err: any) {
      setError(err?.message || 'Failed to save correction.')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-900/40 border border-slate-850 rounded-lg" />
        ))}
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl select-none">
        <Sparkles className="w-6 h-6 mx-auto text-slate-600 mb-2" />
        <p className="text-xs text-slate-500">No AI call summaries yet. Process a call to generate insights.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">{error}</div>}
      {summaries.map((summary) => {
        const isEditing = editingId === summary.id
        return (
          <div key={summary.id} className="glass-card p-4 rounded-xl border border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                {summary.call?.started_at ? new Date(summary.call.started_at).toLocaleString() : 'Call analysis'}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sentimentClass(summary.sentiment)}`}>
                  {summary.sentiment || 'neutral'}
                </span>
                {!isEditing ? (
                  <button
                    onClick={() => startEdit(summary)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-400 border border-slate-800 hover:border-brand-500/40 rounded-lg px-2 py-1 transition"
                    title="Correct AI output"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Correct</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => save(summary.id)}
                      disabled={savingId === summary.id}
                      className="flex items-center gap-1 text-[11px] text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 rounded-lg px-2 py-1 transition disabled:opacity-50"
                    >
                      {savingId === summary.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 border border-slate-800 rounded-lg px-2 py-1 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:border-brand-500 outline-none resize-y"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deal Stage</span>
                  <select
                    value={draftStage}
                    onChange={(e) => setDraftStage(e.target.value as DealStage)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-brand-500 outline-none capitalize"
                  >
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{summary.summary_text}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">Deal Stage:</span>
                  <span className="text-brand-400 font-bold uppercase tracking-wider">{summary.deal_stage || '—'}</span>
                  {summary.product && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{summary.product}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
