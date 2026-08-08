import React, { useState, useEffect, useCallback } from 'react'
import { Task } from '../types'
import { getGlobalTasks, updateTask, deleteTask } from '../services/workspaceService'
import { TaskFormModal } from '../components/workspace/TaskFormModal'
import { DeleteTaskDialog } from '../components/workspace/DeleteTaskDialog'
import { CheckSquare, Calendar, Edit2, Trash2, CheckCircle2, Circle, AlertCircle, Building2 } from 'lucide-react'
import { useRealtimeSync } from '../contexts/RealtimeSyncContext'
import { supabase } from '../supabase/client'

// Helper for task sorting
const taskSortFn = (a: Task, b: Task) => {
  if (!a.due_date && !b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
};

type GlobalTask = Task & { customer?: { name: string } };

export const GlobalTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<GlobalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useRealtimeSync()

  // Edit / Delete states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<GlobalTask | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGlobalTasks()
      setTasks(data)
    } catch (err: any) {
      setError(err?.message || 'Unable to retrieve tasks pipeline.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Realtime subscription listener
  useEffect(() => {
    const unsubscribe = subscribe(async (event) => {
      if (event.table !== 'tasks') return;

      if (event.eventType === 'DELETE') {
        setTasks((prev) => prev.filter((t) => t.id !== event.oldRecord.id));
      } else if (event.eventType === 'UPDATE') {
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === event.newRecord.id);
          if (exists) {
            return prev.map((t) => {
              if (t.id === event.newRecord.id) {
                return { ...t, ...event.newRecord };
              }
              return t;
            }).sort(taskSortFn);
          }
          return prev;
        });
      } else if (event.eventType === 'INSERT') {
        try {
          // Fetch task details with joined customer name to display on global page
          const { data, error: fetchErr } = await supabase
            .from('tasks')
            .select('*, customer:customers(name)')
            .eq('id', event.newRecord.id)
            .single();

          if (!fetchErr && data) {
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === data.id);
              if (exists) return prev;
              return [...prev, data].sort(taskSortFn);
            });
          }
        } catch (e) {
          console.error('Error fetching realtime task customer:', e);
        }
      }
    });

    return () => {
      unsubscribe()
    };
  }, [subscribe])

  const handleToggleComplete = async (task: GlobalTask) => {
    const nextStatus = task.status === 'pending' ? 'done' : 'pending';
    const originalTasks = [...tasks];
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

    try {
      await updateTask(task.id, { status: nextStatus })
    } catch (err: any) {
      // Revert on failure
      setTasks(originalTasks)
      setError(err?.message || 'Failed to update task state.')
    }
  }

  const handleEditClick = (task: GlobalTask) => {
    setSelectedTask(task)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (task: GlobalTask) => {
    setSelectedTask(task)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (description: string, dueDate?: string) => {
    if (!selectedTask) return
    try {
      const updated = await updateTask(selectedTask.id, { description, due_date: dueDate || undefined })
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...updated } : t))
    } catch (err: any) {
      setError(err?.message || 'Failed to update task details.')
      throw err;
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTask) return
    try {
      await deleteTask(selectedTask.id)
      setTasks(prev => prev.filter(t => t.id !== selectedTask.id))
    } catch (err: any) {
      setError(err?.message || 'Failed to delete task.')
      throw err;
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (task: GlobalTask) => {
    if (task.status === 'done' || !task.due_date) return false
    const due = new Date(task.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse select-none font-sans">
        <div className="h-10 w-48 bg-slate-800 rounded-xl mb-4"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-900/40 border border-slate-850 rounded-lg"></div>
        ))}
      </div>
    )
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const completedTasks = tasks.filter(t => t.status === 'done')

  return (
    <div className="space-y-6 flex flex-col h-full animate-fadeIn font-sans select-none">
      
      {/* 1. Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">Tasks Pipeline</h1>
        <p className="text-sm text-slate-400 mt-1">Review and manage tasks across all client accounts</p>
      </div>

      {/* 2. Error Message */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs shrink-0">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Task Sections List */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1">
        
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <div className="p-4 bg-slate-800/40 text-slate-500 border border-slate-750 rounded-full mb-3">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-350">No tasks created yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center leading-relaxed">
              Create customer tasks by opening any client folder in the Customers directory and clicking the Tasks tab.
            </p>
          </div>
        ) : (
          <>
            {/* Section A: Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Active Tasks ({pendingTasks.length})
                </h3>
                <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl divide-y divide-slate-800/60 overflow-hidden">
                  {pendingTasks.map(task => {
                    const overdue = isOverdue(task)
                    return (
                      <div key={task.id} className="flex items-start justify-between p-4 hover:bg-slate-900/25 transition duration-150 group gap-4">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleComplete(task)}
                            className="mt-0.5 text-slate-550 hover:text-brand-400 transition shrink-0"
                          >
                            <Circle className="w-4.5 h-4.5 hover:scale-105 transition-transform" />
                          </button>
                          <div className="min-w-0 space-y-1.5">
                            <p className="text-sm font-medium text-slate-200 leading-snug break-words">
                              {task.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              {/* Customer tag */}
                              {task.customer?.name && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                                  <span>{task.customer.name}</span>
                                </span>
                              )}
                              {/* Due Date */}
                              {task.due_date && (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide ${
                                  overdue ? 'text-red-400 font-bold' : 'text-slate-500'
                                }`}>
                                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                                  <span>Due: {formatDate(task.due_date)}</span>
                                  {overdue && <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-extrabold px-1 rounded ml-1">Overdue</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                          <button
                            onClick={() => handleEditClick(task)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(task)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section B: Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Completed Tasks ({completedTasks.length})
                </h3>
                <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl divide-y divide-slate-800/60 overflow-hidden opacity-75 hover:opacity-100 transition-opacity duration-200">
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-start justify-between p-4 hover:bg-slate-900/25 transition duration-150 group gap-4 bg-slate-950/10">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggleComplete(task)}
                          className="mt-0.5 text-brand-500 shrink-0"
                        >
                          <CheckCircle2 className="w-4.5 h-4.5 fill-brand-500/10" />
                        </button>
                        <div className="min-w-0 space-y-1.5">
                          <p className="text-sm font-normal text-slate-500 line-through leading-snug break-words">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-3">
                            {task.customer?.name && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                <Building2 className="w-3.5 h-3.5 text-slate-700" />
                                <span>{task.customer.name}</span>
                              </span>
                            )}
                            {task.due_date && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 tracking-wide">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="p-1.5 text-slate-650 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Edit Form Modal */}
      {selectedTask && (
        <TaskFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedTask(null)
          }}
          onSubmit={handleFormSubmit}
          task={selectedTask}
        />
      )}

      {/* Delete Confirmation */}
      {selectedTask && (
        <DeleteTaskDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false)
            setSelectedTask(null)
          }}
          onConfirm={handleDeleteConfirm}
          task={selectedTask}
        />
      )}

    </div>
  )
}
