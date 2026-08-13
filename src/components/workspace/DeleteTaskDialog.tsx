import React, { useState } from 'react'
import { Task } from '../../types'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  task?: Task | null;
}

export const DeleteTaskDialog: React.FC<DeleteTaskDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  task
}) => {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !task) return null

  const handleDelete = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await onConfirm()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete task.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl relative z-10 overflow-hidden animate-slideUp">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-450 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          
          {/* Icon */}
          <div className="inline-flex items-center justify-center p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Delete Task</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
              Are you sure you want to delete this task? This action is permanent and cannot be undone.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2 bg-red-500/10 border border-red-500/25 rounded text-[11px] text-red-200 text-left">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-850 hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-1.5 bg-red-650 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="border-2 border-white border-t-transparent w-4 h-4 rounded-full animate-spin" />
              ) : (
                'Delete Task'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
