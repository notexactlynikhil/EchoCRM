import React from 'react'
import { Deal, DealStage } from '../../types'
import { TrendingUp, Calendar, DollarSign, Tag } from 'lucide-react'

interface DealsTabProps {
  deals: Deal[];
  loading: boolean;
  onChangeStage: (dealId: string, stage: DealStage) => void;
}

export const DealsTab: React.FC<DealsTabProps> = ({
  deals,
  loading,
  onChangeStage
}) => {
  const stages: { value: DealStage; label: string }[] = [
    { value: 'prospecting', label: 'Prospecting' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'closing', label: 'Closing' },
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No close date'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Soft badge color selector for stages
  const getStageColor = (stage: string) => {
    const mappings: Record<string, string> = {
      prospecting: 'text-slate-400 border-slate-700/50 bg-slate-800/10',
      negotiation: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
      closing: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      won: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
      lost: 'text-red-400 border-red-500/20 bg-red-500/5'
    };
    return mappings[stage] || 'text-slate-300 border-slate-700 bg-slate-800/5';
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-900/40 border border-slate-850 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 select-none">
        <div className="p-3.5 bg-slate-800/40 text-slate-500 border border-slate-750 rounded-xl mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-350">No deals in pipeline</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
          Deals appear here automatically when a call discusses a property. Track valuations and expectations for this customer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Sub header */}
      <div className="flex items-center justify-between select-none">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Deals List ({deals.length})
        </span>
      </div>

      {/* Grid of Deals */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
        {deals.map((deal) => (
          <div key={deal.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-slate-900/25 transition">
            
            {/* Left: Product + Expected Date */}
            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white leading-tight truncate" title={deal.product}>
                {deal.product}
              </h4>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-550">
                <Calendar className="w-3.5 h-3.5" />
                <span>Target Close: {formatDate(deal.expected_close_date)}</span>
              </div>
            </div>

            {/* Middle/Right: Valuation + Stage select */}
            <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 select-none">
              
              {/* Valuation */}
              <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-400 font-mono">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>{formatCurrency(deal.value)}</span>
              </div>

              {/* Custom Stage Selector */}
              <div className="relative flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <select
                  value={deal.stage}
                  onChange={(e) => onChangeStage(deal.id, e.target.value as DealStage)}
                  className={`pl-2 pr-6 py-1 border rounded text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-brand-500/30 cursor-pointer transition ${getStageColor(deal.stage)}`}
                  style={{
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                    backgroundSize: '10px'
                  }}
                >
                  {stages.map((st) => (
                    <option key={st.value} value={st.value} className="bg-slate-900 text-slate-350 text-xs">
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
