/**
 * SettingsPage - Pre-built Settings/Preferences Component
 * 
 * Features:
 * - Grouped settings sections
 * - Toggle switches
 * - Select dropdowns
 * - Text inputs
 * - Auto-save or manual save
 * - Reset to defaults
 * 
 * Customization via props:
 * - sections: Setting sections with items
 * - onSave: Callback when settings are saved
 * - autoSave: Enable auto-save on change
 */

import { useState, useEffect } from 'react'

// ============================================
// TYPES
// ============================================

interface SettingItem {
  key: string
  label: string
  description?: string
  type: 'toggle' | 'select' | 'text' | 'number' | 'email'
  value: any
  options?: { label: string; value: any }[]
  placeholder?: string
  min?: number
  max?: number
}

interface SettingSection {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  items: SettingItem[]
}

interface SettingsPageProps {
  sections: SettingSection[]
  onSave: (settings: Record<string, any>) => Promise<void>
  autoSave?: boolean
  title?: string
}

// ============================================
// ICONS
// ============================================

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const IconPalette = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

// Default icons for common section types
const defaultIcons: Record<string, React.ReactNode> = {
  account: <IconUser />,
  notifications: <IconBell />,
  privacy: <IconShield />,
  appearance: <IconPalette />,
}

// ============================================
// TOGGLE COMPONENT
// ============================================

function Toggle({ 
  checked, 
  onChange 
}: { 
  checked: boolean
  onChange: (checked: boolean) => void 
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SettingsPage({
  sections,
  onSave,
  autoSave = false,
  title = 'Settings'
}: SettingsPageProps) {
  // Build initial values from sections
  const getInitialValues = () => {
    const values: Record<string, any> = {}
    sections.forEach(section => {
      section.items.forEach(item => {
        values[item.key] = item.value
      })
    })
    return values
  }

  const [values, setValues] = useState<Record<string, any>>(getInitialValues)
  const [originalValues, setOriginalValues] = useState<Record<string, any>>(getInitialValues)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(sections[0]?.id)

  const hasChanges = JSON.stringify(values) !== JSON.stringify(originalValues)

  // Update value
  const updateValue = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }))
    setIsSaved(false)
    setError(null)
  }

  // Auto-save effect
  useEffect(() => {
    if (autoSave && hasChanges) {
      const timer = setTimeout(() => {
        handleSave()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [values, autoSave])

  // Save settings
  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onSave(values)
      setOriginalValues(values)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset to defaults
  const handleReset = () => {
    if (!confirm('Reset all settings to their original values?')) return
    setValues(originalValues)
    setError(null)
  }

  // Render setting input based on type
  const renderInput = (item: SettingItem) => {
    const value = values[item.key]

    switch (item.type) {
      case 'toggle':
        return (
          <Toggle
            checked={value}
            onChange={(checked) => updateValue(item.key, checked)}
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateValue(item.key, e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              minWidth: '150px'
            }}
          >
            {item.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateValue(item.key, parseInt(e.target.value) || 0)}
            min={item.min}
            max={item.max}
            className="w-24 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          />
        )

      case 'email':
      case 'text':
      default:
        return (
          <input
            type={item.type === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => updateValue(item.key, e.target.value)}
            placeholder={item.placeholder}
            className="w-64 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          />
        )
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Manage your preferences and account settings
            </p>
          </div>
          
          {!autoSave && (
            <div className="flex items-center gap-3">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <IconRefresh />
                  Reset
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : isSaved ? (
                  <IconCheck />
                ) : null}
                {isSaved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Auto-save indicator */}
        {autoSave && hasChanges && (
          <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
            Changes will be saved automatically...
          </div>
        )}

        {/* Settings Layout */}
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                    activeSection === section.id 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'hover:bg-white/5'
                  }`}
                  style={{ 
                    color: activeSection === section.id ? undefined : 'var(--text-secondary)' 
                  }}
                >
                  <span className="opacity-70">
                    {section.icon || defaultIcons[section.id] || <IconUser />}
                  </span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {sections.map(section => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <div 
                  className="rounded-2xl p-6"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {section.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {section.items.map((item, index) => (
                      <div 
                        key={item.key}
                        className={`flex items-start justify-between gap-4 ${
                          index > 0 ? 'pt-6' : ''
                        }`}
                        style={{ 
                          borderTop: index > 0 ? '1px solid var(--border-primary)' : undefined 
                        }}
                      >
                        <div className="flex-1">
                          <label 
                            className="block font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.label}
                          </label>
                          {item.description && (
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {renderInput(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
import SettingsPage from './SettingsPage'

const settingsSections = [
  {
    id: 'account',
    title: 'Account',
    description: 'Manage your account settings',
    items: [
      { key: 'name', label: 'Display Name', type: 'text', value: 'John Doe' },
      { key: 'email', label: 'Email Address', type: 'email', value: 'john@example.com' },
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Choose what notifications you receive',
    items: [
      { key: 'emailNotifs', label: 'Email Notifications', description: 'Receive updates via email', type: 'toggle', value: true },
      { key: 'pushNotifs', label: 'Push Notifications', description: 'Receive push notifications', type: 'toggle', value: false },
      { key: 'frequency', label: 'Email Frequency', type: 'select', value: 'daily', options: [
        { label: 'Immediately', value: 'immediate' },
        { label: 'Daily digest', value: 'daily' },
        { label: 'Weekly digest', value: 'weekly' },
      ]},
    ]
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize how the app looks',
    items: [
      { key: 'theme', label: 'Theme', type: 'select', value: 'dark', options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' },
      ]},
      { key: 'fontSize', label: 'Font Size', type: 'number', value: 16, min: 12, max: 24 },
    ]
  },
]

<SettingsPage
  sections={settingsSections}
  onSave={async (settings) => {
    console.log('Saving:', settings)
    // await api.saveSettings(settings)
  }}
  autoSave={false}
/>
*/
