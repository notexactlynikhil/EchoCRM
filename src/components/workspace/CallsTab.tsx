import React from 'react'
import { Call } from '../../types'
import { PhoneCall, Calendar, Clock, Info } from 'lucide-react'
import { AIPipelineTester } from './AIPipelineTester'

interface CallsTabProps {
  calls: Call[];
  loading: boolean;
}

export const CallsTab: React.FC<CallsTabProps> = ({ calls, loading }) => {
  
  // Format call duration helper (e.g. 300s -> "5:00")
  const formatDuration = (totalSeconds?: number) => {
    if (totalSeconds === undefined) return '--:--'
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const mappings: Record<string, { label: string; classes: string }> = {
      recording: { label: 'Recording', classes: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' },
      processing: { label: 'Processing', classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      done: { label: 'Completed', classes: 'bg-slate-800 text-slate-400 border-slate-700/50' }
    };
    return mappings[status] || { label: status, classes: 'bg-slate-850 text-slate-300' };
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Local AI Pipeline Integration Tester */}
      <AIPipelineTester />

      {calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 select-none">
          <div className="p-3.5 bg-slate-800/40 text-slate-500 border border-slate-750 rounded-xl mb-3">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-350">No CRM calls recorded yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
            There are no audio captures linked to this account. Use the AI Tester above to process a sample call locally.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-brand-500/5 border border-brand-500/10 rounded-lg text-slate-400 text-xs leading-normal">
            <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>
              <strong>Call Records:</strong> Below are customer call records from Supabase.
            </span>
          </div>


      {/* List */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
        {calls.map((call) => {
          const badge = getStatusBadge(call.status)
          return (
            <div key={call.id} className="flex items-center justify-between p-4 hover:bg-slate-900/25 transition duration-150">
              
              {/* Left Column: Icon + Started Time */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 shrink-0">
                  <PhoneCall className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-550 shrink-0" />
                    <span>{formatDate(call.started_at)}</span>
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1 leading-none">
                    ID: <span className="font-mono">{call.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Duration + Status Badge */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Duration */}
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatDuration(call.duration_seconds)}</span>
                </div>
                {/* Status */}
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 border rounded uppercase tracking-wider ${badge.classes}`}>
                  {badge.label}
                </span>
              </div>

              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}

