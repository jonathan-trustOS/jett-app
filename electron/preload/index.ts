import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('jett', {
  // Open external URL in browser
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Storage
  getSettings: () => ipcRenderer.invoke('storage:get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('storage:save-settings', settings),
  getProjects: () => ipcRenderer.invoke('storage:get-projects'),
  createProject: (project: any) => ipcRenderer.invoke('storage:create-project', project),
  updateProject: (project: any) => ipcRenderer.invoke('storage:update-project', project),
  deleteProject: (projectId: string) => ipcRenderer.invoke('storage:delete-project', projectId),
  updatePrd: (projectId: string, prd: any) => ipcRenderer.invoke('storage:update-prd', projectId, prd),
  updateTasks: (projectId: string, tasks: any[]) => ipcRenderer.invoke('storage:update-tasks', projectId, tasks),
  updateProjectStatus: (projectId: string, status: string) => ipcRenderer.invoke('storage:update-project-status', projectId, status),
  setDeployUrl: (projectId: string, url: string) => ipcRenderer.invoke('storage:set-deploy-url', projectId, url),
  
  // File system
  writeFile: (projectId: string, filePath: string, content: string) => 
    ipcRenderer.invoke('fs:write-file', projectId, filePath, content),
  readFile: (projectId: string, filePath: string) => 
    ipcRenderer.invoke('fs:read-file', projectId, filePath),
  listFiles: (projectId: string) => 
    ipcRenderer.invoke('fs:list-files', projectId),
  
  // Dev server
  runNpmInstall: (projectId: string) => ipcRenderer.invoke('run-npm-install', projectId),
  startDevServer: (projectId: string) => ipcRenderer.invoke('start-dev-server', projectId),
  stopDevServer: () => ipcRenderer.invoke('stop-dev-server'),
  checkDevServer: (projectId: string) => ipcRenderer.invoke('check-dev-server', projectId),
  onTerminalOutput: (callback: (output: string) => void) => {
    ipcRenderer.on('terminal-output', (_event, output) => callback(output))
  },
  
  // Screenshot
  captureWebviewScreenshot: (webContentsId: number) => 
    ipcRenderer.invoke('capture-webview-screenshot', webContentsId),
  
  // Deploy
  deployToVercel: (projectId: string) => ipcRenderer.invoke('deploy-to-vercel', projectId),
  
  // AI
  claudeApi: (apiKey: string, messages: string, screenshot?: string, provider?: string, model?: string) =>
    ipcRenderer.invoke('claude-api', apiKey, messages, screenshot, provider, model),
  
  // Learning System
  learning: {
    // Get project context for prompt injection
    getContext: (projectId: string) => 
      ipcRenderer.invoke('learning:get-context', projectId),
    
    // Extract and save patterns after task completion
    extractPatterns: (
      projectId: string,
      taskDescription: string,
      generatedCode: string,
      files: { [path: string]: string }
    ) => ipcRenderer.invoke('learning:extract-patterns', projectId, taskDescription, generatedCode, files),
    
    // Record verification result
    recordVerification: (patternId: string, success: boolean) =>
      ipcRenderer.invoke('learning:record-verification', patternId, success),
    
    // Find similar patterns
    findPatterns: (keywords: string[], appType?: string, limit?: number) =>
      ipcRenderer.invoke('learning:find-patterns', keywords, appType, limit),
    
    // Get smart suggestions
    getSuggestions: (appType?: string, count?: number) =>
      ipcRenderer.invoke('learning:get-suggestions', appType, count),
    
    // Record suggestion outcome
    recordSuggestion: (suggestionId: string, succeeded: boolean) =>
      ipcRenderer.invoke('learning:record-suggestion', suggestionId, succeeded),
    
    // Refresh suggestions
    refreshSuggestions: (currentIds: string[], appType?: string, count?: number) =>
      ipcRenderer.invoke('learning:refresh-suggestions', currentIds, appType, count),
    
    // Get learning stats
    getStats: () => ipcRenderer.invoke('learning:get-stats')
  },

  // History System
  history: {
    // Create snapshot after task completion
    createSnapshot: (projectId: string, taskIndex: number, taskDescription: string) =>
      ipcRenderer.invoke('history:create-snapshot', projectId, taskIndex, taskDescription),
    
    // Create initial snapshot (before any tasks)
    createInitial: (projectId: string) =>
      ipcRenderer.invoke('history:create-initial', projectId),
    
    // List all snapshots
    listSnapshots: (projectId: string) =>
      ipcRenderer.invoke('history:list-snapshots', projectId),
    
    // Restore to a snapshot
    restore: (projectId: string, snapshotId: string) =>
      ipcRenderer.invoke('history:restore', projectId, snapshotId),
    
    // Delete snapshots after a task index
    deleteAfter: (projectId: string, taskIndex: number) =>
      ipcRenderer.invoke('history:delete-after', projectId, taskIndex),
    
    // Get snapshot details
    getDetails: (projectId: string, snapshotId: string) =>
      ipcRenderer.invoke('history:get-details', projectId, snapshotId)
  },

  // Validation System
  validation: {
    // Run all plugin validations
    runAll: () => ipcRenderer.invoke('validation:run-all'),
    
    // Run specific plugin validation
    runPlugin: (plugin: 'code-review' | 'memory' | 'github') =>
      ipcRenderer.invoke('validation:run-plugin', plugin),
    
    // Listen for progress updates
    onProgress: (callback: (message: string) => void) => {
      ipcRenderer.on('validation:progress', (_event, msg) => callback(msg))
    }
  },

  // Code Simplifier Plugin
  simplifier: {
    // Simplify all project code files
    simplifyProject: (projectId: string) =>
      ipcRenderer.invoke('simplifier:simplify-project', projectId),
    
    // Simplify a single file
    simplifyFile: (projectId: string, filePath: string) =>
      ipcRenderer.invoke('simplifier:simplify-file', projectId, filePath)
  },

  // Memory Plugin
  memory: {
    // Get global preferences
    getGlobal: () => ipcRenderer.invoke('memory:get-global'),
    
    // Update global preferences
    updateGlobal: (updates: Record<string, any>) =>
      ipcRenderer.invoke('memory:update-global', updates),
    
    // Get project memory (with preferences)
    getProject: (projectId: string) =>
      ipcRenderer.invoke('memory:get-project', projectId),
    
    // Update project memory
    updateProject: (projectId: string, updates: Record<string, any>) =>
      ipcRenderer.invoke('memory:update-project', projectId, updates),
    
    // Learn patterns from code
    learn: (projectId: string, code: string, success: boolean) =>
      ipcRenderer.invoke('memory:learn', projectId, code, success),
    
    // Register a component
    registerComponent: (projectId: string, name: string, filePath: string, purpose: string) =>
      ipcRenderer.invoke('memory:register-component', projectId, name, filePath, purpose),
    
    // Get context string for AI prompts
    getContext: (projectId: string) =>
      ipcRenderer.invoke('memory:get-context', projectId),
    
    // Clear all memory
    clearAll: () => ipcRenderer.invoke('memory:clear-all'),
    
    // Clear project memory
    clearProject: (projectId: string) =>
      ipcRenderer.invoke('memory:clear-project', projectId),
    
    // Get memory stats
    getStats: () => ipcRenderer.invoke('memory:get-stats')
  },

  // GitHub Plugin
  github: {
    // Check if git is installed
    checkGit: () => ipcRenderer.invoke('github:check-git'),
    
    // Get config
    getConfig: () => ipcRenderer.invoke('github:get-config'),
    
    // Update config
    updateConfig: (updates: Record<string, any>) =>
      ipcRenderer.invoke('github:update-config', updates),
    
    // Authenticate with Personal Access Token
    authWithPAT: (token: string) =>
      ipcRenderer.invoke('github:auth-pat', token),
    
    // Check if authenticated
    isAuthenticated: () => ipcRenderer.invoke('github:is-authenticated'),
    
    // Logout
    logout: () => ipcRenderer.invoke('github:logout'),
    
    // Initialize git repo
    init: (projectId: string) =>
      ipcRenderer.invoke('github:init', projectId),
    
    // Check if initialized
    isInitialized: (projectId: string) =>
      ipcRenderer.invoke('github:is-initialized', projectId),
    
    // Commit changes
    commit: (projectId: string, message: string) =>
      ipcRenderer.invoke('github:commit', projectId, message),
    
    // Commit after task
    commitTask: (projectId: string, taskIndex: number, taskDescription: string) =>
      ipcRenderer.invoke('github:commit-task', projectId, taskIndex, taskDescription),
    
    // Push to remote
    push: (projectId: string, remote?: string, branch?: string) =>
      ipcRenderer.invoke('github:push', projectId, remote, branch),
    
    // Get commit history
    getHistory: (projectId: string, limit?: number) =>
      ipcRenderer.invoke('github:history', projectId, limit),
    
    // Check for uncommitted changes
    hasChanges: (projectId: string) =>
      ipcRenderer.invoke('github:has-changes', projectId),
    
    // Create GitHub repo
    createRepo: (name: string, isPrivate?: boolean, description?: string) =>
      ipcRenderer.invoke('github:create-repo', name, isPrivate, description),
    
    // Deploy to GitHub (full flow)
    deploy: (projectId: string, projectName: string, isPrivate?: boolean) =>
      ipcRenderer.invoke('github:deploy', projectId, projectName, isPrivate),
    
    // Get Pages status
    getPagesStatus: (owner: string, repo: string) =>
      ipcRenderer.invoke('github:pages-status', owner, repo)
  },

  // Error Capture Plugin
  errors: {
    // Analyze error output
    analyze: (output: string) =>
      ipcRenderer.invoke('errors:analyze', output),
    
    // Check if output contains errors
    check: (output: string) =>
      ipcRenderer.invoke('errors:check', output),
    
    // Get quick fix command
    getQuickFix: (error: any) =>
      ipcRenderer.invoke('errors:quick-fix', error),
    
    // Get AI prompt for error fixing
    getFixPrompt: () =>
      ipcRenderer.invoke('errors:get-fix-prompt')
  }
})
