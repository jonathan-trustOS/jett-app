/**
 * Jett Settings Panel
 * Full settings with API config, model selection, and plugin toggles
 */

import { useState, useEffect } from 'react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  onApiKeyChange: (key: string) => void
  provider: string
  onProviderChange: (provider: string) => void
  model: string
  onModelChange: (model: string) => void
}

interface GitHubAuth {
  username: string
  email: string
}

interface GitConfig {
  autoCommit: boolean
  autoPush: boolean
  commitPrefix: string
}

interface MemoryPrefs {
  buttonStyle: string
  cardStyle: string
  spacing: string
  animations: string
  autoSimplify: boolean
}

// Available models per provider
const MODELS = {
  anthropic: [
    { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Most capable, highest quality', cost: '$15/M tokens' },
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Best balance of speed and quality', cost: '$3/M tokens' },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Fastest, most affordable', cost: '$1/M tokens' },
  ],
  openrouter: [
    { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', description: 'Via OpenRouter', cost: 'Variable' },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', description: 'Via OpenRouter', cost: 'Variable' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI flagship', cost: 'Variable' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', description: 'Google flagship', cost: 'Variable' },
  ]
}

export default function SettingsPanel({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  provider,
  onProviderChange,
  model,
  onModelChange
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'plugins' | 'github' | 'memory'>('api')
  const [showApiKey, setShowApiKey] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [showToast, setShowToast] = useState(false)
  
  // GitHub state
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null)
  const [githubConfig, setGithubConfig] = useState<GitConfig | null>(null)
  const [githubToken, setGithubToken] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  // Memory state
  const [memoryPrefs, setMemoryPrefs] = useState<MemoryPrefs | null>(null)
  const [memoryStats, setMemoryStats] = useState<any>(null)
  
  // Plugin toggles (stored in localStorage for now)
  const [pluginToggles, setPluginToggles] = useState({
    codeSimplifier: true,
    codeReview: true,
    autoCommit: false,
    memoryLearning: true
  })

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    // Load GitHub config
    try {
      const authResult = await window.jett.github.isAuthenticated()
      if (authResult.success && authResult.authenticated) {
        setGithubAuth(authResult.user)
      }
      const configResult = await window.jett.github.getConfig()
      if (configResult.success) {
        setGithubConfig(configResult.config)
        setPluginToggles(prev => ({ ...prev, autoCommit: configResult.config.autoCommit }))
      }
    } catch (e) {
      console.error('Failed to load GitHub config', e)
    }

    // Load memory prefs
    try {
      const prefsResult = await window.jett.memory.getGlobal()
      if (prefsResult.success) {
        setMemoryPrefs(prefsResult.preferences)
      }
      const statsResult = await window.jett.memory.getStats()
      if (statsResult.success) {
        setMemoryStats(statsResult.stats)
      }
    } catch (e) {
      console.error('Failed to load memory prefs', e)
    }

    // Load plugin toggles from localStorage
    const saved = localStorage.getItem('jett-plugin-toggles')
    if (saved) {
      try {
        setPluginToggles(JSON.parse(saved))
      } catch (e) {}
    }
  }

  const saveApiKey = () => {
    onApiKeyChange(tempApiKey)
    localStorage.setItem('jett-api-key', tempApiKey)
    
    // Show confirmation
    setSaveStatus('saved')
    setShowToast(true)
    
    // Reset after 2 seconds
    setTimeout(() => {
      setSaveStatus('idle')
    }, 2000)
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const handleProviderChange = (newProvider: string) => {
    onProviderChange(newProvider)
    localStorage.setItem('jett-provider', newProvider)
    // Set default model for provider
    const defaultModel = MODELS[newProvider as keyof typeof MODELS]?.[0]?.id || ''
    onModelChange(defaultModel)
    localStorage.setItem('jett-model', defaultModel)
  }

  const handleModelChange = (newModel: string) => {
    onModelChange(newModel)
    localStorage.setItem('jett-model', newModel)
  }

  const handleGitHubAuth = async () => {
    if (!githubToken.trim()) return
    setIsAuthenticating(true)
    try {
      const result = await window.jett.github.authWithPAT(githubToken)
      if (result.success && result.auth) {
        setGithubAuth(result.auth)
        setGithubToken('')
      }
    } catch (e) {
      console.error('GitHub auth failed', e)
    }
    setIsAuthenticating(false)
  }

  const handleGitHubLogout = async () => {
    await window.jett.github.logout()
    setGithubAuth(null)
  }

  const handleGitHubConfigChange = async (key: string, value: any) => {
    const newConfig = { ...githubConfig, [key]: value }
    setGithubConfig(newConfig as GitConfig)
    await window.jett.github.updateConfig({ [key]: value })
    
    if (key === 'autoCommit') {
      setPluginToggles(prev => ({ ...prev, autoCommit: value }))
    }
  }

  const handleMemoryPrefChange = async (key: string, value: any) => {
    const newPrefs = { ...memoryPrefs, [key]: value }
    setMemoryPrefs(newPrefs as MemoryPrefs)
    await window.jett.memory.updateGlobal({ [key]: value })
  }

  const handlePluginToggle = (key: string, value: boolean) => {
    const newToggles = { ...pluginToggles, [key]: value }
    setPluginToggles(newToggles)
    localStorage.setItem('jett-plugin-toggles', JSON.stringify(newToggles))
  }

  const clearAllMemory = async () => {
    if (confirm('Clear all learned patterns and preferences? This cannot be undone.')) {
      await window.jett.memory.clearAll()
      const statsResult = await window.jett.memory.getStats()
      if (statsResult.success) {
        setMemoryStats(statsResult.stats)
      }
    }
  }

  if (!isOpen) return null

  const currentModels = MODELS[provider as keyof typeof MODELS] || MODELS.anthropic

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Toast Notification */}
      {showToast && (
        <div 
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in"
          style={{ 
            background: 'var(--success)', 
            color: 'white'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          API key saved successfully
        </div>
      )}
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col border border-[var(--border-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-[var(--text-primary)] font-semibold text-lg flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-primary)]">
          {[
            { id: 'api', label: 'API', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            )},
            { id: 'plugins', label: 'Plugins', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            )},
            { id: 'github', label: 'GitHub', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            )},
            { id: 'memory', label: 'Memory', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0-6v6m18-6v6"/>
              </svg>
            )}
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id 
                  ? 'text-[var(--text-primary)] border-b-2 border-blue-500' 
                  : 'text-[var(--text-secondary)] hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* API Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  AI Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'anthropic', name: 'Anthropic', desc: 'Direct API' },
                    { id: 'openrouter', name: 'OpenRouter', desc: 'Multi-provider' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        provider === p.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="text-[var(--text-primary)] font-medium">{p.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder={provider === 'openrouter' ? 'sk-or-...' : 'sk-ant-...'}
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {showApiKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <button
                    onClick={saveApiKey}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 min-w-[80px] ${
                      saveStatus === 'saved' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    }`}
                  >
                    {saveStatus === 'saved' ? '✓ Saved' : 'Save'}
                  </button>
                  {tempApiKey && (
                    <button
                      onClick={() => {
                        setTempApiKey('')
                        onApiKeyChange('')
                        localStorage.removeItem('jett-api-key')
                        setSaveStatus('idle')
                      }}
                      className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
                      title="Clear API Key"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Model
                </label>
                <div className="space-y-2">
                  {currentModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleModelChange(m.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        model === m.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[var(--text-primary)] font-medium">{m.name}</div>
                          <div className="text-[var(--text-secondary)] text-xs">{m.description}</div>
                        </div>
                        <div className="text-[var(--text-tertiary)] text-xs">{m.cost}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Plugins Tab */}
          {activeTab === 'plugins' && (
            <div className="space-y-4">
              {[
                { key: 'codeSimplifier', name: 'Code Simplifier', desc: 'Auto-clean code after each task', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
                  </svg>
                )},
                { key: 'codeReview', name: 'Code Review', desc: 'Check for accessibility & design issues', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                )},
                { key: 'memoryLearning', name: 'Memory Learning', desc: 'Learn patterns from your builds', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0-6v6m18-6v6"/>
                  </svg>
                )},
                { key: 'autoCommit', name: 'Auto Git Commit', desc: 'Commit after each successful task', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="1.05" y1="12" x2="7" y2="12"/>
                    <line x1="17.01" y1="12" x2="22.96" y2="12"/>
                  </svg>
                )}
              ].map(plugin => (
                <div 
                  key={plugin.key}
                  className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-secondary)]">{plugin.icon}</span>
                    <div>
                      <div className="text-[var(--text-primary)] font-medium">{plugin.name}</div>
                      <div className="text-[var(--text-secondary)] text-xs">{plugin.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (plugin.key === 'autoCommit') {
                        handleGitHubConfigChange('autoCommit', !pluginToggles.autoCommit)
                      } else {
                        handlePluginToggle(plugin.key, !pluginToggles[plugin.key as keyof typeof pluginToggles])
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      pluginToggles[plugin.key as keyof typeof pluginToggles]
                        ? 'bg-blue-500'
                        : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      pluginToggles[plugin.key as keyof typeof pluginToggles]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* GitHub Tab */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              {/* Auth Status */}
              {githubAuth ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </span>
                      <div>
                        <div className="text-[var(--text-primary)] font-medium">Connected as @{githubAuth.username}</div>
                        <div className="text-[var(--text-secondary)] text-xs">{githubAuth.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleGitHubLogout}
                      className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-[var(--text-secondary)]">
                    Personal Access Token
                  </label>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Create a token at GitHub → Settings → Developer settings → Personal access tokens
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                      className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleGitHubAuth}
                      disabled={isAuthenticating || !githubToken.trim()}
                      className="px-4 py-2 bg-blue-500 text-[var(--text-primary)] rounded-lg hover:bg-blue-400 transition-colors disabled:opacity-50"
                    >
                      {isAuthenticating ? '...' : 'Connect'}
                    </button>
                  </div>
                </div>
              )}

              {/* Config */}
              {githubConfig && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">Git Configuration</h3>
                  
                  <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <div>
                      <div className="text-[var(--text-primary)] text-sm">Auto-commit after tasks</div>
                      <div className="text-[var(--text-secondary)] text-xs">Commit each completed task automatically</div>
                    </div>
                    <button
                      onClick={() => handleGitHubConfigChange('autoCommit', !githubConfig.autoCommit)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        githubConfig.autoCommit ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        githubConfig.autoCommit ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">Commit Prefix</label>
                    <input
                      type="text"
                      value={githubConfig.commitPrefix}
                      onChange={(e) => handleGitHubConfigChange('commitPrefix', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-6">
              {/* Stats */}
              {memoryStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{memoryStats.totalPatternsLearned || 0}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Patterns Learned</div>
                  </div>
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{memoryStats.projectsWithMemory || 0}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Projects</div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {memoryPrefs && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">Design Preferences</h3>
                  
                  {[
                    { key: 'buttonStyle', label: 'Button Style', options: ['rounded', 'square', 'pill'] },
                    { key: 'cardStyle', label: 'Card Style', options: ['flat', 'elevated', 'bordered'] },
                    { key: 'spacing', label: 'Spacing', options: ['compact', 'comfortable', 'spacious'] },
                    { key: 'animations', label: 'Animations', options: ['none', 'subtle', 'playful'] }
                  ].map(pref => (
                    <div key={pref.key}>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">{pref.label}</label>
                      <div className="flex gap-2">
                        {pref.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleMemoryPrefChange(pref.key, opt)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                              memoryPrefs[pref.key as keyof MemoryPrefs] === opt
                                ? 'bg-blue-500 text-[var(--text-primary)]'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <div>
                      <div className="text-[var(--text-primary)] text-sm">Auto-simplify code</div>
                      <div className="text-[var(--text-secondary)] text-xs">Clean up code after each task</div>
                    </div>
                    <button
                      onClick={() => handleMemoryPrefChange('autoSimplify', !memoryPrefs.autoSimplify)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        memoryPrefs.autoSimplify ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        memoryPrefs.autoSimplify ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Clear Memory */}
              <div className="pt-4 border-t border-[var(--border-primary)]">
                <button
                  onClick={clearAllMemory}
                  className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  🗑️ Clear All Memory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Plugin toggle defaults
export const DEFAULT_PLUGIN_TOGGLES = {
  codeSimplifier: true,
  codeReview: true,
  autoCommit: false,
  memoryLearning: true
}

// Helper to get current plugin settings (for use in build system)
export function getPluginSettings(): typeof DEFAULT_PLUGIN_TOGGLES {
  try {
    const saved = localStorage.getItem('jett-plugin-toggles')
    if (saved) {
      return { ...DEFAULT_PLUGIN_TOGGLES, ...JSON.parse(saved) }
    }
  } catch (e) {}
  return DEFAULT_PLUGIN_TOGGLES
}
