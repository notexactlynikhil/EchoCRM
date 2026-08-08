import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { DashboardLayout, TabType } from './layouts/DashboardLayout'
import { RealtimeSyncProvider } from './contexts/RealtimeSyncContext'
import { DashboardPage } from './pages/DashboardPage'
import { CustomersPage } from './pages/CustomersPage'
import { GlobalTasksPage } from './pages/GlobalTasksPage'
import { Settings as SettingsIcon } from 'lucide-react'

const AppContent: React.FC = () => {
  const { session, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-brand-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xs font-semibold tracking-wider text-brand-400 uppercase animate-pulse">
          Loading Echo CRM...
        </p>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  // Helper renderer for active page contents
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage 
            onNavigateToCustomers={() => setActiveTab('customers')}
            onNavigateToTasks={() => setActiveTab('tasks')}
          />
        )
      case 'customers':
        return <CustomersPage />
      case 'tasks':
        return <GlobalTasksPage />
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 select-none">
            <div className="p-4 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-full">
              <SettingsIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white text-sans">Application Settings</h2>
              <p className="text-sm text-slate-400 max-w-sm">
                Desktop interface credentials, profile themes, and API details.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <RealtimeSyncProvider>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex-1 min-h-0 h-full animate-fadeIn transition-opacity duration-200">
          {renderContent()}
        </div>
      </DashboardLayout>
    </RealtimeSyncProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
