import React from 'react'
import { Search, ArrowUpDown } from 'lucide-react'

interface CustomerSearchProps {
  search: string;
  onSearchChange: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  search,
  onSearchChange,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full select-none">
      
      {/* 1. Search Bar */}
      <div className="relative w-full sm:max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/10 focus:outline-none rounded-xl text-sm text-slate-100 transition duration-150"
        />
      </div>

      {/* 2. Sort Selection */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sort by name:</span>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 shadow-inner">
          {/* A-Z Button */}
          <button
            onClick={() => onSortOrderChange('asc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              sortOrder === 'asc'
                ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>A–Z</span>
          </button>
          {/* Z-A Button */}
          <button
            onClick={() => onSortOrderChange('desc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              sortOrder === 'desc'
                ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 rotate-180" />
            <span>Z–A</span>
          </button>
        </div>
      </div>

    </div>
  )
}
