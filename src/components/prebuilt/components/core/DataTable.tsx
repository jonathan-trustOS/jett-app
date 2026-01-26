/**
 * DataTable - Pre-built Data Table Component
 * 
 * Features:
 * - Column sorting (asc/desc)
 * - Search/filter
 * - Pagination
 * - Row selection
 * - Custom cell rendering
 * - Loading state
 * - Empty state
 * 
 * Customization via props:
 * - columns: Column definitions
 * - data: Row data array
 * - onRowClick: Optional row click handler
 * - selectable: Enable row selection
 * - pageSize: Items per page
 */

import { useState, useMemo } from 'react'

// ============================================
// TYPES
// ============================================

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
}

type SortDirection = 'asc' | 'desc' | null

// ============================================
// ICONS
// ============================================

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// ============================================
// COMPONENT
// ============================================

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  selectable = false,
  onSelectionChange,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
  searchable = true,
  searchPlaceholder = 'Search...'
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data
    
    const query = searchQuery.toLowerCase()
    return data.filter(row => 
      columns.some(col => {
        const value = row[col.key as keyof T]
        return String(value).toLowerCase().includes(query)
      })
    )
  }, [data, searchQuery, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn as keyof T]
      const bVal = b[sortColumn as keyof T]
      
      // Handle different types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' 
          ? aVal.getTime() - bVal.getTime() 
          : bVal.getTime() - aVal.getTime()
      }
      
      // Default to string comparison
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr)
    })
  }, [filteredData, sortColumn, sortDirection])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle selection
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    } else {
      const allIndices = paginatedData.map((_, i) => (currentPage - 1) * pageSize + i)
      setSelectedRows(new Set(allIndices))
      onSelectionChange?.(paginatedData)
    }
  }

  const handleSelectRow = (index: number, row: T) => {
    const globalIndex = (currentPage - 1) * pageSize + index
    const newSelected = new Set(selectedRows)
    
    if (newSelected.has(globalIndex)) {
      newSelected.delete(globalIndex)
    } else {
      newSelected.add(globalIndex)
    }
    
    setSelectedRows(newSelected)
    
    // Get all selected rows
    const selectedData = sortedData.filter((_, i) => newSelected.has(i))
    onSelectionChange?.(selectedData)
  }

  // Reset page when search changes
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const getCellValue = (row: T, column: Column<T>) => {
    const value = row[column.key as keyof T]
    
    if (column.render) {
      return column.render(value, row)
    }
    
    // Default rendering
    if (value === null || value === undefined) {
      return <span style={{ color: 'var(--text-tertiary)' }}>—</span>
    }
    
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗'
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    
    return String(value)
  }

  return (
    <div 
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
    >
      {/* Header with Search */}
      {searchable && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
              <IconSearch />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--bg-primary)' }}>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-sm font-medium ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-white/5' : ''
                  }`}
                  style={{ 
                    color: 'var(--text-secondary)',
                    width: column.width
                  }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? <IconChevronUp /> : <IconChevronDown />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading state
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-primary)' }}>
                  {selectable && <td className="px-4 py-3"><div className="w-4 h-4 rounded bg-white/10 animate-pulse" /></td>}
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-white/10 animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="px-4 py-12 text-center"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              paginatedData.map((row, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index
                const isSelected = selectedRows.has(globalIndex)
                
                return (
                  <tr
                    key={index}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-white/5' : ''
                    } ${isSelected ? 'bg-blue-600/10' : ''}`}
                    style={{ borderTop: '1px solid var(--border-primary)' }}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(index, row)}
                          className="rounded"
                        />
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={String(column.key)}
                        className="px-4 py-3 text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div 
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid var(--border-primary)' }}
        >
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <IconChevronLeft />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-white/5'
                    }`}
                    style={{ color: currentPage === pageNum ? undefined : 'var(--text-secondary)' }}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <IconChevronRight />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
import DataTable from './DataTable'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: Date
}

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { 
    key: 'status', 
    label: 'Status',
    render: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
      }`}>
        {value}
      </span>
    )
  },
  { 
    key: 'createdAt', 
    label: 'Created', 
    sortable: true,
    render: (value: Date) => value.toLocaleDateString()
  },
]

const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: new Date() },
  // ...
]

<DataTable
  columns={columns}
  data={users}
  selectable
  onRowClick={(user) => console.log('Clicked:', user)}
  onSelectionChange={(selected) => console.log('Selected:', selected)}
  pageSize={10}
/>
*/
