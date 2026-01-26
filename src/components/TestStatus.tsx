/**
 * Jett Test Status Component
 * Displays functional test results in the task panel
 */

import React, { useState } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export type TestStatusType = 'idle' | 'generating' | 'running' | 'passed' | 'failed' | 'skipped'

export interface TestStatusProps {
  status: TestStatusType
  error?: string
  duration?: number
  logs?: string[]
  onRetry?: () => void
  onViewLogs?: () => void
  compact?: boolean
}

// ============================================================================
// ICONS
// ============================================================================

const icons: Record<TestStatusType, string> = {
  idle: '○',
  generating: '⏳',
  running: '🔄',
  passed: '✓',
  failed: '✗',
  skipped: '⊘',
}

const colors: Record<TestStatusType, string> = {
  idle: 'text-gray-400',
  generating: 'text-yellow-500',
  running: 'text-blue-500',
  passed: 'text-green-500',
  failed: 'text-red-500',
  skipped: 'text-gray-400',
}

const bgColors: Record<TestStatusType, string> = {
  idle: 'bg-gray-100',
  generating: 'bg-yellow-50',
  running: 'bg-blue-50',
  passed: 'bg-green-50',
  failed: 'bg-red-50',
  skipped: 'bg-gray-50',
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TestStatus({
  status,
  error,
  duration,
  logs = [],
  onRetry,
  onViewLogs,
  compact = false,
}: TestStatusProps) {
  const [showLogs, setShowLogs] = useState(false)

  // Compact view (inline)
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-sm ${colors[status]}`}>
        <span>{icons[status]}</span>
        <span>
          {status === 'generating' && 'Generating test...'}
          {status === 'running' && 'Running...'}
          {status === 'passed' && `Passed${duration ? ` (${duration}ms)` : ''}`}
          {status === 'failed' && 'Failed'}
          {status === 'skipped' && 'Skipped'}
          {status === 'idle' && 'No test'}
        </span>
      </span>
    )
  }

  // Full view (card)
  return (
    <div className={`rounded-lg p-3 ${bgColors[status]}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colors[status]}`}>
          <span className="text-lg">{icons[status]}</span>
          <span className="font-medium">
            {status === 'idle' && 'Functional Test'}
            {status === 'generating' && 'Generating Test...'}
            {status === 'running' && 'Running Test...'}
            {status === 'passed' && 'Test Passed'}
            {status === 'failed' && 'Test Failed'}
            {status === 'skipped' && 'Test Skipped'}
          </span>
          {duration && status === 'passed' && (
            <span className="text-sm text-gray-500">({duration}ms)</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showLogs ? 'Hide' : 'Show'} logs
            </button>
          )}
          {status === 'failed' && onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && status === 'failed' && (
        <div className="mt-2 text-sm text-red-600 bg-red-100 rounded p-2 font-mono">
          {error}
        </div>
      )}

      {/* Logs */}
      {showLogs && logs.length > 0 && (
        <div className="mt-2 text-xs bg-gray-900 text-gray-100 rounded p-2 font-mono max-h-40 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className={log.includes('[error]') ? 'text-red-400' : ''}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TASK TEST STATUS (for task panel)
// ============================================================================

export interface TaskTestStatusProps {
  taskIndex: number
  taskDescription: string
  testStatus: TestStatusType
  testError?: string
  testDuration?: number
  visualStatus: 'pending' | 'passed' | 'failed'
  codeStatus: 'pending' | 'passed' | 'issues'
}

export function TaskTestStatus({
  taskIndex,
  taskDescription,
  testStatus,
  testError,
  testDuration,
  visualStatus,
  codeStatus,
}: TaskTestStatusProps) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      {/* Task header */}
      <div className="font-medium text-gray-900 mb-2">
        Task {taskIndex + 1}: {taskDescription}
      </div>

      {/* Status rows */}
      <div className="space-y-1 text-sm">
        {/* Visual check */}
        <div className="flex items-center gap-2">
          <span className={visualStatus === 'passed' ? 'text-green-500' : visualStatus === 'failed' ? 'text-red-500' : 'text-gray-400'}>
            {visualStatus === 'passed' ? '✓' : visualStatus === 'failed' ? '✗' : '○'}
          </span>
          <span className="text-gray-600">Visual:</span>
          <span className={visualStatus === 'passed' ? 'text-green-600' : visualStatus === 'failed' ? 'text-red-600' : 'text-gray-400'}>
            {visualStatus === 'passed' ? 'Looks correct' : visualStatus === 'failed' ? 'Issues detected' : 'Pending'}
          </span>
        </div>

        {/* Code check */}
        <div className="flex items-center gap-2">
          <span className={codeStatus === 'passed' ? 'text-green-500' : codeStatus === 'issues' ? 'text-yellow-500' : 'text-gray-400'}>
            {codeStatus === 'passed' ? '✓' : codeStatus === 'issues' ? '⚠' : '○'}
          </span>
          <span className="text-gray-600">Code:</span>
          <span className={codeStatus === 'passed' ? 'text-green-600' : codeStatus === 'issues' ? 'text-yellow-600' : 'text-gray-400'}>
            {codeStatus === 'passed' ? 'No issues' : codeStatus === 'issues' ? 'Suggestions' : 'Pending'}
          </span>
        </div>

        {/* Functional test */}
        <div className="flex items-center gap-2">
          <span className={colors[testStatus]}>
            {icons[testStatus]}
          </span>
          <span className="text-gray-600">Test:</span>
          <TestStatus
            status={testStatus}
            error={testError}
            duration={testDuration}
            compact
          />
        </div>
      </div>

      {/* Error details */}
      {testStatus === 'failed' && testError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
          {testError}
        </div>
      )}
    </div>
  )
}

export default TestStatus
