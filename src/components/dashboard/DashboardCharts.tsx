import React from 'react'
import { StageBreakdown, CallsPerDay } from '../../services/db'
import { BarChart3, Activity } from 'lucide-react'

interface DashboardChartsProps {
  stageBreakdown: StageBreakdown[]
  callsPerDay: CallsPerDay[]
}

const STAGE_COLORS: Record<string, string> = {
  prospecting: 'bg-slate-500',
  negotiation: 'bg-blue-500',
  closing: 'bg-amber-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500'
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ stageBreakdown, callsPerDay }) => {
  const maxStageCount = Math.max(1, ...stageBreakdown.map((s) => s.count))
  const maxCalls = Math.max(1, ...callsPerDay.map((c) => c.count))

  // Build an SVG polyline for calls-per-day
  const chartWidth = 520
  const chartHeight = 120
  const stepX = callsPerDay.length > 1 ? chartWidth / (callsPerDay.length - 1) : chartWidth
  const points = callsPerDay
    .map((c, i) => {
      const x = i * stepX
      const y = chartHeight - (c.count / maxCalls) * (chartHeight - 16) - 8
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Deals by stage */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Deals by Stage</h2>
        </div>

        <div className="space-y-3">
          {stageBreakdown.map((stage) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 capitalize">{stage.stage}</span>
                <span className="text-slate-500">
                  {stage.count} · {formatCurrency(stage.value)}
                </span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${STAGE_COLORS[stage.stage] || 'bg-slate-500'}`}
                  style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Calls per day */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Calls (last {callsPerDay.length} days)</h2>
        </div>

        {callsPerDay.every((c) => c.count === 0) ? (
          <div className="py-10 text-center border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm text-slate-500">No calls logged in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="callsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                fill="url(#callsFill)"
              />
              <polyline points={points} fill="none" stroke="rgb(99,102,241)" strokeWidth="2" />
              {callsPerDay.map((c, i) => (
                <circle
                  key={c.date}
                  cx={i * stepX}
                  cy={chartHeight - (c.count / maxCalls) * (chartHeight - 16) - 8}
                  r="2.5"
                  fill="rgb(129,140,248)"
                />
              ))}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>{callsPerDay[0]?.date.slice(5)}</span>
              <span>{callsPerDay[callsPerDay.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
