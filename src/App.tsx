import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { TermsOfService } from './components/legal/TermsOfService';
import ProjectList from './components/ProjectList'
import PRDForm from './components/PRDForm'
import PRDCanvas from './components/PRDCanvas'
import IsolatedBuildSystem from './components/IsolatedBuildSystem'
import ReviewView from './components/ReviewView'
import SettingsPanel from './components/SettingsPanel'
import FigmaImportModal from './components/FigmaImportModal'
import BrainstormView from './components/BrainstormView'
import TemplateGallery, { TEMPLATES } from './components/TemplateGallery'
import UserMenu from './components/UserMenu'
import HistoryView from './components/HistoryView'
import HelpPanel, { HelpBubble } from './components/HelpPanel'
import { IconDocument, IconFolder as IconCanvas, IconCode } from './components/Icons'
import { AuthProvider, useAuth, useSubscription } from './contexts/AuthContext'
import AuthScreen from './components/auth/AuthScreen'
import { 
  fetchProjects, upsertProject, deleteProject as deleteProjectCloud,
  fetchIdeas, upsertIdea, deleteIdea as deleteIdeaCloud,
  syncAllProjects, syncAllIdeas 
} from './lib/sync'

// Theme Context
type Theme = 'light' | 'dark'
interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}
export const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  captures?: PRDCapture[]
}

interface PRDCapture {
  id: string
  section: 'overview' | 'features' | 'users' | 'screens' | 'data' | 'design'
  content: string
  timestamp: string
  pushed?: boolean
}

interface Idea {
  id: string
  title: string
  description: string
  tags: string[]
  chat: ChatMessage[]
  prdCaptures: {
    overview: PRDCapture[]
    features: PRDCapture[]
    users: PRDCapture[]
    screens: PRDCapture[]
    data: PRDCapture[]
    design: PRDCapture[]
  }
  createdAt: string
  updatedAt: string
  status: 'raw' | 'chatting' | 'ready' | 'promoted'
  projectId?: string
}

interface Task {
  id: string
  description: string
  status: 'pending' | 'executing' | 'verifying' | 'working' | 'failed'
  attempts: number
}

interface Suggestion {
  id: string
  rank: 1 | 2 | 3
  category: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface Module {
  id: string
  name: string
  description: string
  status: 'draft' | 'building' | 'complete' | 'needs-work'
  version: number
  tasks: Task[]
  suggestions: Suggestion[]
  files: string[]  // which files this module owns
}

interface VersionEntry {
  version: number
  deployedAt: string
  url: string
}

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

interface PublishedVersion {
  id: string
  published_at: string
  description: string
  url: string
  screenshot?: string
  files: Record<string, string>
}

interface Project {
  id: string
  name: string
  status: 'draft' | 'building' | 'complete'
  mode: 'dev' | 'test' | 'prod'
  prd: any
  tasks: any[]  // Legacy - flat task list
  modules: Module[]  // New - modular tasks
  priorityStack: string[]  // Module IDs in priority order
  buildSteps?: any[]  // NEW: Isolated build steps
  deployUrl: string | null
  prodUrl: string | null
  prodVersion: number
  versionHistory: VersionEntry[]
  suggestions: Suggestion[]
  review: Review  // NEW: Code review results
  published_versions?: PublishedVersion[]  // NEW: History tab versions
  createdAt: string
  updatedAt: string
}

type View = 'projects' | 'ideas' | 'prd' | 'build' | 'review' | 'history'

function MainApp() {
  const { user } = useAuth()
  const [view, setView] = useState<View>('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [autoReview, setAutoReview] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [provider, setProvider] = useState('anthropic')
  const [model, setModel] = useState('claude-opus-4-5-20251101')
  const [theme, setTheme] = useState<Theme>('dark')
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showFigmaImport, setShowFigmaImport] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [pendingProjectName, setPendingProjectName] = useState<string | null>(null)
  const [prdViewMode, setPrdViewMode] = useState<'form' | 'canvas'>('form')

  useEffect(() => {
    loadInitialData()
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Cloud sync - runs when user becomes available
  useEffect(() => {
    if (!user?.id) return
    
    // Small delay to ensure Supabase session is fully established
    const timer = setTimeout(async () => {
      setSyncStatus('syncing')
      try {
        // Sync projects
        const localProjects = await window.jett.getProjects()
        const migratedProjects = (localProjects || []).map((p: Project) => ({
          ...p,
          review: p.review || { status: 'pending', errors: [], improvements: [], simplifications: [] }
        }))
        
        const syncedProjects = await syncAllProjects(user.id, migratedProjects)
        setProjects(syncedProjects)
        for (const project of syncedProjects) {
          await window.jett.updateProject(project)
        }
        
        // Sync ideas
        const savedIdeas = localStorage.getItem('jett-ideas')
        let localIdeas: Idea[] = []
        if (savedIdeas) {
          try {
            localIdeas = JSON.parse(savedIdeas)
          } catch (e) {
            console.error('Failed to parse saved ideas:', e)
          }
        }
        
        const syncedIdeas = await syncAllIdeas(user.id, localIdeas)
        setIdeas(syncedIdeas)
        localStorage.setItem('jett-ideas', JSON.stringify(syncedIdeas))
        
        setSyncStatus('idle')
        console.log('☁️ Cloud sync complete')
      } catch (syncError) {
        console.error('Cloud sync failed:', syncError)
        setSyncStatus('error')
      }
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [user?.id])

  const loadInitialData = async () => {
    try {
      const settings = await window.jett.getSettings()
      setApiKey(settings.apiKey || '')
      setProvider(settings.provider || 'anthropic')
      setModel(settings.model || 'claude-opus-4-5-20251101')
      setTheme(settings.theme || 'dark')
      
      // Also check localStorage for additional settings
      const savedProvider = localStorage.getItem('jett-provider')
      const savedModel = localStorage.getItem('jett-model')
      const savedApiKey = localStorage.getItem('jett-api-key')
      if (savedProvider) setProvider(savedProvider)
      if (savedModel) setModel(savedModel)
      if (savedApiKey && !settings.apiKey) setApiKey(savedApiKey)
      
      // Load local projects first (local-first)
      const localProjects = await window.jett.getProjects()
      const migratedProjects = (localProjects || []).map((p: Project) => ({
        ...p,
        review: p.review || { status: 'pending', errors: [], improvements: [], simplifications: [] }
      }))
      setProjects(migratedProjects)
      
      // Load local ideas
      const savedIdeas = localStorage.getItem('jett-ideas')
      if (savedIdeas) {
        try {
          setIdeas(JSON.parse(savedIdeas))
        } catch (e) {
          console.error('Failed to parse saved ideas:', e)
        }
      }
      
      // Load last project if exists
      if (settings.lastProjectId && migratedProjects.length > 0) {
        const lastProject = migratedProjects.find((p: Project) => p.id === settings.lastProjectId)
        if (lastProject) {
          setCurrentProject(lastProject)
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Ideas handlers
  const handleIdeasUpdate = async (newIdeas: Idea[]) => {
    setIdeas(newIdeas)
    localStorage.setItem('jett-ideas', JSON.stringify(newIdeas))
    
    // Sync to cloud if logged in
    if (user?.id) {
      // Find which ideas changed (new or updated)
      for (const idea of newIdeas) {
        await upsertIdea(user.id, idea)
      }
    }
  }

  const handlePromoteToProject = async (idea: Idea) => {
    // Use the PRD that was built from captures
    const prd = (idea as any).prd || {
      overview: { 
        name: idea.title, 
        description: idea.prdCaptures.overview.map(c => c.content).join('\n') || idea.description, 
        coreGoal: idea.prdCaptures.overview[0]?.content || '', 
        platform: 'web' 
      },
      targetUsers: { 
        primaryUser: idea.prdCaptures.users.map(c => c.content).join(', '), 
        userNeeds: '' 
      },
      ideas: [],
      features: idea.prdCaptures.features.map((c, i) => ({
        id: c.id,
        title: c.content.split(':')[0] || c.content,
        description: c.content,
        priority: i < 3 ? 'must-have' : 'nice-to-have'
      })),
      screens: idea.prdCaptures.screens.map(c => ({
        id: c.id,
        name: c.content.split(':')[0] || c.content,
        description: c.content
      })),
      dataModel: { 
        needsDatabase: idea.prdCaptures.data.length > 0, 
        entities: idea.prdCaptures.data.map(c => ({
          id: c.id,
          name: c.content.split(':')[0] || c.content,
          fields: ''
        }))
      },
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' },
      competitors: '',
      designNotes: idea.prdCaptures.design.map(c => c.content).join('\n')
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: idea.title,
      status: 'draft',
      mode: 'dev',
      prd,
      tasks: [],
      modules: [],
      priorityStack: [],
      deployUrl: null,
      prodUrl: null,
      prodVersion: 0,
      versionHistory: [],
      suggestions: [],
      review: { status: 'pending', errors: [], improvements: [], simplifications: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await window.jett.createProject(newProject)
    await window.jett.saveSettings({ lastProjectId: newProject.id })
    
    // Sync to cloud if logged in
    if (user?.id) {
      await upsertProject(user.id, newProject)
    }
    
    // Update the idea with project reference
    handleIdeasUpdate(ideas.map(i => 
      i.id === idea.id ? { ...i, projectId: newProject.id, status: 'promoted' as const } : i
    ))
    
    setProjects([...projects, newProject])
    setCurrentProject(newProject)
    setView('prd')
  }

  // Push capture to current project's PRD
  // Accumulator for batch push operations
  const pendingPrdUpdates = useRef<{section: string, content: string}[]>([])
  const pushTimeout = useRef<NodeJS.Timeout | null>(null)

  const handlePushCapture = (section: string, content: string) => {
    if (!currentProject) return

    // Accumulate updates
    pendingPrdUpdates.current.push({ section, content })

    // Debounce: apply all updates after 100ms of no new pushes
    if (pushTimeout.current) clearTimeout(pushTimeout.current)
    pushTimeout.current = setTimeout(() => {
      const updates = pendingPrdUpdates.current
      pendingPrdUpdates.current = []

      if (updates.length === 0) return

      const updatedPrd = { ...currentProject.prd }

      updates.forEach(({ section, content }) => {
        switch (section) {
          case 'overview':
            updatedPrd.overview = {
              ...updatedPrd.overview,
              description: updatedPrd.overview.description 
                ? `${updatedPrd.overview.description}\n${content}`
                : content
            }
            break
          case 'features':
            updatedPrd.features = [
              ...updatedPrd.features,
              {
                id: `feature-${Date.now()}-${Math.random()}`,
                title: content.split(':')[0] || content,
                description: content,
                priority: 'must-have'
              }
            ]
            break
          case 'users':
            updatedPrd.targetUsers = {
              ...updatedPrd.targetUsers,
              primaryUser: updatedPrd.targetUsers.primaryUser
                ? `${updatedPrd.targetUsers.primaryUser}, ${content}`
                : content
            }
            break
          case 'screens':
            updatedPrd.screens = [
              ...updatedPrd.screens,
              {
                id: `screen-${Date.now()}-${Math.random()}`,
                name: content.split(':')[0] || content,
                description: content
              }
            ]
            break
          case 'data':
            updatedPrd.dataModel = {
              needsDatabase: true,
              entities: [
                ...updatedPrd.dataModel.entities,
                {
                  id: `entity-${Date.now()}-${Math.random()}`,
                  name: content.split(':')[0] || content,
                  fields: ''
                }
              ]
            }
            break
          case 'design':
            updatedPrd.designNotes = updatedPrd.designNotes
              ? `${updatedPrd.designNotes}\n${content}`
              : content
            break
        }
      })

      const updatedProject = { ...currentProject, prd: updatedPrd }
      handleProjectUpdate(updatedProject)
      console.log(`✅ Batched ${updates.length} PRD updates`)
    }, 100)
  }

  const handleCreateProject = async (name: string, templatePrd?: any) => {
    const basePrd = {
      overview: { name, description: '', coreGoal: '', platform: 'web' },
      targetUsers: { primaryUser: '', userNeeds: '' },
      ideas: [],
      features: [],
      dataModel: { needsDatabase: false, entities: [] },
      screens: [],
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' },
      competitors: '',
      designNotes: ''
    }
    
    // Merge template PRD if provided
    const prd = templatePrd ? {
      ...basePrd,
      overview: { ...basePrd.overview, ...templatePrd.overview, name },
      targetUsers: templatePrd.targetUsers || basePrd.targetUsers,
      features: templatePrd.features || basePrd.features,
      dataModel: templatePrd.dataModel || basePrd.dataModel,
      screens: templatePrd.screens || basePrd.screens,
      designNotes: templatePrd.designNotes || basePrd.designNotes,
      techStack: templatePrd.techStack || basePrd.techStack
    } : basePrd
    
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      status: 'draft',
      mode: 'dev',
      prd,
      tasks: [],
      modules: [],
      priorityStack: [],
      deployUrl: null,
      prodUrl: null,
      prodVersion: 0,
      versionHistory: [],
      suggestions: [],
      review: { status: 'pending', errors: [], improvements: [], simplifications: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await window.jett.createProject(newProject)
    await window.jett.saveSettings({ lastProjectId: newProject.id })
    
    // Sync to cloud if logged in
    if (user?.id) {
      await upsertProject(user.id, newProject)
    }
    
    setProjects([...projects, newProject])
    setCurrentProject(newProject)
    
    // If template has PRD content, go to PRD view, otherwise Ideas
    setView(templatePrd ? 'prd' : 'ideas')
  }

  // Handle template selection from gallery
  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setShowTemplateGallery(false)
    if (pendingProjectName) {
      handleCreateProject(pendingProjectName, template.prd)
      setPendingProjectName(null)
    }
  }

  // Start project creation flow (opens template gallery)
  const startProjectCreation = (name: string) => {
    setPendingProjectName(name)
    setShowTemplateGallery(true)
  }

  const handleFigmaImport = async (prd: any) => {
    // If we're in PRD view with a current project, merge into it
    if (view === 'prd' && currentProject) {
      const updatedProject: Project = {
        ...currentProject,
        prd: {
          ...currentProject.prd,
          // Merge design notes
          designNotes: prd.designNotes 
            ? (currentProject.prd.designNotes ? currentProject.prd.designNotes + '\n\n--- Imported from Figma ---\n' + prd.designNotes : prd.designNotes)
            : currentProject.prd.designNotes,
          // Add Figma source
          figmaSource: prd.figmaSource,
          // Merge features if none exist
          features: currentProject.prd.features.length > 0 
            ? currentProject.prd.features 
            : (prd.features || []),
          // Merge screens if none exist
          screens: currentProject.prd.screens.length > 0 
            ? currentProject.prd.screens 
            : (prd.screens || [])
        },
        updatedAt: new Date().toISOString()
      }
      
      await window.jett.updateProject(updatedProject)
      setCurrentProject(updatedProject)
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
      setShowFigmaImport(false)
      return
    }
    
    // Otherwise create a new project
    // Detect platform from Figma screen sizes
    const screenWidths = prd.screens?.map((s: any) => s.width) || []
    const hasMobileScreens = screenWidths.some((w: number) => w <= 430)
    const hasDesktopScreens = screenWidths.some((w: number) => w > 430)
    const detectedPlatform = hasMobileScreens && hasDesktopScreens ? 'both' : hasMobileScreens ? 'mobile' : 'web'
    
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: prd.overview?.name || 'Figma Import',
      status: 'draft',
      mode: 'dev',
      prd: {
        overview: { ...(prd.overview || { name: 'Figma Import', description: '', coreGoal: '' }), platform: detectedPlatform },
        targetUsers: prd.targetUsers?.[0] ? { primaryUser: prd.targetUsers[0].persona, userNeeds: prd.targetUsers[0].needs } : { primaryUser: '', userNeeds: '' },
        ideas: [],
        features: prd.features || [],
        dataModel: { needsDatabase: false, entities: [] },
        screens: prd.screens || [],
        techStack: prd.techStack || { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' },
        competitors: '',
        designNotes: prd.designNotes || '',
        figmaSource: prd.figmaSource
      },
      tasks: [],
      modules: [],
      priorityStack: [],
      deployUrl: null,
      prodUrl: null,
      prodVersion: 0,
      versionHistory: [],
      suggestions: [],
      review: { status: 'pending', errors: [], improvements: [], simplifications: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await window.jett.createProject(newProject)
    await window.jett.saveSettings({ lastProjectId: newProject.id })
    
    // Sync to cloud if logged in
    if (user?.id) {
      await upsertProject(user.id, newProject)
    }
    
    setProjects([...projects, newProject])
    setCurrentProject(newProject)
    setShowFigmaImport(false)
    setView('prd')
  }

  const handleSelectProject = async (project: Project) => {
    await window.jett.saveSettings({ lastProjectId: project.id })
    setCurrentProject(project)
    setView(project.status === 'draft' ? 'prd' : 'build')
  }

  const handleDeleteProject = async (projectId: string) => {
    await window.jett.deleteProject(projectId)
    const updated = projects.filter(p => p.id !== projectId)
    setProjects(updated)
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView('projects')
    }
    
    // Delete from cloud if logged in
    if (user?.id) {
      await deleteProjectCloud(projectId)
    }
  }

  const handleProjectUpdate = async (updatedProject: Project) => {
    await window.jett.updateProject(updatedProject)
    setCurrentProject(updatedProject)
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p))
    
    // Sync to cloud if logged in
    if (user?.id) {
      await upsertProject(user.id, updatedProject)
    }
  }

  // Review handlers
  const handleReviewUpdate = async (review: Review) => {
    if (!currentProject) return
    const updatedProject = { ...currentProject, review }
    await handleProjectUpdate(updatedProject)
  }

  // Handle runtime errors from preview webview - adds to Review
  const handleRuntimeError = (error: { message: string; file?: string; line?: number }) => {
    if (!currentProject) return
    
    const currentReview = currentProject.review || { 
      status: 'pending', 
      errors: [], 
      improvements: [], 
      simplifications: [] 
    }
    
    // Check if we already have this error
    const isDuplicate = currentReview.errors.some(e => 
      e.description.includes(error.message.slice(0, 50))
    )
    if (isDuplicate) return
    
    // Create new error item
    const newError: ReviewItem = {
      id: `runtime-${Date.now()}`,
      severity: 'high',
      category: 'error',
      title: 'Runtime Error',
      description: error.message,
      file: error.file,
      line: error.line,
      suggestion: 'Check the console for full stack trace and fix the error',
      status: 'open'
    }
    
    // Add to review
    const updatedReview = {
      ...currentReview,
      errors: [...currentReview.errors, newError]
    }
    
    handleReviewUpdate(updatedReview)
    console.log('🚨 Runtime error captured:', error.message.slice(0, 100))
  }

  const handleRunReview = async () => {
    if (!currentProject || !apiKey) return
    
    // Set status to running
    const currentReview = currentProject.review || { status: 'pending', errors: [], improvements: [], simplifications: [] }
    await handleReviewUpdate({ ...currentReview, status: 'running' })
    
    try {
      // Get all project files for review using existing APIs
      const listResult = await window.jett.listFiles(currentProject.id)
      if (!listResult.success || !listResult.files) {
        throw new Error('Could not list project files')
      }
      
      // Filter for source files only
      const sourceFiles = listResult.files.filter((f: string) => 
        (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css')) &&
        !f.includes('node_modules') &&
        f.startsWith('src/')
      )
      
      // Read each file
      const files: Record<string, string> = {}
      for (const filePath of sourceFiles.slice(0, 20)) { // Limit to 20 files
        try {
          const readResult = await window.jett.readFile(currentProject.id, filePath)
          if (readResult.success && readResult.content) {
            files[filePath] = readResult.content
          }
        } catch (e) {
          // Skip files that can't be read
        }
      }
      
      const prompt = `You are a senior code reviewer and UX expert. Review this codebase and identify:

1. ERRORS - Critical bugs, missing imports, broken functionality
2. UX IMPROVEMENTS - Ways to improve user experience, accessibility, performance
3. SIMPLIFICATIONS - Code that could be simpler while keeping its value (duplicate logic, over-engineering, unnecessary complexity)

For each issue, provide:
- severity: critical, high, medium, or low
- category: error, ux, a11y, performance, or simplify
- title: Brief description
- description: Detailed explanation
- file: Which file (if applicable)
- suggestion: How to fix it

Respond with a JSON object:
{
  "errors": [...],
  "improvements": [...],
  "simplifications": [...]
}

SIMPLIFICATION EXAMPLES TO LOOK FOR:
- Multiple similar handlers that could be one generic function
- Complex ternary chains that could be early returns
- State that could be derived instead of stored
- Components doing too many things
- Redundant null checks
- Over-abstracted code

PROJECT FILES:
${Object.entries(files).map(([path, content]) => `--- ${path} ---\n${content}`).join('\n\n')}

Focus on actionable improvements. Be specific. Limit to 15 most important items total.`

      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: prompt }]),
        undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        // Parse the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          const errors: ReviewItem[] = (parsed.errors || []).map((e: any, i: number) => ({
            id: `error-${Date.now()}-${i}`,
            severity: e.severity || 'medium',
            category: e.category || 'error',
            title: e.title || 'Unknown error',
            description: e.description || '',
            file: e.file,
            line: e.line,
            suggestion: e.suggestion,
            status: 'open'
          }))
          const improvements: ReviewItem[] = (parsed.improvements || []).map((e: any, i: number) => ({
            id: `improve-${Date.now()}-${i}`,
            severity: e.severity || 'medium',
            category: e.category || 'ux',
            title: e.title || 'Improvement',
            description: e.description || '',
            file: e.file,
            line: e.line,
            suggestion: e.suggestion,
            status: 'open'
          }))
          const simplifications: ReviewItem[] = (parsed.simplifications || []).map((e: any, i: number) => ({
            id: `simplify-${Date.now()}-${i}`,
            severity: e.severity || 'medium',
            category: 'simplify' as const,
            title: e.title || 'Simplification',
            description: e.description || '',
            file: e.file,
            line: e.line,
            suggestion: e.suggestion,
            status: 'open'
          }))
          
          await handleReviewUpdate({
            status: 'complete',
            errors,
            improvements,
            simplifications,
            completedAt: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('Review failed:', error)
      const currentReview = currentProject.review || { status: 'pending', errors: [], improvements: [], simplifications: [] }
      await handleReviewUpdate({ ...currentReview, status: 'pending' })
    }
  }

  const handleBuildImprovement = async (item: ReviewItem) => {
    if (!currentProject || !apiKey) return
    
    const prompt = `Fix this issue in the codebase:

ISSUE: ${item.title}
DESCRIPTION: ${item.description}
FILE: ${item.file || 'Unknown'}
SUGGESTION: ${item.suggestion || 'No specific suggestion'}

Make the minimal changes needed to fix this. Output the complete updated file(s) using this format:

---FILE-START: path/to/file.tsx---
[complete file content]
---FILE-END---`

    const result = await window.jett.claudeApi(
      apiKey,
      JSON.stringify([{ role: 'user', content: prompt }]),
      undefined,
      provider,
      model
    )

    if (result.success && result.text) {
      // Extract and write files
      const fileRegex = /---FILE-START:\s*(.+?)---\n([\s\S]*?)---FILE-END---/g
      let match
      while ((match = fileRegex.exec(result.text)) !== null) {
        const filePath = match[1].trim()
        const content = match[2]
        await window.jett.writeFile(currentProject.id, filePath, content)
      }
    }
  }

  const handleDeploy = async () => {
    if (!currentProject) return
    try {
      const result = await window.jett.deployToVercel(currentProject.id)
      if (result.success && result.url) {
        const updatedProject = {
          ...currentProject,
          mode: 'prod' as const,
          prodUrl: result.url,
          prodVersion: currentProject.prodVersion + 1,
          versionHistory: [
            ...currentProject.versionHistory,
            { version: currentProject.prodVersion + 1, deployedAt: new Date().toISOString(), url: result.url }
          ]
        }
        await handleProjectUpdate(updatedProject)
      }
    } catch (error) {
      console.error('Deploy failed:', error)
    }
  }

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey)
    window.jett.saveSettings({ apiKey: newKey })
  }

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    window.jett.saveSettings({ provider: newProvider })
  }

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    window.jett.saveSettings({ model: newModel })
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    window.jett.saveSettings({ theme: newTheme })
  }

  const handleSettingsSave = async (newApiKey: string, newProvider: string, newTheme?: Theme) => {
    setApiKey(newApiKey)
    setProvider(newProvider)
    if (newTheme) {
      setTheme(newTheme)
    }
    await window.jett.saveSettings({ 
      apiKey: newApiKey, 
      provider: newProvider,
      theme: newTheme || theme
    })
  }

  const handleGenerateTasks = () => {
    if (currentProject) {
      setCurrentProject({ ...currentProject, status: 'building' })
      setView('build')
    }
  }

  if (loading) {
    return (
      <div 
        className="h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className="h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        {/* Header */}
        <header 
          className="h-[52px] flex items-center px-4 pl-20"
          style={{ 
            background: 'var(--bg-elevated)', 
            borderBottom: '1px solid var(--border-primary)' 
          }}
        >
          <div className="flex items-center gap-2">
            {/* Projects button */}
            <button
              onClick={() => setView('projects')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
              style={{ 
                background: view === 'projects' ? 'var(--bg-tertiary)' : 'transparent',
                color: view === 'projects' ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}
              onMouseEnter={(e) => {
                if (view !== 'projects') {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'projects') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Projects
            </button>
            
            {/* Ideas button */}
            <button
              onClick={() => setView('ideas')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
              style={{ 
                background: view === 'ideas' ? 'var(--bg-tertiary)' : 'transparent',
                color: view === 'ideas' ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}
              onMouseEnter={(e) => {
                if (view !== 'ideas') {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'ideas') {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-tertiary)'
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              Ideas
            </button>
            
            {/* Project tabs - only show when project selected */}
            {currentProject && (
              <>
                {/* Divider */}
                <div className="h-6 w-px mx-1" style={{ background: 'var(--border-secondary)' }} />
                
                {/* PRD Tab */}
                <button
                  onClick={() => setView('prd')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                  style={{ 
                    background: view === 'prd' ? 'var(--bg-tertiary)' : 'transparent',
                    color: view === 'prd' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}
                  onMouseEnter={(e) => {
                    if (view !== 'prd') {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view !== 'prd') {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  PRD
                </button>
                
                {/* Build Tab */}
                <button
                  onClick={() => setView('build')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                  style={{ 
                    background: view === 'build' ? 'var(--bg-tertiary)' : 'transparent',
                    color: view === 'build' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}
                  onMouseEnter={(e) => {
                    if (view !== 'build') {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view !== 'build') {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                    <path d="M2 2l7.586 7.586"/>
                    <circle cx="11" cy="11" r="2"/>
                  </svg>
                  Build
                </button>
                
                {/* Review Tab */}
                <button
                  onClick={() => setView('review')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                  style={{ 
                    background: view === 'review' ? 'var(--bg-tertiary)' : 'transparent',
                    color: view === 'review' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}
                  onMouseEnter={(e) => {
                    if (view !== 'review') {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view !== 'review') {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }
                  }}
                >
                  <IconCode size={14} />
                  Review
                  {currentProject.review?.status === 'complete' && 
                   (currentProject.review?.errors?.filter(e => e.status === 'open').length || 0) > 0 && (
                    <span 
                      className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                      style={{ background: 'var(--error)', color: 'white' }}
                    >
                      {currentProject.review.errors.filter(e => e.status === 'open').length}
                    </span>
                  )}
                </button>
                
                {/* History Tab */}
                <button
                  onClick={() => setView('history')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
                  style={{ 
                    background: view === 'history' ? 'var(--bg-tertiary)' : 'transparent',
                    color: view === 'history' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}
                  onMouseEnter={(e) => {
                    if (view !== 'history') {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view !== 'history') {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-tertiary)'
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  History
                </button>
                
                {/* Divider */}
                <div className="h-6 w-px mx-1" style={{ background: 'var(--border-secondary)' }} />
                
                {/* Mode indicator */}
                <div 
                  className="px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide"
                  style={{ 
                    background: currentProject.mode === 'prod' ? 'var(--success)' : 'var(--bg-tertiary)',
                    color: currentProject.mode === 'prod' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  {currentProject.mode === 'prod' ? 'LIVE' : 'DEV'}
                </div>
                
                {/* Project name */}
                <span 
                  className="text-sm truncate max-w-[150px]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {currentProject.name}
                </span>
              </>
            )}
          </div>
          
          {/* Right side - View Live button + Settings */}
          <div className="ml-auto flex items-center gap-3">
            {currentProject?.prodUrl && (
              <button
                onClick={() => window.jett.openExternal(currentProject.prodUrl!)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-150"
                style={{ 
                  background: 'var(--success)',
                  color: 'white'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                View Live
              </button>
            )}
            
            {/* Sync status indicator */}
            {syncStatus !== 'idle' && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{ 
                  background: syncStatus === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: syncStatus === 'error' ? 'var(--error)' : 'var(--accent-primary)'
                }}
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Sync failed
                  </>
                )}
              </div>
            )}
            
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg transition-all duration-150"
              style={{ 
                background: 'transparent',
                color: 'var(--text-tertiary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-tertiary)'
              }}
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            
  {/* Help bubble */}
<HelpBubble onClick={() => setShowHelp(true)} />

            {/* User Menu */}
            <UserMenu />
          </div>
        </header>

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
          provider={provider}
          onProviderChange={handleProviderChange}
          model={model}
          onModelChange={handleModelChange}
        />

<HelpPanel
  isOpen={showHelp}
  onClose={() => setShowHelp(false)}
  apiKey={apiKey}
  provider={provider}
  model={model}
/>

        {/* Figma Import Modal */}
        <FigmaImportModal
          isOpen={showFigmaImport}
          onClose={() => setShowFigmaImport(false)}
          onImport={handleFigmaImport}
        />

        {/* Template Gallery Modal */}
        {showTemplateGallery && (
          <TemplateGallery
            onSelectTemplate={handleTemplateSelect}
            onClose={() => {
              setShowTemplateGallery(false)
              setPendingProjectName(null)
            }}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {view === 'projects' && (
            <ProjectList
              projects={projects}
              onCreateProject={startProjectCreation}
              onSelectProject={(project) => { handleSelectProject(project) }}
              onDeleteProject={handleDeleteProject}
              onImportFigma={() => setShowFigmaImport(true)}
              onOpenSettings={() => setShowSettings(true)}
              apiKey={apiKey}
            />
          )}
          
          {view === 'ideas' && (
            <BrainstormView
              ideas={ideas}
              onIdeasUpdate={handleIdeasUpdate}
              onPromoteToProject={handlePromoteToProject}
              onPushCapture={currentProject ? handlePushCapture : undefined}
              currentProject={currentProject}
              projects={projects}
              onProjectSelect={(projectId) => {
                const project = projects.find(p => p.id === projectId)
                if (project) {
                  setCurrentProject(project)
                  window.jett.saveSettings({ lastProjectId: project.id })
                }
              }}
              apiKey={apiKey}
              provider={provider}
              model={model}
              selectedIdeaId={selectedIdeaId}
              onSelectedIdeaIdChange={setSelectedIdeaId}
            />
          )}
          
          {view === 'prd' && currentProject && (
            <div className="h-full flex flex-col">
              {/* PRD View Toggle */}
              <div 
                className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                    <button
                      onClick={() => setPrdViewMode('form')}
                      className="px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1"
                      style={{ 
                        background: prdViewMode === 'form' ? 'var(--bg-primary)' : 'transparent',
                        color: prdViewMode === 'form' ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <IconDocument size={12} /> Form
                    </button>
                    <button
                      onClick={() => setPrdViewMode('canvas')}
                      className="px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1"
                      style={{ 
                        background: prdViewMode === 'canvas' ? 'var(--bg-primary)' : 'transparent',
                        color: prdViewMode === 'canvas' ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <IconCanvas size={12} /> Canvas
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleGenerateTasks}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  Generate Tasks →
                </button>
              </div>
              
              {/* PRD Content */}
              <div className="flex-1 overflow-hidden">
                {prdViewMode === 'form' ? (
                  <PRDForm
                    project={currentProject}
                    onProjectUpdate={(project) => { handleProjectUpdate(project) }}
                    onGenerateTasks={handleGenerateTasks}
                    onImportFigma={() => setShowFigmaImport(true)}
                    apiKey={apiKey}
                    provider={provider}
                    model={model}
                  />
                ) : (
                  <PRDCanvas
                    project={currentProject}
                    onProjectUpdate={(project) => { handleProjectUpdate(project) }}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Build - Always mounted when project exists to preserve build state */}
          {currentProject && (
            <div className={view === 'build' ? 'h-full' : 'hidden'}>
              <IsolatedBuildSystem
                project={currentProject}
                apiKey={apiKey}
                provider={provider}
                model={model}
                onProjectUpdate={(project) => { handleProjectUpdate(project) }}
                onRuntimeError={handleRuntimeError}
              />
            </div>
          )}
          
          {view === 'review' && currentProject && (
            <ReviewView
              project={{
                id: currentProject.id,
                name: currentProject.name,
                review: currentProject.review || { status: 'pending', errors: [], improvements: [], simplifications: [] }
              }}
              onReviewUpdate={handleReviewUpdate}
              onBuildImprovement={handleBuildImprovement}
              onRunReview={handleRunReview}
              onDeploy={handleDeploy}
              autoReview={autoReview}
              onAutoReviewToggle={setAutoReview}
              apiKey={apiKey}
            />
          )}
          
          {view === 'history' && currentProject && (
            <HistoryView
              projectPath={currentProject.id}
              projectName={currentProject.name}
              versions={currentProject.published_versions || []}
              onVersionsChange={(versions) => handleProjectUpdate({ ...currentProject, published_versions: versions })}
            />
          )}
        </main>
      </div>
    </ThemeContext.Provider>
  )
}

// Trial banner component
// Stripe configuration
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/9B614o1hR6wa1xT74GcIE00'

function TrialBanner() {
  const { trialDaysLeft, isTrialing, isPastDue } = useSubscription()
  const { user } = useAuth()

  if (!isTrialing && !isPastDue) return null

  const handleSubscribe = () => {
    // Open Stripe payment link with prefilled email
    const url = new URL(STRIPE_PAYMENT_LINK)
    if (user?.email) {
      url.searchParams.set('prefilled_email', user.email)
    }
    // Use Electron's shell to open external URL
    window.jett?.openExternal(url.toString())
  }

  return (
    <div 
      className="px-4 py-2 text-center text-sm"
      style={{ 
        background: isPastDue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        color: isPastDue ? 'var(--error)' : 'var(--text-primary)'
      }}
    >
      {isPastDue ? (
        <>
          ⚠️ Payment failed. Please update your payment method to continue using Jett.
          <button onClick={handleSubscribe} className="ml-2 underline">Update Payment</button>
        </>
      ) : (
        <>
          🎉 {trialDaysLeft} days left in your free trial.
          <button onClick={handleSubscribe} className="ml-2 underline">Subscribe Now</button>
        </>
      )}
    </div>
  )
}

// App wrapper with auth
function AppWithAuth() {
  const { user, loading, initialized } = useAuth()
  const { canUseApp } = useSubscription()
  const [authenticated, setAuthenticated] = useState(false)

  // Show loading while checking auth state
  if (!initialized || loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />
  }

  // Show main app
  return (
    <div className="flex flex-col h-screen">
      <TrialBanner />
      <div className="flex-1 overflow-hidden">
        <MainApp />
      </div>
    </div>
  )
}

// Root App with providers
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  )
}
