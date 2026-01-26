import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { validatePath, checkRateLimit, sanitizeForShell } from './security'
import { migrateToSecureStorage, storeSecureKey, getSecureKey } from './keychain'
// v1.5.0: Playwright for functional testing
import { initPlaywright, closePlaywright, runTest, waitForDevServer } from './testing'

// Learning system imports
import {
  loadDatabase,
  getProjectContext,
  updateProjectContext,
  findPatterns,
  updatePatternConfidence,
  getLearningStats,
  extractAndSavePatterns,
  formatContextForPrompt,
  getSmartSuggestions,
  recordSuggestionBuilt,
  refreshSuggestions
} from '../learning/index'

// History system imports
import {
  createSnapshot,
  listSnapshots,
  restoreSnapshot,
  deleteSnapshotsAfter,
  getSnapshotDetails,
  createInitialSnapshot
} from '../history/index'
import { registerHistoryHandlers } from '../history-ipc-handlers'

// Validation system imports
import {
  runAllValidations,
  validateCodeReviewPlugin,
  validateMemoryPlugin,
  validateGitHubPlugin
} from '../validation/index'

// Code simplifier import
import { simplifyCode, analyzeForSimplification } from '../plugins/code-simplifier'

// Memory plugin import
import {
  loadMemory,
  getGlobalPreferences,
  updateGlobalPreferences,
  getProjectMemory,
  updateProjectMemory,
  learnFromBuild,
  registerComponent,
  generateMemoryContext,
  clearMemory,
  clearProjectMemory,
  getMemoryStats
} from '../plugins/memory'

// GitHub plugin import
import {
  loadGitConfig,
  saveGitConfig,
  isGitInstalled,
  initRepo,
  isRepoInitialized,
  getCurrentBranch,
  commit,
  commitTask,
  addRemote,
  push,
  getHistory,
  hasUncommittedChanges,
  authenticateWithPAT,
  logout as gitLogout,
  isAuthenticated as gitIsAuthenticated,
  getCurrentUser,
  createRepo,
  enablePages,
  getPagesStatus,
  deployToGitHub
} from '../plugins/github'

// Error capture plugin import
import {
  analyzeErrors,
  hasErrors,
  categorizeError,
  getQuickFix,
  AI_ERROR_FIX_PROMPT,
  type DetectedError,
  type ErrorAnalysis
} from '../plugins/error-capture'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let devServerProcess: ChildProcess | null = null

// Handle external links
ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url)
})

// Dynamic import for electron-store (ESM compatibility)
let store: any = null
async function getStore() {
  if (!store) {
    const Store = (await import('electron-store')).default
    store = new Store()
  }
  return store
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a'
  })

  // In dev mode, load from localhost
  const isDev = !app.isPackaged
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // Open devtools in dev
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

app.whenReady().then(() => {
  // v1.5.0: Migrate keys to secure storage on startup
  migrateToSecureStorage().then(({ migrated, failed }) => {
    if (migrated.length > 0) {
      console.log('Migrated keys to secure storage:', migrated)
    }
    if (failed.length > 0) {
      console.warn('Failed to migrate keys:', failed)
    }
  })

  // v1.5.0: Initialize Playwright for testing
  initPlaywright().catch(err => {
    console.warn('Playwright init failed (testing disabled):', err.message)
  })

  createWindow()
  registerHistoryHandlers()
})

// v1.5.0: Clean up Playwright on quit
app.on('will-quit', async () => {
  await closePlaywright()
})

app.on('window-all-closed', () => {
  stopDevServer()
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// =============================================================================
// STORAGE IPC HANDLERS
// =============================================================================

const getProjectsDir = () => {
  const dir = path.join(app.getPath('documents'), 'jett-projects')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

const getProjectDir = (projectId: string) => {
  const dir = path.join(getProjectsDir(), projectId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

ipcMain.handle('storage:get-settings', async () => {
  const s = await getStore()
  return {
    apiKey: s.get('apiKey', ''),
    provider: s.get('provider', 'anthropic'),
    model: s.get('model', 'claude-opus-4-5-20251101'),
    theme: s.get('theme', 'dark'),
    lastProjectId: s.get('lastProjectId', null)
  }
})

ipcMain.handle('storage:save-settings', async (_event, settings: any) => {
  const s = await getStore()
  if (settings.apiKey !== undefined) s.set('apiKey', settings.apiKey)
  if (settings.provider !== undefined) s.set('provider', settings.provider)
  if (settings.model !== undefined) s.set('model', settings.model)
  if (settings.theme !== undefined) s.set('theme', settings.theme)
  if (settings.lastProjectId !== undefined) s.set('lastProjectId', settings.lastProjectId)
  return true
})

// =============================================================================
// AUTH SESSION STORAGE (for Supabase persistence)
// =============================================================================

ipcMain.handle('auth:get-session', async () => {
  const s = await getStore()
  return s.get('supabase_session', null)
})

ipcMain.handle('auth:set-session', async (_event, session: any) => {
  const s = await getStore()
  if (session) {
    s.set('supabase_session', session)
  } else {
    s.delete('supabase_session')
  }
  return true
})

ipcMain.handle('auth:remove-session', async () => {
  const s = await getStore()
  s.delete('supabase_session')
  return true
})

// Remember email for login
ipcMain.handle('auth:get-remembered-email', async () => {
  const s = await getStore()
  return s.get('remembered_email', '')
})

ipcMain.handle('auth:set-remembered-email', async (_event, email: string) => {
  const s = await getStore()
  s.set('remembered_email', email)
  return true
})

ipcMain.handle('storage:get-projects', async () => {
  const s = await getStore()
  return s.get('projects', [])
})

ipcMain.handle('storage:create-project', async (_event, project: any) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  projects.push(project)
  s.set('projects', projects)
  getProjectDir(project.id) // Create project folder
  return project
})

ipcMain.handle('storage:update-project', async (_event, project: any) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  const idx = projects.findIndex((p: any) => p.id === project.id)
  if (idx !== -1) {
    projects[idx] = project
    s.set('projects', projects)
  }
  return project
})

ipcMain.handle('storage:delete-project', async (_event, projectId: string) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  const filtered = projects.filter((p: any) => p.id !== projectId)
  s.set('projects', filtered)
  
  // Delete project folder
  const projectDir = path.join(getProjectsDir(), projectId)
  // v1.5.0: Security - validate path
  if (!validatePath(projectDir)) {
    return false
  }
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true })
  }
  return true
})

ipcMain.handle('storage:update-prd', async (_event, projectId: string, prd: any) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  const idx = projects.findIndex((p: any) => p.id === projectId)
  if (idx !== -1) {
    projects[idx].prd = prd
    projects[idx].updatedAt = new Date().toISOString()
    s.set('projects', projects)
  }
  return true
})

ipcMain.handle('storage:update-tasks', async (_event, projectId: string, tasks: any[]) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  const idx = projects.findIndex((p: any) => p.id === projectId)
  if (idx !== -1) {
    projects[idx].tasks = tasks
    projects[idx].updatedAt = new Date().toISOString()
    s.set('projects', projects)
  }
  return true
})

ipcMain.handle('storage:update-project-status', async (_event, projectId: string, status: string) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  const idx = projects.findIndex((p: any) => p.id === projectId)
  if (idx !== -1) {
    projects[idx].status = status
    projects[idx].updatedAt = new Date().toISOString()
    s.set('projects', projects)
  }
  return true
})

ipcMain.handle('storage:set-deploy-url', async (_event, projectId: string, url: string) => {
  const s = await getStore()
  const projects = s.get('projects', [])
  const idx = projects.findIndex((p: any) => p.id === projectId)
  if (idx !== -1) {
    projects[idx].deployUrl = url
    projects[idx].updatedAt = new Date().toISOString()
    s.set('projects', projects)
  }
  return true
})

// =============================================================================
// FILE SYSTEM IPC HANDLERS
// =============================================================================

ipcMain.handle('fs:write-file', async (_event, projectId: string, filePath: string, content: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const fullPath = path.join(projectDir, filePath)
    // v1.5.0: Security - validate path
    if (!validatePath(fullPath)) {
      return { success: false, error: 'Access denied: Path not allowed' }
    }
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(fullPath, content, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:read-file', async (_event, projectId: string, filePath: string) => {
  try {
    const fullPath = path.join(getProjectDir(projectId), filePath)
    // v1.5.0: Security - validate path
    if (!validatePath(fullPath)) {
      return { success: false, error: 'Access denied: Path not allowed' }
    }
    const content = fs.readFileSync(fullPath, 'utf-8')
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:list-files', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const files: string[] = []
    const walk = (dir: string, prefix = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), relative)
        } else {
          files.push(relative)
        }
      }
    }
    walk(projectDir)
    return { success: true, files }
  } catch (error: any) {
    return { success: false, error: error.message, files: [] }
  }
})

// Patch file - surgical find/replace for self-healing
ipcMain.handle('fs:patch-file', async (_event, projectId: string, filePath: string, oldStr: string, newStr: string) => {
  try {
    const fullPath = path.join(getProjectDir(projectId), filePath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    if (!content.includes(oldStr)) {
      return { success: false, error: 'String not found in file' }
    }
    
    // Replace first occurrence only (surgical edit)
    const newContent = content.replace(oldStr, newStr)
    fs.writeFileSync(fullPath, newContent, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// =============================================================================
// DEV SERVER IPC HANDLERS
// =============================================================================

function stopDevServer() {
  if (devServerProcess) {
    devServerProcess.kill('SIGTERM')
    devServerProcess = null
  }
}

ipcMain.handle('run-npm-install', async (_event, projectId: string) => {
  return new Promise((resolve) => {
    const projectDir = getProjectDir(projectId)
    const packageJsonPath = path.join(projectDir, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      resolve({ success: false, error: 'No package.json found' })
      return
    }

    const proc = spawn('npm', ['install'], { cwd: projectDir, shell: true })
    let stdout = ''
    let stderr = ''
    
    proc.stdout?.on('data', (data) => {
      stdout += data.toString()
      mainWindow?.webContents.send('terminal-output', data.toString())
    })
    proc.stderr?.on('data', (data) => {
      stderr += data.toString()
      mainWindow?.webContents.send('terminal-output', data.toString())
    })
    proc.on('close', (code) => {
      const output = stdout + stderr
      const hasError = code !== 0 || hasErrors(output)
      
      if (hasError) {
        const analysis = analyzeErrors(output)
        resolve({ 
          success: false, 
          output,
          errorAnalysis: analysis,
          error: analysis.summary
        })
      } else {
        resolve({ success: true, output })
      }
    })
    proc.on('error', (err) => resolve({ success: false, error: err.message }))
  })
})

ipcMain.handle('start-dev-server', async (_event, projectId: string) => {
  return new Promise((resolve) => {
    stopDevServer()
    const projectDir = getProjectDir(projectId)
    
    if (!fs.existsSync(path.join(projectDir, 'package.json'))) {
      resolve({ success: false, error: 'No package.json found' })
      return
    }

    devServerProcess = spawn('npm', ['run', 'dev'], { cwd: projectDir, shell: true })
    let resolved = false
    let output = ''
    let foundPort: number | null = null

    const checkForReady = (data: string) => {
      output += data
      mainWindow?.webContents.send('terminal-output', data)
      
      // Strip ANSI codes for matching
      const cleanData = data.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
      
      // Look for Vite's ready message with port
      const portMatch = cleanData.match(/localhost:(\d+)/)
      if (portMatch) {
        foundPort = parseInt(portMatch[1])
        if (!resolved) {
          resolved = true
          setTimeout(() => resolve({ success: true, port: foundPort }), 500)
        }
      }
    }

    devServerProcess.stdout?.on('data', (data) => checkForReady(data.toString()))
    devServerProcess.stderr?.on('data', (data) => checkForReady(data.toString()))
    
    devServerProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true
        resolve({ success: false, error: err.message })
      }
    })

    // Timeout after 60 seconds (increased from 30)
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        // If we found a port, return it even on timeout
        if (foundPort) {
          resolve({ success: true, port: foundPort })
        } else {
          resolve({ success: false, error: 'Server start timeout' })
        }
      }
    }, 60000)
  })
})

ipcMain.handle('stop-dev-server', async () => {
  stopDevServer()
  return { success: true }
})

ipcMain.handle('check-dev-server', async (_event, projectId: string) => {
  const projectDir = getProjectDir(projectId)
  const hasPackageJson = fs.existsSync(path.join(projectDir, 'package.json'))
  const hasNodeModules = fs.existsSync(path.join(projectDir, 'node_modules'))
  return { 
    hasPackageJson, 
    hasNodeModules,
    isRunning: devServerProcess !== null
  }
})

// =============================================================================
// SCREENSHOT IPC HANDLERS
// =============================================================================

ipcMain.handle('capture-webview-screenshot', async (_event, webContentsId: number) => {
  try {
    const { webContents } = await import('electron')
    const wc = webContents.fromId(webContentsId)
    if (!wc) return { success: false, error: 'Webview not found' }
    
    const image = await wc.capturePage()
    const base64 = image.toDataURL()
    return { success: true, data: base64 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// =============================================================================
// DEPLOY IPC HANDLERS
// =============================================================================

ipcMain.handle('deploy-to-vercel', async (_event, projectId: string) => {
  return new Promise((resolve) => {
    const projectDir = getProjectDir(projectId)
    
    // First build the project
    const buildProc = spawn('npx', ['vite', 'build'], { cwd: projectDir, shell: true })
    let buildOutput = ''
    
    buildProc.stdout?.on('data', (data) => {
      buildOutput += data.toString()
      mainWindow?.webContents.send('terminal-output', data.toString())
    })
    buildProc.stderr?.on('data', (data) => {
      buildOutput += data.toString()
      mainWindow?.webContents.send('terminal-output', data.toString())
    })
    
    buildProc.on('close', (buildCode) => {
      if (buildCode !== 0) {
        resolve({ success: false, error: 'Build failed' })
        return
      }
      
      // Deploy the dist folder
      const distDir = path.join(projectDir, 'dist')
      const deployProc = spawn('npx', ['vercel', '--yes', '--prod'], { cwd: projectDir, shell: true })
      let deployOutput = ''

      deployProc.stdout?.on('data', (data) => {
        deployOutput += data.toString()
        mainWindow?.webContents.send('terminal-output', data.toString())
      })
      deployProc.stderr?.on('data', (data) => {
        deployOutput += data.toString()
        mainWindow?.webContents.send('terminal-output', data.toString())
      })
      
      deployProc.on('close', (code) => {
        if (code === 0) {
          // Extract URL from output
          const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/)
          resolve({ success: true, url: urlMatch ? urlMatch[0] : null })
        } else {
          resolve({ success: false, error: `Deploy failed with code ${code}` })
        }
      })
      
      deployProc.on('error', (err) => resolve({ success: false, error: err.message }))
    })
    
    buildProc.on('error', (err) => resolve({ success: false, error: err.message }))
  })
})

// =============================================================================
// AI IPC HANDLERS
// =============================================================================

const SYSTEM_PROMPT = `You are Jett, an AI that helps designers build software without coding.

CRITICAL RULES:
1. ONLY use packages that are in package.json. The base template includes: react, react-dom, tailwindcss, vite.
2. DO NOT import from packages like lucide-react, framer-motion, etc. unless you add them to package.json first.
3. For icons, use emoji or simple text/CSS instead of icon libraries.
4. Keep code simple and working over fancy and broken.
5. Task 1 MUST create tsconfig.json for Vercel deployment.

When given a PRD (Product Requirements Document), generate exactly 5 tasks to build the app.

FORMAT YOUR RESPONSE LIKE THIS:
---TASKS-START---
1. Set up project with Vite, React, and Tailwind CSS
2. [Task based on PRD]
3. [Task based on PRD]
4. [Task based on PRD]
5. [Final polish task]
---TASKS-END---

When executing Task 1 (project setup), you MUST create these files:
- package.json (with "build": "vite build" NOT "tsc && vite build")
- vite.config.js
- tailwind.config.js
- postcss.config.js
- tsconfig.json (required for Vercel)
- index.html
- src/main.tsx
- src/App.tsx
- src/index.css

IMPORTANT: The tsconfig.json must include:
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}

When executing a task, output files like this:
---STEPS-START---
Creating [filename]
Updating [filename]
---STEPS-END---

---FILE-START path="src/App.tsx"---
// file content here
---FILE-END---

VERIFICATION MODE:
When asked to verify with a screenshot:
- If working: Reply "WORKING" + brief description
- If broken: Reply "BROKEN" + what's wrong and how to fix it

FIX MODE:
When a task is BROKEN and you need to fix it:
- Look at the error message carefully
- If it says "Failed to resolve import X" - REMOVE that import and use alternatives
- Do NOT keep trying to use the same broken import
- Use emoji (👍 ➕ ➖) or CSS for icons instead of icon libraries
- Simpler working code is better than fancy broken code

Keep responses concise.`

ipcMain.handle('claude-api', async (_event, apiKey: string, messagesJson: string, screenshot?: string, provider?: string, model?: string) => {
  try {
    let messages = JSON.parse(messagesJson)
    
    // Default models per provider
    const defaultModel = provider === 'openrouter' 
      ? 'anthropic/claude-sonnet-4' 
      : provider === 'deepseek'
      ? 'deepseek-chat'
      : 'claude-opus-4-5-20251101'
    
    const selectedModel = model || defaultModel
    
    if (screenshot && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'user') {
        lastMsg.content = [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: screenshot.replace(/^data:image\/\w+;base64,/, '') }},
          { type: 'text', text: typeof lastMsg.content === 'string' ? lastMsg.content : lastMsg.content }
        ]
      }
    }

    if (provider === 'deepseek') {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 8192
        })
      })
      
      const data = await response.json()
      if (data.error) return { success: false, error: data.error.message }
      return { success: true, text: data.choices[0].message.content }
    } else if (provider === 'openrouter') {
      // OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://jett.app',
          'X-Title': 'Jett'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          max_tokens: 8192
        })
      })
      
      const data = await response.json()
      if (data.error) return { success: false, error: data.error.message || data.error }
      return { success: true, text: data.choices?.[0]?.message?.content || '' }
    } else {
      // Anthropic API (default)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages
        })
      })

      const data = await response.json()
      if (data.error) return { success: false, error: data.error.message }
      
      const text = data.content.map((c: any) => c.text).join('')
      return { success: true, text }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// LEARNING SYSTEM IPC HANDLERS
// ============================================

// Initialize learning database on app start
app.whenReady().then(() => {
  loadDatabase()
})

// Get project context for prompt injection
ipcMain.handle('learning:get-context', async (_event, projectId: string) => {
  try {
    const context = getProjectContext(projectId)
    return {
      success: true,
      context,
      formatted: formatContextForPrompt(context)
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Extract and save patterns after task completion
ipcMain.handle('learning:extract-patterns', async (
  _event,
  projectId: string,
  taskDescription: string,
  generatedCode: string,
  files: { [path: string]: string }
) => {
  try {
    await extractAndSavePatterns(projectId, taskDescription, generatedCode, files)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Record verification result for pattern confidence
ipcMain.handle('learning:record-verification', async (
  _event,
  patternId: string,
  success: boolean
) => {
  try {
    updatePatternConfidence(patternId, success)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get similar patterns for a task
ipcMain.handle('learning:find-patterns', async (
  _event,
  keywords: string[],
  appType?: string,
  limit?: number
) => {
  try {
    const patterns = findPatterns({
      keywords,
      appType,
      minConfidence: 0.5,
      limit: limit || 3
    })
    return { success: true, patterns }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get smart suggestions based on learned outcomes
ipcMain.handle('learning:get-suggestions', async (
  _event,
  appType?: string,
  count?: number
) => {
  try {
    const suggestions = getSmartSuggestions(appType || 'any', count || 3)
    return { success: true, suggestions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Record suggestion outcome
ipcMain.handle('learning:record-suggestion', async (
  _event,
  suggestionId: string,
  succeeded: boolean
) => {
  try {
    recordSuggestionBuilt(suggestionId, succeeded)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Refresh suggestions (get different ones)
ipcMain.handle('learning:refresh-suggestions', async (
  _event,
  currentIds: string[],
  appType?: string,
  count?: number
) => {
  try {
    const suggestions = refreshSuggestions(currentIds, appType || 'any', count || 3)
    return { success: true, suggestions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get learning stats
ipcMain.handle('learning:get-stats', async () => {
  try {
    const stats = getLearningStats()
    return { success: true, stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// HISTORY SYSTEM IPC HANDLERS
// ============================================

// Create a snapshot after task completion
ipcMain.handle('history:create-snapshot', async (
  _event,
  projectId: string,
  taskIndex: number,
  taskDescription: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = createSnapshot(projectDir, taskIndex, taskDescription)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Create initial snapshot (task 0)
ipcMain.handle('history:create-initial', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = createInitialSnapshot(projectDir)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// List all snapshots for a project
ipcMain.handle('history:list-snapshots', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = listSnapshots(projectDir)
    return result
  } catch (error: any) {
    return { success: false, snapshots: [], error: error.message }
  }
})

// Restore to a snapshot
ipcMain.handle('history:restore', async (
  _event,
  projectId: string,
  snapshotId: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = restoreSnapshot(projectDir, snapshotId)
    return result
  } catch (error: any) {
    return { success: false, filesRestored: 0, error: error.message }
  }
})

// Delete snapshots after a task (used when rolling back)
ipcMain.handle('history:delete-after', async (
  _event,
  projectId: string,
  taskIndex: number
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = deleteSnapshotsAfter(projectDir, taskIndex)
    return result
  } catch (error: any) {
    return { success: false, deleted: 0, error: error.message }
  }
})

// Get snapshot details
ipcMain.handle('history:get-details', async (
  _event,
  projectId: string,
  snapshotId: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = getSnapshotDetails(projectDir, snapshotId)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// VALIDATION SYSTEM IPC HANDLERS
// ============================================

// Run all plugin validations
ipcMain.handle('validation:run-all', async (_event) => {
  try {
    const logs: string[] = []
    const onProgress = (msg: string) => {
      logs.push(msg)
      mainWindow?.webContents.send('validation:progress', msg)
    }
    
    const summary = await runAllValidations(onProgress)
    return { success: true, summary, logs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Run specific plugin validation
ipcMain.handle('validation:run-plugin', async (
  _event,
  plugin: 'code-review' | 'memory' | 'github'
) => {
  try {
    let results
    switch (plugin) {
      case 'code-review':
        results = await validateCodeReviewPlugin()
        break
      case 'memory':
        results = await validateMemoryPlugin()
        break
      case 'github':
        results = await validateGitHubPlugin()
        break
    }
    return { success: true, results }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// CODE SIMPLIFIER IPC HANDLERS
// ============================================

// Simplify all code files in a project
ipcMain.handle('simplifier:simplify-project', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const srcDir = path.join(projectDir, 'src')
    
    if (!fs.existsSync(srcDir)) {
      return { success: true, filesChanged: 0, changes: [] }
    }
    
    const results: Array<{
      file: string
      changed: boolean
      changeCount: number
    }> = []
    
    // Recursively find all .tsx and .ts files
    const findCodeFiles = (dir: string): string[] => {
      const files: string[] = []
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          files.push(...findCodeFiles(fullPath))
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          files.push(fullPath)
        }
      }
      return files
    }
    
    const codeFiles = findCodeFiles(srcDir)
    
    for (const filePath of codeFiles) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const result = simplifyCode(content)
      
      // Only write if content actually changed
      if (result.simplified !== result.original) {
        fs.writeFileSync(filePath, result.simplified, 'utf-8')
        results.push({
          file: path.relative(projectDir, filePath),
          changed: true,
          changeCount: result.changes.length
        })
      } else {
        results.push({
          file: path.relative(projectDir, filePath),
          changed: false,
          changeCount: 0
        })
      }
    }
    
    const filesChanged = results.filter(r => r.changed).length
    const totalChanges = results.reduce((sum, r) => sum + r.changeCount, 0)
    
    return { 
      success: true, 
      filesChanged,
      totalChanges,
      results 
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Simplify a single file
ipcMain.handle('simplifier:simplify-file', async (
  _event, 
  projectId: string, 
  filePath: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const fullPath = path.join(projectDir, filePath)
    
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: 'File not found' }
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8')
    const result = simplifyCode(content)
    
    if (result.simplified !== result.original) {
      fs.writeFileSync(fullPath, result.simplified, 'utf-8')
    }
    
    return {
      success: true,
      changed: result.simplified !== result.original,
      changes: result.changes
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// MEMORY PLUGIN IPC HANDLERS
// ============================================

// Get global preferences
ipcMain.handle('memory:get-global', async () => {
  try {
    const preferences = getGlobalPreferences()
    return { success: true, preferences }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Update global preferences
ipcMain.handle('memory:update-global', async (
  _event,
  updates: Record<string, any>
) => {
  try {
    const result = updateGlobalPreferences(updates)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get project memory
ipcMain.handle('memory:get-project', async (_event, projectId: string) => {
  try {
    const result = getProjectMemory(projectId)
    return { success: true, ...result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Update project memory
ipcMain.handle('memory:update-project', async (
  _event,
  projectId: string,
  updates: Record<string, any>
) => {
  try {
    const result = updateProjectMemory(projectId, updates)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Learn from build
ipcMain.handle('memory:learn', async (
  _event,
  projectId: string,
  code: string,
  success: boolean
) => {
  try {
    const result = learnFromBuild(projectId, code, success)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Register component
ipcMain.handle('memory:register-component', async (
  _event,
  projectId: string,
  name: string,
  filePath: string,
  purpose: string
) => {
  try {
    const result = registerComponent(projectId, name, filePath, purpose)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get memory context for prompts
ipcMain.handle('memory:get-context', async (_event, projectId: string) => {
  try {
    const context = generateMemoryContext(projectId)
    return { success: true, context }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Clear all memory
ipcMain.handle('memory:clear-all', async () => {
  try {
    const result = clearMemory()
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Clear project memory
ipcMain.handle('memory:clear-project', async (_event, projectId: string) => {
  try {
    const result = clearProjectMemory(projectId)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get memory stats
ipcMain.handle('memory:get-stats', async () => {
  try {
    const stats = getMemoryStats()
    return { success: true, stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// GITHUB PLUGIN IPC HANDLERS
// ============================================

// Check if git is installed
ipcMain.handle('github:check-git', async () => {
  try {
    const installed = await isGitInstalled()
    return { success: true, installed }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get GitHub config
ipcMain.handle('github:get-config', async () => {
  try {
    const config = loadGitConfig()
    return { success: true, config }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Update GitHub config
ipcMain.handle('github:update-config', async (_event, updates: Record<string, any>) => {
  try {
    const config = loadGitConfig()
    const updated = { ...config, ...updates }
    saveGitConfig(updated)
    return { success: true, config: updated }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Authenticate with Personal Access Token
ipcMain.handle('github:auth-pat', async (_event, token: string) => {
  try {
    const result = await authenticateWithPAT(token)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Check authentication status
ipcMain.handle('github:is-authenticated', async () => {
  try {
    const authenticated = gitIsAuthenticated()
    const user = authenticated ? getCurrentUser() : null
    return { success: true, authenticated, user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Logout
ipcMain.handle('github:logout', async () => {
  try {
    gitLogout()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Initialize repo
ipcMain.handle('github:init', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = await initRepo(projectDir)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Check if repo is initialized
ipcMain.handle('github:is-initialized', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const initialized = await isRepoInitialized(projectDir)
    return { success: true, initialized }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Commit changes
ipcMain.handle('github:commit', async (
  _event,
  projectId: string,
  message: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = await commit(projectDir, message)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Commit after task
ipcMain.handle('github:commit-task', async (
  _event,
  projectId: string,
  taskIndex: number,
  taskDescription: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = await commitTask(projectDir, taskIndex, taskDescription)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Push to remote
ipcMain.handle('github:push', async (
  _event,
  projectId: string,
  remote?: string,
  branch?: string
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = await push(projectDir, remote, branch)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get commit history
ipcMain.handle('github:history', async (_event, projectId: string, limit?: number) => {
  try {
    const projectDir = getProjectDir(projectId)
    const history = await getHistory(projectDir, limit)
    return { success: true, history }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Check for uncommitted changes
ipcMain.handle('github:has-changes', async (_event, projectId: string) => {
  try {
    const projectDir = getProjectDir(projectId)
    const hasChanges = await hasUncommittedChanges(projectDir)
    return { success: true, hasChanges }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Create GitHub repo
ipcMain.handle('github:create-repo', async (
  _event,
  name: string,
  isPrivate?: boolean,
  description?: string
) => {
  try {
    const result = await createRepo(name, isPrivate, description)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Deploy to GitHub (full flow)
ipcMain.handle('github:deploy', async (
  _event,
  projectId: string,
  projectName: string,
  isPrivate?: boolean
) => {
  try {
    const projectDir = getProjectDir(projectId)
    const result = await deployToGitHub(projectDir, projectName, isPrivate)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get GitHub Pages status
ipcMain.handle('github:pages-status', async (
  _event,
  owner: string,
  repo: string
) => {
  try {
    const status = await getPagesStatus(owner, repo)
    return { success: true, ...status }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============================================
// ERROR CAPTURE IPC HANDLERS
// ============================================

// Analyze error output
ipcMain.handle('errors:analyze', async (_event, output: string) => {
  try {
    const analysis = analyzeErrors(output)
    return { success: true, analysis }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Check if output contains errors
ipcMain.handle('errors:check', async (_event, output: string) => {
  try {
    const hasError = hasErrors(output)
    return { success: true, hasError }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get quick fix command for error
ipcMain.handle('errors:quick-fix', async (_event, error: DetectedError) => {
  try {
    const fix = getQuickFix(error)
    return { success: true, fix }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Get AI prompt for error fixing
ipcMain.handle('errors:get-fix-prompt', async () => {
  return { success: true, prompt: AI_ERROR_FIX_PROMPT }
})

// =============================================================================
// v1.5.0: TESTING IPC HANDLERS
// =============================================================================

// Run Playwright test
ipcMain.handle('test:run', async (_event, testCode: string, baseUrl?: string) => {
  try {
    const result = await runTest(testCode, { baseUrl: baseUrl || 'http://localhost:5174' })
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Wait for dev server to be ready
ipcMain.handle('test:wait-for-server', async (_event, url?: string, timeout?: number) => {
  try {
    const ready = await waitForDevServer(url, timeout)
    return { success: true, ready }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
