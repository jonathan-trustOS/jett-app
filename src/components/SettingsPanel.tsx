/**
 * Jett Settings Panel
 * Full settings with API config, model selection, and plugin toggles
 */

import { useState, useEffect } from 'react'

// App version - should match package.json
const APP_VERSION = __APP_VERSION__
const GITHUB_REPO = 'jonathan-trustOS/jett-app'

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

interface UpdateInfo {
  available: boolean
  latestVersion: string
  downloadUrl: string
  releaseNotes?: string
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
  const [toastMessage, setToastMessage] = useState('API key saved successfully')
  
  // Vercel token state
  const [vercelToken, setVercelToken] = useState('')
  const [showVercelToken, setShowVercelToken] = useState(false)
  const [vercelSaveStatus, setVercelSaveStatus] = useState<'idle' | 'saved'>('idle')

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')
  const [showSupabaseKey, setShowSupabaseKey] = useState(false)
  const [supabaseSaveStatus, setSupabaseSaveStatus] = useState<'idle' | 'saved'>('idle')

  // Convex state
  const [convexUrl, setConvexUrl] = useState('')
  const [showConvexKey, setShowConvexKey] = useState(false)
  const [convexSaveStatus, setConvexSaveStatus] = useState<'idle' | 'saved'>('idle')
  
  // GitHub state
  const [githubAuth, setGithubAuth] = useState<GitHubAuth | null>(null)
  const [githubConfig, setGithubConfig] = useState<GitConfig | null>(null)
  const [githubToken, setGithubToken] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  
  // Memory state
  const [memoryPrefs, setMemoryPrefs] = useState<MemoryPrefs | null>(null)
  const [memoryStats, setMemoryStats] = useState<any>(null)
  
  // Update check state
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  
  // Plugin toggles (stored in localStorage for now)
  const [pluginToggles, setPluginToggles] = useState({
    codeSimplifier: true,
    codeReview: true,
    autoCommit: false,
    memoryLearning: true
  })

  // Build settings
  const [buildSettings, setBuildSettings] = useState({
    maxIterations: 3,
    useCheaperModels: true,
    writeProgressLog: true
  })

  // Theme state
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')

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

    // Load build settings
    const savedBuildSettings = localStorage.getItem('jett-build-settings')
    if (savedBuildSettings) {
      try {
        setBuildSettings(prev => ({ ...prev, ...JSON.parse(savedBuildSettings) }))
      } catch (e) {}
    }

    // Load theme
    const savedTheme = localStorage.getItem('jett-theme')
    if (savedTheme) {
      setTheme(savedTheme as 'system' | 'light' | 'dark')
    }
    
    // Load Vercel token
    const savedVercelToken = localStorage.getItem('vercel_token')
    if (savedVercelToken) {
      setVercelToken(savedVercelToken)
    }

    // Load Convex credentials
    const savedConvexUrl = localStorage.getItem('convex_url')
    if (savedConvexUrl) setConvexUrl(savedConvexUrl)
    
    // Load last update check info
    const savedUpdateInfo = localStorage.getItem('jett-update-info')
    if (savedUpdateInfo) {
      try {
        setUpdateInfo(JSON.parse(savedUpdateInfo))
      } catch (e) {}
    }
    
    // Auto-check for updates on load
    checkForUpdates()
  }

  // Check for updates via GitHub releases API
  const checkForUpdates = async () => {
    setIsCheckingUpdate(true)
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      if (response.ok) {
        const release = await response.json()
        const latestVersion = release.tag_name.replace(/^v/, '') // Remove 'v' prefix if present
        
        // Find DMG download URL
        const dmgAsset = release.assets?.find((a: any) => a.name.endsWith('.dmg'))
        const downloadUrl = dmgAsset?.browser_download_url || release.html_url
        
        const info: UpdateInfo = {
          available: isNewerVersion(latestVersion, APP_VERSION),
          latestVersion,
          downloadUrl,
          releaseNotes: release.body
        }
        
        setUpdateInfo(info)
        localStorage.setItem('jett-update-info', JSON.stringify(info))
      } else {
        console.error('Failed to check for updates:', response.status)
      }
    } catch (error) {
      console.error('Update check failed:', error)
    } finally {
      setIsCheckingUpdate(false)
    }
  }
  
  // Compare version strings (e.g., "1.7.9" > "1.7.8")
  const isNewerVersion = (latest: string, current: string): boolean => {
    const latestParts = latest.split('.').map(Number)
    const currentParts = current.split('.').map(Number)
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const l = latestParts[i] || 0
      const c = currentParts[i] || 0
      if (l > c) return true
      if (l < c) return false
    }
    return false
  }

  const saveApiKey = () => {
    onApiKeyChange(tempApiKey)
    localStorage.setItem('jett-api-key', tempApiKey)
    
    // Show confirmation
    setSaveStatus('saved')
    setToastMessage('API key saved successfully')
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

  const saveVercelToken = () => {
    localStorage.setItem('vercel_token', vercelToken)
    
    // Show confirmation
    setVercelSaveStatus('saved')
    setToastMessage('Vercel token saved successfully')
    setShowToast(true)
    
    // Reset after 2 seconds
    setTimeout(() => {
      setVercelSaveStatus('idle')
    }, 2000)
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const saveSupabase = () => {
    localStorage.setItem('supabase_url', supabaseUrl)
    localStorage.setItem('supabase_anon_key', supabaseAnonKey)
    
    setSupabaseSaveStatus('saved')
    setToastMessage('Supabase credentials saved successfully')
    setShowToast(true)
    
    setTimeout(() => {
      setSupabaseSaveStatus('idle')
    }, 2000)
    
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  const saveConvex = () => {
    localStorage.setItem('convex_url', convexUrl)
    
    setConvexSaveStatus('saved')
    setToastMessage('Convex URL saved successfully')
    setShowToast(true)
    
    setTimeout(() => {
      setConvexSaveStatus('idle')
    }, 2000)
    
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
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleGitHubLogout = async () => {
    try {
      await window.jett.github.logout()
      setGithubAuth(null)
    } catch (e) {
      console.error('GitHub logout failed', e)
    }
  }

  const handleGitHubConfigChange = async (key: string, value: any) => {
    if (!githubConfig) return
    const newConfig = { ...githubConfig, [key]: value }
    setGithubConfig(newConfig)
    try {
      await window.jett.github.setConfig(newConfig)
    } catch (e) {
      console.error('Failed to save config', e)
    }
  }

  const handleMemoryPrefChange = async (key: string, value: any) => {
    if (!memoryPrefs) return
    const newPrefs = { ...memoryPrefs, [key]: value }
    setMemoryPrefs(newPrefs)
    try {
      await window.jett.memory.setGlobal(newPrefs)
    } catch (e) {
      console.error('Failed to save memory prefs', e)
    }
  }

  const clearAllMemory = async () => {
    if (confirm('Clear all learned patterns? This cannot be undone.')) {
      try {
        await window.jett.memory.clearAll()
        setMemoryStats({ totalPatternsLearned: 0, projectsWithMemory: 0 })
      } catch (e) {
        console.error('Failed to clear memory', e)
      }
    }
  }

  const togglePlugin = (key: string) => {
    const newToggles = { ...pluginToggles, [key]: !pluginToggles[key as keyof typeof pluginToggles] }
    setPluginToggles(newToggles)
    localStorage.setItem('jett-plugin-toggles', JSON.stringify(newToggles))
  }

  const updateBuildSetting = (key: string, value: any) => {
    const newSettings = { ...buildSettings, [key]: value }
    setBuildSettings(newSettings)
    localStorage.setItem('jett-build-settings', JSON.stringify(newSettings))
  }

  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme)
    localStorage.setItem('jett-theme', newTheme)
    
    // Apply theme to document
    const root = document.documentElement
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', newTheme)
    }
  }

  // Get current models for selected provider
  const currentModels = MODELS[provider as keyof typeof MODELS] || MODELS.anthropic

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Toast notification */}
      {showToast && (
        <div className="absolute top-6 right-6 z-[60] px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-lg animate-fade-in">
          ✓ {toastMessage}
        </div>
      )}

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border-primary)' }}>
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
            { id: 'appearance', label: 'Appearance', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
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
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Get your key at{' '}
                  <button 
                    onClick={() => window.jett?.openExternal?.(
                      provider === 'openrouter' 
                        ? 'https://openrouter.ai/keys' 
                        : 'https://console.anthropic.com/settings/keys'
                    )}
                    className="text-blue-400 hover:underline"
                  >
                    {provider === 'openrouter' ? 'openrouter.ai/keys' : 'console.anthropic.com/settings/keys'}
                  </button>
                </p>
              </div>

              {/* Vercel Token */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Vercel Token <span className="text-xs text-[var(--text-tertiary)]">(for publishing)</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showVercelToken ? 'text' : 'password'}
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                      placeholder="vercel_..."
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => setShowVercelToken(!showVercelToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {showVercelToken ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <button
                    onClick={saveVercelToken}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 min-w-[80px] ${
                      vercelSaveStatus === 'saved' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    }`}
                  >
                    {vercelSaveStatus === 'saved' ? '✓ Saved' : 'Save'}
                  </button>
                  {vercelToken && (
                    <button
                      onClick={() => {
                        setVercelToken('')
                        localStorage.removeItem('vercel_token')
                        setVercelSaveStatus('idle')
                      }}
                      className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
                      title="Clear Vercel Token"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Get your token at{' '}
                  <button 
                    onClick={() => window.jett?.openExternal?.('https://vercel.com/account/tokens')}
                    className="text-blue-400 hover:underline"
                  >
                    vercel.com/account/tokens
                  </button>
                </p>
              </div>

{/* Supabase Credentials */}
<div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Supabase <span className="text-xs text-[var(--text-tertiary)]">(for database)</span>
                </label>
                
                {/* Supabase URL */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xxxxx.supabase.co"
                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                
                {/* Supabase Anon Key */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showSupabaseKey ? 'text' : 'password'}
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIs..."
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      {showSupabaseKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <button
                    onClick={saveSupabase}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 min-w-[80px] ${
                      supabaseSaveStatus === 'saved' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                    }`}
                  >
                    {supabaseSaveStatus === 'saved' ? '✓ Saved' : 'Save'}
                  </button>
                  {(supabaseUrl || supabaseAnonKey) && (
                    <button
                      onClick={() => {
                        setSupabaseUrl('')
                        setSupabaseAnonKey('')
                        localStorage.removeItem('supabase_url')
                        localStorage.removeItem('supabase_anon_key')
                        setSupabaseSaveStatus('idle')
                      }}
                      className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
                      title="Clear Supabase"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Get your credentials at{' '}
                  <button 
                    onClick={() => window.jett?.openExternal?.('https://supabase.com/dashboard/project/_/settings/api')}
                    className="text-blue-400 hover:underline"
                  >
                    supabase.com/dashboard → Settings → API
                  </button>
                </p>
              </div>

              {/* Convex */}
              <div className="pt-4 border-t border-[var(--border-primary)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">Convex (Optional)</h3>
                  
                  <a href="https://dashboard.convex.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Get Deployment URL →
                  </a>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  Real-time database alternative to Supabase. AI will use Convex when configured.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">
                      Deployment URL
                    </label>
                    <input
                      type="text"
                      value={convexUrl}
                      onChange={(e) => setConvexUrl(e.target.value)}
                      placeholder="https://your-app.convex.cloud"
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm placeholder-[var(--text-tertiary)]"
                    />
                  </div>
                  
                  <button
                    onClick={saveConvex}
                    disabled={!convexUrl.trim()}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      convexSaveStatus === 'saved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {convexSaveStatus === 'saved' ? '✓ Saved' : 'Save Convex URL'}
                  </button>
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

              {/* App Version & Updates */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[var(--text-secondary)]">Jett v{APP_VERSION}</div>
                  {updateInfo?.available ? (
                    <button
                      onClick={() => window.jett?.openExternal?.(updateInfo.downloadUrl)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-400 transition-all flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      Download v{updateInfo.latestVersion}
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      No updates
                    </div>
                  )}
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
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-[var(--text-secondary)]">
                      {plugin.icon}
                    </div>
                    <div>
                      <div className="text-[var(--text-primary)] font-medium">{plugin.name}</div>
                      <div className="text-[var(--text-secondary)] text-sm">{plugin.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePlugin(plugin.key)}
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

              {/* Build Settings Section */}
              <div className="pt-4 mt-4 border-t border-[var(--border-primary)]">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Build Settings</h3>
                
                {/* Max Iterations */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[var(--text-primary)] text-sm">Max Auto-Fix Attempts</div>
                      <div className="text-[var(--text-secondary)] text-xs">How many times to retry failed steps</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateBuildSetting('maxIterations', Math.max(1, buildSettings.maxIterations - 1))}
                        className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-[var(--text-primary)] font-mono">{buildSettings.maxIterations}</span>
                      <button
                        onClick={() => updateBuildSetting('maxIterations', Math.min(10, buildSettings.maxIterations + 1))}
                        className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Use Cheaper Models */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl mb-3"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div>
                    <div className="text-[var(--text-primary)] text-sm">Use Faster Models for Simple Tasks</div>
                    <div className="text-[var(--text-secondary)] text-xs">Uses Haiku for templates, Sonnet for modules</div>
                  </div>
                  <button
                    onClick={() => updateBuildSetting('useCheaperModels', !buildSettings.useCheaperModels)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      buildSettings.useCheaperModels ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      buildSettings.useCheaperModels ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Write Progress Log */}
                <div 
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div>
                    <div className="text-[var(--text-primary)] text-sm">Write Progress Log</div>
                    <div className="text-[var(--text-secondary)] text-xs">Saves PROGRESS.md in project folder</div>
                  </div>
                  <button
                    onClick={() => updateBuildSetting('writeProgressLog', !buildSettings.writeProgressLog)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      buildSettings.writeProgressLog ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      buildSettings.writeProgressLog ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
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

{/* Appearance Tab */}
{activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Theme</h3>
                <div className="flex gap-3">
                  {[
                    { id: 'system', label: 'System', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    )},
                    { id: 'light', label: 'Light', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    )},
                    { id: 'dark', label: 'Dark', icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                      </svg>
                    )}
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleThemeChange(option.id as 'system' | 'light' | 'dark')}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                        theme === option.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      {option.icon}
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-[var(--text-tertiary)]">
                System will automatically match your operating system's appearance setting.
              </p>
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
                                ? 'bg-blue-500 text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
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
