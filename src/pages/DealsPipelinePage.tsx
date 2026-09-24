import React, { useEffect, useState } from 'react'
import { Deal, DealStage } from '../types'
import { getAllDeals, updateDealStage } from '../services/workspaceService'
import { useRealtimeSync } from '../contexts/RealtimeSyncContext'
import { RefreshCw, AlertCircle, TrendingUp, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

const STAGES: { value: DealStage; label: string; accent: string }[] = [
  { value: 'prospecting', label: 'Prospecting', accent: 'border-t-slate-500' },
  { value: 'negotiation', label: 'Negotiation', accent: 'border-t-blue-500' },
  { value: 'closing', label: 'Closing', accent: 'border-t-amber-500' },
  { value: 'won', label: 'Won', accent: 'border-t-emerald-500' },
  { value: 'lost', label: 'Lost', accent: 'border-t-red-500' }
]

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0)

export const DealsPipelinePage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useRealtimeSync()

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      setDeals(await getAllDeals())
    } catch (err: any) {
      setError(err?.message || 'Unable to load the deal pipeline.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.table !== 'deals') return
      if (event.eventType === 'INSERT') {
        setDeals((prev) => (prev.some((d) => d.id === event.newRecord.id) ? prev : [event.newRecord, ...prev]))
      } else if (event.eventType === 'UPDATE') {
        setDeals((prev) => prev.map((d) => (d.id === event.newRecord.id ? { ...d, ...event.newRecord } : d)))
      } else if (event.eventType === 'DELETE') {
        setDeals((prev) => prev.filter((d) => d.id !== event.oldRecord.id))
      }
    })
    return () => unsubscribe()
  }, [subscribe])

  const moveDeal = async (deal: Deal, direction: -1 | 1) => {
    const index = STAGES.findIndex((s) => s.value === deal.stage)
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= STAGES.length) return
    const nextStage = STAGES[nextIndex].value
    const previous = deals
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: nextStage } : d)))
    try {
      await updateDealStage(deal.id, nextStage)
    } catch (err: any) {
      setDeals(previous)
      setError(err?.message || 'Unable to update deal stage.')
    }
  }

  const changeStage = async (deal: Deal, stage: DealStage) => {
    const previous = deals
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage } : d)))
    try {
      await updateDealStage(deal.id, stage)
    } catch (err: any) {
      setDeals(previous)
      setError(err?.message || 'Unable to update deal stage.')
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center select-none shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Deal Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">Track listings and deals through every stage</p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60 rounded-xl text-slate-400 hover:text-slate-200 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-x-auto min-h-0 pb-2">
        <div className="grid grid-cols-5 gap-4 min-w-[1000px] h-full">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.value)
            const total = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
            return (
              <div key={stage.value} className={`bg-slate-900/25 border border-slate-800/60 border-t-4 ${stage.accent} rounded-xl flex flex-col min-h-0`}>
                <div className="p-3 border-b border-slate-800/60 space-y-1 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{stage.label}</span>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{stageDeals.length}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400 font-mono">{formatCurrency(total)}</div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                  {stageDeals.length === 0 ? (
                    <div className="text-[11px] text-slate-600 text-center py-6 italic">No deals</div>
                  ) : (
                    stageDeals.map((deal) => {
                      const index = STAGES.findIndex((s) => s.value === deal.stage)
                      return (
                        <div key={deal.id} className="glass-card p-3 rounded-lg border border-slate-800/60 space-y-2 hover:border-slate-700 transition">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                            <span className="text-xs font-bold text-white leading-snug break-words min-w-0">{deal.product}</span>
                          </div>
                          {deal.customer?.name && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{deal.customer.name}</span>
                            </div>
                          )}
                          <div className="text-xs font-semibold text-emerald-400 font-mono">{formatCurrency(Number(deal.value))}</div>

                          <select
                            value={deal.stage}
                            onChange={(e) => changeStage(deal, e.target.value as DealStage)}
                            className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-1 focus:border-brand-500 outline-none"
                          >
                            {STAGES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>

                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => moveDeal(deal, -1)}
                              disabled={index === 0}
                              className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Move back"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveDeal(deal, 1)}
                              disabled={index === STAGES.length - 1}
                              className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Advance"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
