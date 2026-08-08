import React from 'react'
import { Task } from '../../types'
import { Plus, Calendar, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react'

interface TasksTabProps {
  tasks: Task[];
  loading: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleComplete: (taskId: string, currentStatus: 'pending' | 'done') => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  loading,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete
}) => {

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No due date'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Check if a task is overdue (if pending and due_date < today)
  const isOverdue = (task: Task) => {
    if (task.status === 'done' || !task.due_date) return false
    const due = new Date(task.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center py-2">
          <div className="h-4 w-28 bg-slate-800 rounded"></div>
          <div className="h-8 w-20 bg-slate-800 rounded-lg"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-900/40 border border-slate-850 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 select-none animate-fadeIn">
      {/* Tab Sub-Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Tasks Checklist ({tasks.filter(t => t.status === 'done').length} / {tasks.length})
        </span>
        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-brand-400 hover:text-brand-300 rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Checklist grid */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
          <div className="p-3.5 bg-slate-800/40 text-slate-500 border border-slate-750 rounded-xl mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-350">No tasks defined</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
            All caught up! Create actionable items to follow up on this customer account.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
          {tasks.map((task) => {
            const isCompleted = task.status === 'done'
            const overdue = isOverdue(task)
            
            return (
              <div 
                key={task.id} 
                className={`flex items-start justify-between p-3.5 hover:bg-slate-900/25 transition duration-150 group gap-4 ${
                  isCompleted ? 'bg-slate-950/10' : ''
                }`}
              >
                
                {/* Left: Checkbox + Description + Due Date */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  
                  {/* Custom Checkbox Button */}
                  <button
                    onClick={() => onToggleComplete(task.id, task.status)}
                    className="mt-0.5 text-slate-550 hover:text-brand-400 focus:outline-none transition shrink-0"
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-brand-500 fill-brand-500/10" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 hover:scale-105 transition-transform" />
                    )}
                  </button>

                  {/* Task details */}
                  <div className="min-w-0 space-y-1">
                    <p className={`text-sm leading-snug break-words transition-all font-medium ${
                      isCompleted 
                        ? 'line-through text-slate-500 font-normal' 
                        : 'text-slate-200'
                    }`}>
                      {task.description}
                    </p>
                    
                    {/* Due Date Indicator */}
                    {task.due_date && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide ${
                        isCompleted 
                          ? 'text-slate-600' 
                          : overdue 
                            ? 'text-red-400 font-bold' 
                            : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Due: {formatDate(task.due_date)}</span>
                        {overdue && <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-extrabold px-1 rounded uppercase tracking-wider ml-1">Overdue</span>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Visible on row hover) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                  {/* Edit */}
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition"
                    title="Edit Task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => onDeleteTask(task)}
                    className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded transition"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
