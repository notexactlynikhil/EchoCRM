import React from 'react'
import { Customer } from '../../types'
import { Mail, Phone, Building2, Calendar, Edit2, Trash2, User } from 'lucide-react'

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onSelect: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onSelect
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Generate name initials for avatar
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      onClick={() => onSelect(customer)}
      className="glass-card p-5 rounded-xl border border-slate-800/40 hover:border-slate-700/60 hover:shadow-xl hover:scale-[1.005] transition-all duration-200 flex flex-col justify-between h-full group relative overflow-hidden cursor-pointer"
    >
      {/* Glow highlight on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="space-y-4 relative z-10">
        {/* Header: Avatar + Name / Company */}
        <div className="flex items-start gap-3">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center font-bold text-sm select-none shrink-0 shadow-inner">
            {initials || <User className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white leading-tight truncate group-hover:text-brand-300 transition-colors" title={customer.name}>
              {customer.name}
            </h3>
            {customer.company ? (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{customer.company}</span>
              </div>
            ) : (
              <div className="text-[11px] italic text-slate-655 mt-1">No Company linked</div>
            )}
          </div>
        </div>

        {/* Contact Info (Email + Phone) */}
        <div className="space-y-2 text-xs text-slate-400 border-t border-slate-900/60 pt-3">
          {customer.email ? (
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate" title={customer.email}>
                {customer.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-550 italic">
              <Mail className="w-3.5 h-3.5 text-slate-650 shrink-0" />
              <span>No email provided</span>
            </div>
          )}

          {customer.phone ? (
            <div className="flex items-center gap-2 truncate">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{customer.phone}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-550 italic">
              <Phone className="w-3.5 h-3.5 text-slate-655 shrink-0" />
              <span>No phone number</span>
            </div>
          )}
        </div>

        {/* Metadata: Created At */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-650" />
          <span>Added: {formatDate(customer.created_at)}</span>
        </div>
      </div>

      {/* Footer: Tags & Actions Row */}
      <div className="flex items-center justify-between mt-4 border-t border-slate-900/60 pt-3 relative z-10">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 max-w-[70%]">
          {customer.tags && customer.tags.length > 0 ? (
            customer.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="bg-brand-500/10 text-brand-400 border border-brand-500/10 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-600 italic">No tags</span>
          )}
          {customer.tags && customer.tags.length > 2 && (
            <span className="bg-slate-900 text-slate-500 text-[9px] font-bold px-1 py-0.5 rounded border border-slate-850">
              +{customer.tags.length - 2}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit Customer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(customer);
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
            title="Delete Customer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
