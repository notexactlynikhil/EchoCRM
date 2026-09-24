import React from 'react'
import { Customer, CallSummary, DealStage } from '../../types'
import { CallInsights } from './CallInsights'
import { Mail, Phone, Building2, Calendar, Shield, Sparkles } from 'lucide-react'

type SummaryWithCall = CallSummary & { call?: { started_at?: string; customer_id?: string } }

interface OverviewTabProps {
  customer: Customer;
  summaries?: SummaryWithCall[];
  summariesLoading?: boolean;
  onUpdateSummary?: (id: string, updates: { summary_text?: string; deal_stage?: DealStage }) => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  customer,
  summaries = [],
  summariesLoading = false,
  onUpdateSummary
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const items = [
    { label: 'Email Address', value: customer.email, icon: Mail, type: 'email' },
    { label: 'Phone Number', value: customer.phone, icon: Phone, type: 'phone' },
    { label: 'Company / Brokerage', value: customer.company, icon: Building2, type: 'text' },
    { label: 'Profile Registered', value: formatDate(customer.created_at), icon: Calendar, type: 'text' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      {/* Left Columns: Metadata list */}
      <div className="lg:col-span-2 bg-slate-900/20 border border-slate-800/60 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans mb-2">Customer Profile</h3>
        
        <div className="divide-y divide-slate-800/80">
          {items.map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="grid grid-cols-3 py-3.5 first:pt-0 last:pb-0 items-start">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span>{item.label}</span>
                </span>
                
                <span className="col-span-2 text-sm text-slate-200 break-all pl-2 font-medium">
                  {item.value ? (
                    item.type === 'email' ? (
                      <a href={`mailto:${item.value}`} className="text-brand-400 hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )
                  ) : (
                    <span className="text-slate-500 italic text-xs">Not specified</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Column: Tags & Info Card */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span>Assigned Tags</span>
          </h3>
          
          <div className="flex flex-wrap gap-1.5">
            {customer.tags && customer.tags.length > 0 ? (
              customer.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="bg-brand-500/10 text-brand-400 border border-brand-500/10 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">No tags assigned to this customer.</span>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/40 border border-slate-800/40 rounded-lg text-[11px] text-slate-400/90 leading-relaxed font-sans mt-auto">
          Use the edit drawer on the Customers directory page to modify fields or tag classifications.
        </div>
      </div>
    </div>

    {/* AI Call Insights with manual correction */}
    <section className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-brand-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Call Insights</h3>
        <span className="text-[10px] text-slate-500 font-normal normal-case">Correct the summary or deal stage if the local model got it wrong.</span>
      </div>
      <CallInsights summaries={summaries} loading={summariesLoading} onUpdate={onUpdateSummary!} />
    </section>
    </div>
  )
}
