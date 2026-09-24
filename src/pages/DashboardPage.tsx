import React, { useEffect, useState } from 'react'
import { fetchDashboardData, DashboardData, fetchDealStageBreakdown, fetchCallsPerDay, StageBreakdown, CallsPerDay } from '../services/db'
import { DashboardCharts } from '../components/dashboard/DashboardCharts'
import { 
  Users, 
  CheckSquare, 
  TrendingUp, 
  PhoneCall, 
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

interface DashboardPageProps {
  onNavigateToCustomers?: () => void;
  onNavigateToTasks?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToCustomers,
  onNavigateToTasks
}) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [stageBreakdown, setStageBreakdown] = useState<StageBreakdown[]>([])
  const [callsPerDay, setCallsPerDay] = useState<CallsPerDay[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    setErrorMsg(null)
    try {
      const [result, stages, calls] = await Promise.all([
        fetchDashboardData(),
        fetchDealStageBreakdown(),
        fetchCallsPerDay(14)
      ])
      setData(result)
      setStageBreakdown(stages)
      setCallsPerDay(calls)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData(true)
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val)
  }

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Map deal stage to human readable text & style classes
  const getStageBadge = (stage: string) => {
    const mappings: Record<string, { label: string; classes: string }> = {
      prospecting: { label: 'Prospecting', classes: 'bg-slate-800 text-slate-300 border-slate-700/50' },
      negotiation: { label: 'Negotiation', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      closing: { label: 'Closing', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      won: { label: 'Won', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      lost: { label: 'Lost', classes: 'bg-red-500/10 text-red-400 border-red-500/20' }
    }
    return mappings[stage] || { label: stage, classes: 'bg-slate-800 text-slate-300' }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-800 rounded-lg"></div>
            <div className="h-4 w-64 bg-slate-800 rounded-lg"></div>
          </div>
          <div className="h-10 w-24 bg-slate-800 rounded-lg"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/50 border border-slate-850 rounded-xl p-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-800 rounded"></div>
                <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
              </div>
              <div className="h-8 w-12 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-slate-900/50 border border-slate-850 rounded-xl p-6"></div>
            <div className="h-64 bg-slate-900/50 border border-slate-850 rounded-xl p-6"></div>
          </div>
          <div className="h-[544px] bg-slate-900/50 border border-slate-850 rounded-xl p-6"></div>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Failed to load Dashboard</h2>
          <p className="text-sm text-slate-400 max-w-sm">{errorMsg}</p>
        </div>
        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-sm text-slate-200 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    )
  }

  const { stats, recentCustomers, pendingTasks, activeDeals } = data!

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time overview of your CRM pipeline</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center p-2.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60 rounded-xl text-slate-400 hover:text-slate-200 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Customers */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-blue-500">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="text-3xl font-bold text-white">{stats.totalCustomers}</div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="text-3xl font-bold text-white">{stats.pendingTasksCount}</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Active Deals */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deals</span>
            <div className="text-3xl font-bold text-white">{stats.activeDealsCount}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Calls */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-indigo-500">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Calls</span>
            <div className="text-3xl font-bold text-white">{stats.todayCallsCount}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts */}
      <DashboardCharts stageBreakdown={stageBreakdown} callsPerDay={callsPerDay} />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column (Active Deals & Recent Customers) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Deals Panel */}
          <section className="glass-panel rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Active Deals</h2>
              <span className="text-xs font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                Pipeline
              </span>
            </div>
            
            {activeDeals.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500">No active deals in your pipeline.</p>
              </div>
            ) : (
              <div className="overflow-x-auto min-w-full">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-850 text-left font-semibold">
                      <th className="pb-3 pr-4">Property / Listing</th>
                      <th className="pb-3 px-4">Customer</th>
                      <th className="pb-3 px-4">Stage</th>
                      <th className="pb-3 pl-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {activeDeals.map((deal) => {
                      const badge = getStageBadge(deal.stage)
                      return (
                        <tr key={deal.id} className="text-slate-300 hover:bg-slate-900/10 transition">
                          <td className="py-3 pr-4 font-semibold text-white truncate max-w-[140px]" title={deal.product}>
                            {deal.product}
                          </td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">
                            {deal.customer?.name || 'Unknown'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badge.classes}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right font-semibold text-emerald-400">
                            {formatCurrency(deal.value)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Customers Panel */}
          <section className="glass-panel rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Recent Customers</h2>
              <button 
                onClick={onNavigateToCustomers}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-0.5 hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentCustomers.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500">No customers registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentCustomers.map((cust) => (
                  <div key={cust.id} className="glass-card p-4 rounded-xl border border-slate-800/40 hover:border-slate-700/60 hover:shadow-lg transition space-y-3">
                    <div className="flex justify-between items-start min-w-0">
                      <h3 className="font-bold text-white truncate text-sm" title={cust.name}>{cust.name}</h3>
                    </div>
                    
                    <div className="space-y-1.5 text-xs text-slate-400">
                      {cust.company && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cust.company}</span>
                        </div>
                      )}
                      {cust.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{cust.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags row */}
                    {cust.tags && cust.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cust.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="bg-brand-500/10 text-brand-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-brand-500/20 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column (Pending Tasks) */}
        <section className="glass-panel rounded-xl p-5 flex flex-col h-fit space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Pending Tasks</h2>
            <button
              onClick={onNavigateToTasks}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-0.5 hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm text-slate-500">All caught up! No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="glass-card p-4 rounded-xl border border-slate-850 hover:border-slate-800 flex items-start gap-3 transition">
                  <div className="mt-0.5 border border-slate-700 w-4 h-4 rounded flex items-center justify-center shrink-0 cursor-not-allowed">
                    {/* Placeholder status icon */}
                    <div className="w-1.5 h-1.5 bg-transparent rounded" />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-200 leading-snug break-words">
                      {task.description}
                    </p>
                    
                    <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                      {task.customer && (
                        <div className="truncate">
                          For: <span className="text-slate-400 font-medium">{task.customer.name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-650" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
