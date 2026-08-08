import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtimeSync } from '../contexts/RealtimeSyncContext'
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Settings as SettingsIcon, 
  LogOut, 
  ShieldCheck
} from 'lucide-react'

export type TabType = 'dashboard' | 'customers' | 'tasks' | 'settings';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab 
}) => {
  const { user, signOut } = useAuth()
  const { status: syncStatus } = useRealtimeSync()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  // Extract first letter of name or email for profile fallback avatar
  const displayName = user?.user_metadata?.name || 'User';
  const displayEmail = user?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      alert('Failed to log out: ' + error.message)
    }
  }

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Left Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900/50 border-r border-slate-900 flex flex-col justify-between p-4 relative z-20">
        
        {/* Top: Logo & Navigation */}
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="p-1.5 bg-brand-600/10 text-brand-400 rounded-lg border border-brand-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Echo CRM</h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Desktop Client</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                    isActive 
                      ? 'bg-brand-600/10 text-brand-400 border-l-2 border-brand-500 pl-2.5' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom: Profile & Logout */}
        <div className="space-y-4 pt-4 border-t border-slate-900">
          {/* Realtime Status Badge */}
          <div className="flex items-center gap-2 px-2 select-none">
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === 'connected' 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : syncStatus === 'connecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-red-500'
            }`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {syncStatus === 'connected' 
                ? 'Live Sync' 
                : syncStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Offline'}
            </span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30">
            {/* Avatar Circle */}
            <div className="w-9 h-9 rounded-full bg-brand-600/20 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm select-none shadow-sm shrink-0">
              {avatarLetter}
            </div>
            {/* Info */}
            <div className="min-w-0 overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">
                {displayEmail}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all duration-150 border border-transparent hover:border-red-900/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-8 relative min-w-0">
        {/* Subtle background glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-500/5 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none z-0" />

        {/* Content container */}
        <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
