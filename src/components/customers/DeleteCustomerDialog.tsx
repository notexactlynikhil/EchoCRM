import React, { useState } from 'react'
import { Customer } from '../../types'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  customer?: Customer | null;
}

export const DeleteCustomerDialog: React.FC<DeleteCustomerDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customer
}) => {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !customer) return null

  const handleDelete = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      await onConfirm()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete customer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none animate-fadeIn">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-slideUp">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-450 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dialog Body */}
        <div className="p-6 text-center space-y-4">
          
          {/* Warning Icon Banner */}
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Delete Customer</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">{customer.name}</span>? This action is permanent.
            </p>
          </div>

          {/* Alert Message */}
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-left text-[11px] text-red-200/80 leading-normal">
            <strong>Warning:</strong> Deleting this customer will automatically remove all associated calls, transcripts, deals, and tasks under database cascade rules.
          </div>

          {/* Error Message (if failed) */}
          {errorMsg && (
            <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-255 text-xs text-left">
              {errorMsg}
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-950/20 transition flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="border-2 border-white border-t-transparent w-4 h-4 rounded-full animate-spin" />
              ) : (
                'Delete User'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
