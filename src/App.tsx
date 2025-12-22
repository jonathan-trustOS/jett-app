import { useState } from 'react'
import ChatPanel from './components/ChatPanel'
import ContextWindow from './components/ContextWindow'
import ResizablePanes from './components/ResizablePanes'
import ContextDebugPanel from './components/ContextDebugPanel'

type View = 'home' | 'project' | 'settings'

function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState<View>('project')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  
  // Panel visibility state
  const [showPRD, setShowPRD] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showCaptures, setShowCaptures] = useState(false)
  
  // Context window state
  const [contextUrl, setContextUrl] = useState('https://google.com')
  const [contextLabel, setContextLabel] = useState('Getting started')

  return (
    <div className="h-screen w-screen bg-jett-bg text-jett-text flex overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <aside 
        className={`${sidebarCollapsed ? 'w-12' : 'w-48'} bg-jett-surface border-r border-jett-border flex flex-col transition-all duration-200`}
      >
        {/* Sidebar Header - space for traffic lights on Mac */}
        <div className="h-12 flex items-center justify-center drag-region">
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold text-jett-muted pl-16">Jett</span>
          )}
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 flex flex-col items-center py-4 space-y-2">
          <NavButton 
            icon="🏠" 
            label="Home" 
            collapsed={sidebarCollapsed}
            active={currentView === 'home'}
            onClick={() => setCurrentView('home')}
          />
          <NavButton 
            icon="🚀" 
            label="Project" 
            collapsed={sidebarCollapsed}
            active={currentView === 'project'}
            onClick={() => setCurrentView('project')}
          />
          <NavButton 
            icon="⚙️" 
            label="Settings" 
            collapsed={sidebarCollapsed}
            active={currentView === 'settings'}
            onClick={() => setCurrentView('settings')}
          />
        </nav>
        
        {/* Collapse Toggle */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-12 flex items-center justify-center text-jett-muted hover:text-jett-text transition-colors"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Render based on current view */}
        {currentView === 'home' && <HomeView />}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'project' && (
          <>
            {/* Top Bar */}
            <header className="h-12 bg-jett-surface border-b border-jett-border flex items-center justify-between px-4 drag-region">
              <div className="flex items-center space-x-2 no-drag">
                <span className="text-sm text-jett-muted">Project:</span>
                <span className="text-sm font-medium">My App</span>
              </div>
              <div className="flex items-center space-x-2 no-drag">
                <TopBarButton 
                  label="PRD" 
                  active={showPRD}
                  onClick={() => setShowPRD(!showPRD)} 
                />
                <TopBarButton 
                  label="Tasks" 
                  active={showTasks}
                  onClick={() => setShowTasks(!showTasks)} 
                />
                <TopBarButton 
                  label="Files" 
                  active={showFiles}
                  onClick={() => setShowFiles(!showFiles)} 
                />
                <TopBarButton 
                  label="History" 
                  active={showHistory}
                  onClick={() => setShowHistory(!showHistory)} 
                />
                <TopBarButton 
                  label="📸" 
                  active={showCaptures}
                  onClick={() => setShowCaptures(!showCaptures)} 
                />
                <TopBarButton label="Deploy" primary />
              </div>
            </header>

            {/* Main Dev Environment */}
            <div className="flex-1 flex overflow-hidden">
              {/* PRD Panel (collapsible) */}
              {showPRD && (
                <div className="w-80 bg-jett-surface border-r border-jett-border flex flex-col">
                  <div className="p-4 border-b border-jett-border flex items-center justify-between">
                    <h2 className="font-medium">PRD</h2>
                    <button 
                      onClick={() => setShowPRD(false)}
                      className="text-jett-muted hover:text-jett-text"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <p className="text-sm text-jett-muted">
                      Your Product Requirements Document will appear here.
                    </p>
                    <p className="text-sm text-jett-muted mt-4">
                      Start by describing what you want to build in the chat.
                    </p>
                  </div>
                </div>
              )}

              {/* Chat + Context (resizable) */}
              <ResizablePanes
                left={<ChatPanel />}
                right={
                  <ContextWindow 
                    url={contextUrl}
                    label={contextLabel}
                    onNavigate={setContextUrl}
                  />
                }
                initialLeftWidth={400}
                minLeftWidth={300}
                maxLeftWidth={600}
              />

              {/* Right Drawer (Tasks, Files, History, Captures) */}
              {(showTasks || showFiles || showHistory || showCaptures) && (
                <div className="w-80 bg-jett-surface border-l border-jett-border flex flex-col">
                  {/* Drawer Tabs */}
                  <div className="flex border-b border-jett-border">
                    {showTasks && (
                      <DrawerTab 
                        label="Tasks" 
                        active={true}
                        onClose={() => setShowTasks(false)} 
                      />
                    )}
                    {showFiles && (
                      <DrawerTab 
                        label="Files" 
                        active={true}
                        onClose={() => setShowFiles(false)} 
                      />
                    )}
                    {showHistory && (
                      <DrawerTab 
                        label="History" 
                        active={true}
                        onClose={() => setShowHistory(false)} 
                      />
                    )}
                    {showCaptures && (
                      <DrawerTab 
                        label="📸 Captures" 
                        active={true}
                        onClose={() => setShowCaptures(false)} 
                      />
                    )}
                  </div>
                  
                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto">
                    {showTasks && <TasksPanel />}
                    {showFiles && <FilesPanel />}
                    {showHistory && <HistoryPanel />}
                    {showCaptures && <ContextDebugPanel />}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// Navigation Button Component
function NavButton({ 
  icon, 
  label, 
  collapsed, 
  active,
  onClick
}: { 
  icon: string
  label: string
  collapsed: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className={`
        ${collapsed ? 'w-10 h-10' : 'w-full px-4 py-2'} 
        flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}
        rounded-lg transition-colors
        ${active 
          ? 'bg-jett-accent/20 text-jett-accent' 
          : 'text-jett-muted hover:text-jett-text hover:bg-jett-border/50'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      {!collapsed && <span className="text-sm">{label}</span>}
    </button>
  )
}

// Top Bar Button Component
function TopBarButton({ 
  label, 
  primary = false,
  active = false,
  onClick
}: { 
  label: string
  primary?: boolean
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm rounded-md transition-colors
        ${primary 
          ? 'bg-jett-accent text-white hover:bg-jett-accent/90' 
          : active
            ? 'bg-jett-border text-jett-text'
            : 'text-jett-muted hover:text-jett-text hover:bg-jett-border/50'
        }
      `}
    >
      {label}
    </button>
  )
}

// Drawer Tab Component
function DrawerTab({ 
  label, 
  active, 
  onClose 
}: { 
  label: string
  active: boolean
  onClose: () => void
}) {
  return (
    <div className={`
      flex items-center space-x-2 px-4 py-2 border-r border-jett-border
      ${active ? 'bg-jett-bg' : 'bg-jett-surface'}
    `}>
      <span className="text-sm">{label}</span>
      <button 
        onClick={onClose}
        className="text-jett-muted hover:text-jett-text text-xs"
      >
        ✕
      </button>
    </div>
  )
}

// Placeholder Views
function HomeView() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Jett</h1>
        <p className="text-jett-muted mb-8">Rocket fuel for your imagination</p>
        <button className="bg-jett-accent text-white px-6 py-3 rounded-lg hover:bg-jett-accent/90 transition-colors">
          + New Project
        </button>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="text-lg font-medium mb-4">AI Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-jett-surface rounded-lg">
              <div>
                <p className="font-medium">Automation Level</p>
                <p className="text-sm text-jett-muted">How much should Jett do automatically?</p>
              </div>
              <select className="bg-jett-bg border border-jett-border rounded px-3 py-2 text-sm">
                <option>Semi-auto</option>
                <option>Manual</option>
                <option>Full auto</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-4">Account</h2>
          <div className="p-4 bg-jett-surface rounded-lg">
            <p className="text-sm text-jett-muted">Sign in with Google to save your projects.</p>
            <button className="mt-4 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium">
              Sign in with Google
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

// Placeholder Panels
function TasksPanel() {
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-jett-muted mb-4">Development tasks will appear here.</p>
      <div className="p-3 bg-jett-bg rounded-lg border border-jett-border">
        <div className="flex items-center space-x-2">
          <span className="text-jett-muted">○</span>
          <span className="text-sm">Set up project structure</span>
        </div>
      </div>
      <div className="p-3 bg-jett-bg rounded-lg border border-jett-border">
        <div className="flex items-center space-x-2">
          <span className="text-jett-muted">○</span>
          <span className="text-sm">Create main components</span>
        </div>
      </div>
      <div className="p-3 bg-jett-bg rounded-lg border border-jett-border">
        <div className="flex items-center space-x-2">
          <span className="text-jett-muted">○</span>
          <span className="text-sm">Connect to database</span>
        </div>
      </div>
    </div>
  )
}

function FilesPanel() {
  return (
    <div className="p-4 space-y-1">
      <p className="text-sm text-jett-muted mb-4">Project files will appear here.</p>
      <div className="text-sm">
        <div className="flex items-center space-x-2 p-2 hover:bg-jett-bg rounded cursor-pointer">
          <span>📁</span>
          <span>src</span>
        </div>
        <div className="flex items-center space-x-2 p-2 hover:bg-jett-bg rounded cursor-pointer pl-6">
          <span>📄</span>
          <span>App.tsx</span>
        </div>
        <div className="flex items-center space-x-2 p-2 hover:bg-jett-bg rounded cursor-pointer pl-6">
          <span>📄</span>
          <span>main.tsx</span>
        </div>
        <div className="flex items-center space-x-2 p-2 hover:bg-jett-bg rounded cursor-pointer">
          <span>📄</span>
          <span>package.json</span>
        </div>
      </div>
    </div>
  )
}

function HistoryPanel() {
  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-jett-muted mb-4">Snapshots will appear here.</p>
      <div className="relative pl-4 border-l-2 border-jett-border space-y-4">
        <div className="relative">
          <div className="absolute -left-[21px] w-3 h-3 bg-jett-accent rounded-full"></div>
          <div className="p-3 bg-jett-bg rounded-lg">
            <p className="text-sm font-medium">Now</p>
            <p className="text-xs text-jett-muted">Current state</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-[21px] w-3 h-3 bg-jett-border rounded-full"></div>
          <div className="p-3 bg-jett-bg rounded-lg">
            <p className="text-sm">Initial setup</p>
            <p className="text-xs text-jett-muted">5 min ago</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
