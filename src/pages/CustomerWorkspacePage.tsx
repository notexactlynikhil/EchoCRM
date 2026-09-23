import React, { useState } from 'react'
import { Customer, Task } from '../types'
import { useWorkspace } from '../hooks/useWorkspace'
import { OverviewTab } from '../components/workspace/OverviewTab'
import { CallsTab } from '../components/workspace/CallsTab'
import { TasksTab } from '../components/workspace/TasksTab'
import { DealsTab } from '../components/workspace/DealsTab'
import { TaskFormModal } from '../components/workspace/TaskFormModal'
import { DeleteTaskDialog } from '../components/workspace/DeleteTaskDialog'
import { ChevronRight, ArrowLeft, User, PhoneCall, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react'

interface CustomerWorkspacePageProps {
  customer: Customer;
  onBack: () => void;
}

export const CustomerWorkspacePage: React.FC<CustomerWorkspacePageProps> = ({
  customer,
  onBack
}) => {
  const {
    activeTab,
    setActiveTab,
    calls,
    recordings,
    tasks,
    deals,
    loading,
    error,
    addTask,
    editTask,
    toggleTaskComplete,
    removeTask,
    changeDealStage
  } = useWorkspace(customer.id)

  // Modals Open & Selection States
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleAddTaskClick = () => {
    setSelectedTask(null)
    setIsTaskFormOpen(true)
  }

  const handleEditTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsTaskFormOpen(true)
  }

  const handleDeleteTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDeleteTaskOpen(true)
  }

  const handleTaskFormSubmit = async (description: string, dueDate?: string) => {
    if (selectedTask) {
      await editTask(selectedTask.id, description, dueDate)
    } else {
      await addTask(description, dueDate)
    }
  }

  const handleDeleteTaskConfirm = async () => {
    if (selectedTask) {
      await removeTask(selectedTask.id)
    }
  }

  // Render tab contents based on active selection
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab customer={customer} />
      case 'calls':
        return <CallsTab calls={calls} recordings={recordings} loading={loading} customerId={customer.id} />
      case 'tasks':
        return (
          <TasksTab
            tasks={tasks}
            loading={loading}
            onAddTask={handleAddTaskClick}
            onEditTask={handleEditTaskClick}
            onDeleteTask={handleDeleteTaskClick}
            onToggleComplete={toggleTaskComplete}
          />
        )
      case 'deals':
        return (
          <DealsTab
            deals={deals}
            loading={loading}
            onChangeStage={changeDealStage}
          />
        )
      default:
        return null
    }
  }

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'deals', label: 'Deals', icon: TrendingUp }
  ] as const;

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn font-sans select-none">
      
      {/* 1. Header: Back button + Breadcrumbs */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={onBack}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition duration-150 active:scale-95"
          title="Back to Customers List"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-350 hover:underline">
            Customers
          </button>
          <ChevronRight className="w-4 h-4 text-slate-650 shrink-0" />
          <span className="text-white font-bold">{customer.name}</span>
        </div>
      </div>

      {/* 2. Error Display Panel */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Workspace Tab Selection Header */}
      <div className="flex border-b border-slate-905 shrink-0 gap-1.5">
        {tabItems.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
                isActive
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-450 hover:text-slate-300 hover:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 4. Tab Layout Container */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-2">
        {renderTabContent()}
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleTaskFormSubmit}
        task={selectedTask}
      />

      {/* Delete Task Confirmation Dialog */}
      <DeleteTaskDialog
        isOpen={isDeleteTaskOpen}
        onClose={() => setIsDeleteTaskOpen(false)}
        onConfirm={handleDeleteTaskConfirm}
        task={selectedTask}
      />

    </div>
  )
}
