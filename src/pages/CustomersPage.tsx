import React, { useState } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { CustomerSearch } from '../components/customers/CustomerSearch'
import { CustomerList } from '../components/customers/CustomerList'
import { CustomerFormModal } from '../components/customers/CustomerFormModal'
import { DeleteCustomerDialog } from '../components/customers/DeleteCustomerDialog'
import { CustomerWorkspacePage } from './CustomerWorkspacePage'
import { Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Customer } from '../types'

export const CustomersPage: React.FC = () => {
  const {
    customers,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    totalCount,
    hasNextPage,
    addCustomer,
    editCustomer,
    removeCustomer,
  } = useCustomers()

  // Modal Open & Selection states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedCustomerForWorkspace, setSelectedCustomerForWorkspace] = useState<Customer | null>(null)

  const handleAddClick = () => {
    setSelectedCustomer(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (cust: Customer) => {
    setSelectedCustomer(cust)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (cust: Customer) => {
    setSelectedCustomer(cust)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Omit<Customer, 'id' | 'created_at' | 'owner_id'>) => {
    if (selectedCustomer) {
      await editCustomer(selectedCustomer.id, data)
    } else {
      await addCustomer(data)
    }
  }

  const handleDeleteConfirm = async () => {
    if (selectedCustomer) {
      await removeCustomer(selectedCustomer.id)
    }
  }

  const totalPages = Math.ceil(totalCount / 20) || 1

  if (selectedCustomerForWorkspace) {
    return (
      <CustomerWorkspacePage
        customer={selectedCustomerForWorkspace}
        onBack={() => setSelectedCustomerForWorkspace(null)}
      />
    )
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* 1. Page Header */}
      <div className="flex justify-between items-center select-none shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Customers</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and track your customer directory</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition active:scale-95 shadow-lg hover:shadow-brand-500/20"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* 2. Error Display Panel */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs shrink-0 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Search and Sort Filter Control */}
      <div className="bg-slate-900/30 border border-slate-800/30 p-4 rounded-2xl shrink-0">
        <CustomerSearch
          search={search}
          onSearchChange={setSearch}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* 4. Customer Listing Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-2">
        <CustomerList
          customers={customers}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onAddClick={handleAddClick}
          onSelect={setSelectedCustomerForWorkspace}
        />
      </div>

      {/* 5. Pagination Toolbar */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 px-1 select-none shrink-0">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-350">{customers.length}</span> of{' '}
            <span className="font-semibold text-slate-350">{totalCount}</span> customers
          </div>

          <div className="flex items-center gap-4">
            {/* Page index stats */}
            <span className="text-xs font-semibold text-slate-400">
              Page <span className="text-white font-bold">{page}</span> of{' '}
              <span className="text-slate-300 font-bold">{totalPages}</span>
            </span>

            {/* Pagination Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNextPage || loading}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Form Modal Overlay */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        customer={selectedCustomer}
      />

      {/* Safe Delete Dialog Confirmation Overlay */}
      <DeleteCustomerDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        customer={selectedCustomer}
      />
    </div>
  )
}
