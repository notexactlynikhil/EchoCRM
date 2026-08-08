import React, { useState, useEffect } from 'react'
import { Task } from '../../types'
import { X, Calendar, FileText, AlertCircle } from 'lucide-react'

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, dueDate?: string) => Promise<void>;
  task?: Task | null; // If provided, we are in Edit Mode
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task
}) => {
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Populate fields on open
  useEffect(() => {
    if (isOpen) {
      setValidationError(null)
      if (task) {
        setDescription(task.description)
        // Convert timestamp to YYYY-MM-DD for date input
        setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '')
      } else {
        setDescription('')
        setDueDate('')
      }
    }
  }, [task, isOpen])

  if (!isOpen) return null

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!description.trim()) {
      setValidationError('Please enter a description for the task.')
      return
    }

    setLoading(true)

    try {
      // Pass raw string. DB handles conversions
      await onSubmit(description.trim(), dueDate || undefined)
      onClose()
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save task details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-850 flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wide">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-450 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
          
          {/* Error Message */}
          {validationError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
              Task Description <span className="text-brand-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-slate-500">
                <FileText className="w-4.5 h-4.5" />
              </span>
              <textarea
                required
                rows={3}
                placeholder="What needs to be done?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800/80 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/10 focus:outline-none rounded-lg text-slate-100 text-sm transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Due Date</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Calendar className="w-4.5 h-4.5" />
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800/80 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/10 focus:outline-none rounded-lg text-slate-100 text-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="border-2 border-white border-t-transparent w-4 h-4 rounded-full animate-spin" />
              ) : (
                task ? 'Save Changes' : 'Add Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
