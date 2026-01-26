/**
 * ReviewView - Code Review Kanban Board
 * 
 * Kanban columns:
 * 1. To Do - Open items needing attention
 * 2. In Progress - Currently being fixed by AI
 * 3. Done - Fixed items
 * 4. Dismissed - Items user chose to skip
 */

import { useState } from 'react'
import {
  IconCheck, IconX, IconAlert, IconLightbulb, IconCode,
  IconRocket, IconRefresh, IconCog, IconEye, IconSparkles
} from './Icons'

interface ReviewItem {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'error' | 'ux' | 'a11y' | 'performance' | 'simplify'
  title: string
  description: string
  file?: string
  line?: number
  suggestion?: string
  status: 'open' | 'fixed' | 'dismissed' | 'building'
}

interface Review {
  status: 'pending' | 'running' | 'complete' | 'skipped'
  errors: ReviewItem[]
  improvements: ReviewItem[]
  simplifications: ReviewItem[]
  completedAt?: string
}

interface ReviewViewProps {
  project: {
    id: string
    name: string
    review: Review
  }
  onReviewUpdate: (review: Review) => void
  onBuildImprovement: (item: ReviewItem) => Promise<void>
  onRunReview: () => Promise<void>
  onDeploy: () => void
  autoReview: boolean
  onAutoReviewToggle: (enabled: boolean) => void
  apiKey: string
}

export default function ReviewView({
  project,
  onReviewUpdate,
  onBuildImprovement,
  onRunReview,
  onDeploy,
  autoReview,
  onAutoReviewToggle,
  apiKey
}: ReviewViewProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'error' | 'ux' | 'a11y' | 'performance' | 'simplify'>('all')

  const { review } = project
  const simplifications = review.simplifications || []
  
  // Combine all items
  const allItems = [...review.errors, ...review.improvements, ...simplifications]
  
  // Filter to only show items belonging to current project
  // Items must have a file path that starts with the project's expected paths
  const projectScopedItems = allItems.filter(item => {
    if (!item.file) return true // Keep items without file reference
    // Only include if file is in src/ (standard project structure)
    return item.file.startsWith('src/') || item.file.startsWith('pages/') || item.file.startsWith('components/')
  })
  
  // Filter by category
  const filteredItems = selectedCategory === 'all' 
    ? projectScopedItems 
    : projectScopedItems.filter(item => item.category === selectedCategory)

  // Group by status for Kanban columns
  const todoItems = filteredItems.filter(i => i.status === 'open')
  const inProgressItems = filteredItems.filter(i => i.status === 'building')
  const doneItems = filteredItems.filter(i => i.status === 'fixed')
  const dismissedItems = filteredItems.filter(i => i.status === 'dismissed')

  const criticalErrors = review.errors.filter(e => e.severity === 'critical' && e.status === 'open')
  const hasBlockingErrors = criticalErrors.length > 0

  // Category counts for filter pills
  const categoryCounts = {
    all: allItems.length,
    error: allItems.filter(i => i.category === 'error').length,
    ux: allItems.filter(i => i.category === 'ux').length,
    a11y: allItems.filter(i => i.category === 'a11y').length,
    performance: allItems.filter(i => i.category === 'performance').length,
    simplify: allItems.filter(i => i.category === 'simplify').length,
  }

  // Run review
  const handleRunReview = async () => {
    if (!apiKey) {
      alert('Please set your API key in Settings first')
      return
    }
    setIsRunning(true)
    try {
      await onRunReview()
    } finally {
      setIsRunning(false)
    }
  }

  // Update item status helper
  const updateItemStatus = (itemId: string, newStatus: ReviewItem['status']) => {
    const updatedReview = {
      ...review,
      errors: review.errors.map(i => 
        i.id === itemId ? { ...i, status: newStatus } : i
      ),
      improvements: review.improvements.map(i => 
        i.id === itemId ? { ...i, status: newStatus } : i
      ),
      simplifications: simplifications.map(i => 
        i.id === itemId ? { ...i, status: newStatus } : i
      )
    }
    onReviewUpdate(updatedReview)
  }

  // Build improvement
  const handleBuildImprovement = async (item: ReviewItem) => {
    updateItemStatus(item.id, 'building')
    
    try {
      await onBuildImprovement(item)
      updateItemStatus(item.id, 'fixed')
    } catch (error) {
      updateItemStatus(item.id, 'open')
    }
  }

  // Dismiss item
  const handleDismiss = (item: ReviewItem) => {
    updateItemStatus(item.id, 'dismissed')
  }

  // Restore item to To Do
  const handleRestore = (item: ReviewItem) => {
    updateItemStatus(item.id, 'open')
  }

  // Get severity styling
  const getSeverityStyle = (severity: ReviewItem['severity']) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/5'
      case 'high': return 'border-l-orange-500 bg-orange-500/5'
      case 'medium': return 'border-l-blue-500 bg-blue-500/5'
      case 'low': return 'border-l-gray-500 bg-gray-500/5'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: ReviewItem['category']) => {
    switch (category) {
      case 'error': return <IconX size={12} />
      case 'ux': return <IconEye size={12} />
      case 'a11y': return <IconSparkles size={12} />
      case 'performance': return <IconCog size={12} />
      case 'simplify': return <IconLightbulb size={12} />
    }
  }

  // Render a single card
  const renderCard = (item: ReviewItem, showActions: boolean = true) => (
    <div
      key={item.id}
      className={`p-3 rounded-lg border-l-4 ${getSeverityStyle(item.severity)} mb-2 bg-[var(--bg-secondary)]`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--text-secondary)]">{getCategoryIcon(item.category)}</span>
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{item.title}</span>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${
          item.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
          item.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
          item.severity === 'medium' ? 'bg-blue-500/20 text-blue-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {item.severity}
        </span>
      </div>
      
      {/* File path */}
      {item.file && (
        <p className="text-xs text-[var(--text-tertiary)] font-mono truncate mb-2">{item.file}</p>
      )}
      
      {/* Description - collapsed by default */}
      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">{item.description}</p>
      
      {/* Actions */}
      {showActions && item.status === 'open' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleBuildImprovement(item)}
            className="flex-1 px-2 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-400 flex items-center justify-center gap-1"
          >
            <IconSparkles size={12} /> Fix
          </button>
          <button
  onClick={() => handleDismiss(item)}
  className="px-2 py-1.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)]"
>
  Skip
</button>
        </div>
      )}
      
      {/* Building indicator */}
      {item.status === 'building' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
          <div className="animate-spin">⚙️</div>
          <span>Fixing...</span>
        </div>
      )}
      
      {/* Done indicator */}
      {item.status === 'fixed' && (
        <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
          <IconCheck size={12} />
          <span>Fixed</span>
        </div>
      )}
      
      {/* Restore button for dismissed */}
      {item.status === 'dismissed' && (
        <button
        onClick={() => handleRestore(item)}
        className="mt-2 px-2 py-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
      >
        ↩ Restore
      </button>
      )}
    </div>
  )

  // Render a Kanban column
  const renderColumn = (
    title: string, 
    items: ReviewItem[], 
    color: string,
    showActions: boolean = true
  ) => (
    <div className="flex-1 min-w-[240px] max-w-[320px] flex flex-col">
      {/* Column header */}
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b`} style={{ borderColor: 'var(--border-primary)' }}>
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          {items.length}
        </span>
      </div>
      
      {/* Cards */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No items</p>
        ) : (
          items.map(item => renderCard(item, showActions))
        )}
      </div>
    </div>
  )

  // Empty state
  if (review.status === 'pending' || allItems.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconCode size={20} /> Code Review
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">Run review to analyze your build</p>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">Auto-review</span>
              <button
                onClick={() => onAutoReviewToggle(!autoReview)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  autoReview ? 'bg-blue-500' : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${
                  autoReview ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </label>
            
            <button
              onClick={handleRunReview}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 disabled:opacity-50 flex items-center gap-2"
            >
              <IconRefresh size={16} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'Analyzing...' : 'Run Review'}
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4 opacity-50">{'</>'}</div>
            <h3 className="text-lg font-medium mb-2">Ready for Review</h3>
            <p className="text-[var(--text-secondary)] max-w-md mb-6">
              Code review analyzes your build for errors and suggests UX improvements. 
              It helps you ship better software and learn best practices.
            </p>
            <button
              onClick={handleRunReview}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              <IconRefresh size={16} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'Analyzing...' : 'Start Review'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Running state
  if (review.status === 'running' || isRunning) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium mb-2">Analyzing Code...</h3>
          <p className="text-[var(--text-secondary)]">
            Checking for errors, UX issues, and simplification opportunities
          </p>
        </div>
      </div>
    )
  }

  // Kanban board
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconCode size={20} /> Code Review
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {allItems.length} items · {todoItems.length} to do
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-secondary)]">Auto-review</span>
            <button
              onClick={() => onAutoReviewToggle(!autoReview)}
              className={`w-10 h-5 rounded-full transition-colors ${
                autoReview ? 'bg-blue-500' : 'bg-[var(--bg-tertiary)]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${
                autoReview ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </label>
          
          <button
  onClick={handleRunReview}
  disabled={isRunning}
  className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-50 flex items-center gap-2"
>
            <IconRefresh size={16} className={isRunning ? 'animate-spin' : ''} />
            Re-run
          </button>
          
          {!hasBlockingErrors && (
            <button
              onClick={onDeploy}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 flex items-center gap-2"
            >
              <IconRocket size={16} /> Deploy
            </button>
          )}
        </div>
      </div>

      {/* Critical errors banner */}
      {hasBlockingErrors && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <IconX size={20} className="text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-400">
              {criticalErrors.length} critical error{criticalErrors.length > 1 ? 's' : ''} found
            </p>
            <p className="text-xs text-red-400/70">Fix these before deploying to live</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 p-4 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'error', label: 'Error' },
          { key: 'ux', label: 'UX' },
          { key: 'a11y', label: 'Accessibility' },
          { key: 'performance', label: 'Performance' },
          { key: 'simplify', label: 'Simplify' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as any)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === key
                ? 'bg-blue-500 text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {label}
            <span className={`text-xs ${
              selectedCategory === key ? 'text-white/70' : 'text-gray-500'
            }`}>
              {categoryCounts[key as keyof typeof categoryCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto min-h-0">
        {renderColumn('To Do', todoItems, 'bg-blue-500', true)}
        {renderColumn('In Progress', inProgressItems, 'bg-yellow-500', false)}
        {renderColumn('Done', doneItems, 'bg-green-500', false)}
        {dismissedItems.length > 0 && renderColumn('Dismissed', dismissedItems, 'bg-gray-500', false)}
      </div>
    </div>
  )
}
