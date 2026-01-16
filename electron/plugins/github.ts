/**
 * Jett GitHub Plugin
 * Version control and deployment integration
 * 
 * Features:
 * - OAuth authentication
 * - Auto-commit after tasks
 * - Push to GitHub
 * - GitHub Pages deployment
 */

import fs from 'fs'
import path from 'path'
import { app, shell, BrowserWindow } from 'electron'
import { spawn } from 'child_process'

// Types
export interface GitHubAuth {
  token: string
  username: string
  email: string
  expiresAt?: string
}

export interface GitHubRepo {
  owner: string
  name: string
  fullName: string  // owner/name
  url: string
  isPrivate: boolean
  defaultBranch: string
}

export interface CommitResult {
  success: boolean
  sha?: string
  message?: string
  error?: string
}

export interface GitConfig {
  auth: GitHubAuth | null
  defaultBranch: string
  autoCommit: boolean
  autoPush: boolean
  commitPrefix: string  // e.g., "🤖 Jett:"
}

// Default config
const DEFAULT_CONFIG: GitConfig = {
  auth: null,
  defaultBranch: 'main',
  autoCommit: true,
  autoPush: false,  // Require explicit push
  commitPrefix: '🤖 Jett:'
}

// Config path
const getConfigPath = () => {
  const configDir = path.join(app.getPath('userData'), 'jett')
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
  return path.join(configDir, 'github.json')
}

// Load config
export function loadGitConfig(): GitConfig {
  const configPath = getConfigPath()
  
  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      return { ...DEFAULT_CONFIG, ...data }
    } catch {
      // Corrupted file
    }
  }
  
  return DEFAULT_CONFIG
}

// Save config
export function saveGitConfig(config: GitConfig): void {
  const configPath = getConfigPath()
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

// Check if git is installed
export async function isGitInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('git', ['--version'])
    proc.on('close', (code) => resolve(code === 0))
    proc.on('error', () => resolve(false))
  })
}

// Run git command
async function runGit(
  cwd: string,
  args: string[]
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn('git', args, { cwd })
    let stdout = ''
    let stderr = ''
    
    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() })
      } else {
        resolve({ success: false, output: stdout.trim(), error: stderr.trim() })
      }
    })
    
    proc.on('error', (err) => {
      resolve({ success: false, output: '', error: err.message })
    })
  })
}

// Initialize git repo
export async function initRepo(projectDir: string): Promise<{
  success: boolean
  error?: string
}> {
  // Check if already initialized
  const gitDir = path.join(projectDir, '.git')
  if (fs.existsSync(gitDir)) {
    return { success: true }
  }
  
  const result = await runGit(projectDir, ['init'])
  if (!result.success) {
    return { success: false, error: result.error }
  }
  
  // Create .gitignore if doesn't exist
  const gitignorePath = path.join(projectDir, '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    const gitignore = `node_modules/
dist/
.vite/
.DS_Store
*.log
.env
.env.local
`
    fs.writeFileSync(gitignorePath, gitignore)
  }
  
  return { success: true }
}

// Check if repo is initialized
export async function isRepoInitialized(projectDir: string): Promise<boolean> {
  const gitDir = path.join(projectDir, '.git')
  return fs.existsSync(gitDir)
}

// Get current branch
export async function getCurrentBranch(projectDir: string): Promise<string | null> {
  const result = await runGit(projectDir, ['rev-parse', '--abbrev-ref', 'HEAD'])
  return result.success ? result.output : null
}

// Stage all changes
export async function stageAll(projectDir: string): Promise<{
  success: boolean
  error?: string
}> {
  const result = await runGit(projectDir, ['add', '-A'])
  return { success: result.success, error: result.error }
}

// Commit changes
export async function commit(
  projectDir: string,
  message: string
): Promise<CommitResult> {
  const config = loadGitConfig()
  const fullMessage = `${config.commitPrefix} ${message}`
  
  // Configure user if auth available
  if (config.auth) {
    await runGit(projectDir, ['config', 'user.name', config.auth.username])
    await runGit(projectDir, ['config', 'user.email', config.auth.email])
  }
  
  // Stage all
  const stageResult = await stageAll(projectDir)
  if (!stageResult.success) {
    return { success: false, error: stageResult.error }
  }
  
  // Check if there are changes to commit
  const statusResult = await runGit(projectDir, ['status', '--porcelain'])
  if (statusResult.success && !statusResult.output) {
    return { success: true, message: 'No changes to commit' }
  }
  
  // Commit
  const result = await runGit(projectDir, ['commit', '-m', fullMessage])
  if (!result.success) {
    return { success: false, error: result.error }
  }
  
  // Get commit SHA
  const shaResult = await runGit(projectDir, ['rev-parse', 'HEAD'])
  
  return {
    success: true,
    sha: shaResult.success ? shaResult.output.slice(0, 7) : undefined,
    message: fullMessage
  }
}

// Commit after task completion
export async function commitTask(
  projectDir: string,
  taskIndex: number,
  taskDescription: string
): Promise<CommitResult> {
  const message = `Task ${taskIndex + 1}: ${taskDescription}`
  return commit(projectDir, message)
}

// Add remote
export async function addRemote(
  projectDir: string,
  url: string,
  name: string = 'origin'
): Promise<{ success: boolean; error?: string }> {
  // Check if remote exists
  const checkResult = await runGit(projectDir, ['remote', 'get-url', name])
  if (checkResult.success) {
    // Remote exists, update it
    const result = await runGit(projectDir, ['remote', 'set-url', name, url])
    return { success: result.success, error: result.error }
  }
  
  // Add new remote
  const result = await runGit(projectDir, ['remote', 'add', name, url])
  return { success: result.success, error: result.error }
}

// Push to remote
export async function push(
  projectDir: string,
  remote: string = 'origin',
  branch?: string
): Promise<{ success: boolean; error?: string }> {
  const config = loadGitConfig()
  const targetBranch = branch || config.defaultBranch
  
  const result = await runGit(projectDir, ['push', '-u', remote, targetBranch])
  return { success: result.success, error: result.error }
}

// Get commit history
export async function getHistory(
  projectDir: string,
  limit: number = 10
): Promise<Array<{
  sha: string
  message: string
  date: string
  author: string
}>> {
  const format = '%H|%s|%ai|%an'
  const result = await runGit(projectDir, [
    'log',
    `--format=${format}`,
    `-n${limit}`
  ])
  
  if (!result.success || !result.output) {
    return []
  }
  
  return result.output.split('\n').filter(Boolean).map(line => {
    const [sha, message, date, author] = line.split('|')
    return { sha: sha.slice(0, 7), message, date, author }
  })
}

// Check for uncommitted changes
export async function hasUncommittedChanges(projectDir: string): Promise<boolean> {
  const result = await runGit(projectDir, ['status', '--porcelain'])
  return result.success && result.output.length > 0
}

// ============================================
// GitHub API Integration
// ============================================

const GITHUB_CLIENT_ID = 'Ov23liXXXXXXXXXXXXXX'  // Replace with real client ID
const GITHUB_REDIRECT_URI = 'jett://github/callback'

// Start OAuth flow
export async function startOAuth(mainWindow: BrowserWindow): Promise<{
  success: boolean
  error?: string
}> {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo,user:email`
  
  try {
    await shell.openExternal(authUrl)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Handle OAuth callback (called from protocol handler)
export async function handleOAuthCallback(
  code: string
): Promise<{ success: boolean; auth?: GitHubAuth; error?: string }> {
  // In production, exchange code for token via your backend
  // For now, we'll use a personal access token flow
  
  // This is a placeholder - real implementation would:
  // 1. Send code to backend
  // 2. Backend exchanges code for token with GitHub
  // 3. Backend returns token to app
  
  return {
    success: false,
    error: 'OAuth requires backend setup. Use Personal Access Token instead.'
  }
}

// Authenticate with Personal Access Token
export async function authenticateWithPAT(
  token: string
): Promise<{ success: boolean; auth?: GitHubAuth; error?: string }> {
  try {
    // Verify token by fetching user info
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: 'Invalid token' }
    }
    
    const user = await response.json()
    
    // Get primary email
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    let email = `${user.login}@users.noreply.github.com`
    if (emailResponse.ok) {
      const emails = await emailResponse.json()
      const primary = emails.find((e: any) => e.primary)
      if (primary) email = primary.email
    }
    
    const auth: GitHubAuth = {
      token,
      username: user.login,
      email
    }
    
    // Save to config
    const config = loadGitConfig()
    config.auth = auth
    saveGitConfig(config)
    
    return { success: true, auth }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Logout
export function logout(): void {
  const config = loadGitConfig()
  config.auth = null
  saveGitConfig(config)
}

// Check authentication status
export function isAuthenticated(): boolean {
  const config = loadGitConfig()
  return config.auth !== null
}

// Get current user
export function getCurrentUser(): GitHubAuth | null {
  const config = loadGitConfig()
  return config.auth
}

// Create GitHub repo
export async function createRepo(
  name: string,
  isPrivate: boolean = false,
  description?: string
): Promise<{ success: boolean; repo?: GitHubRepo; error?: string }> {
  const config = loadGitConfig()
  
  if (!config.auth) {
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.auth.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        private: isPrivate,
        description: description || `Created with Jett`,
        auto_init: false
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || 'Failed to create repo' }
    }
    
    const data = await response.json()
    
    const repo: GitHubRepo = {
      owner: data.owner.login,
      name: data.name,
      fullName: data.full_name,
      url: data.html_url,
      isPrivate: data.private,
      defaultBranch: data.default_branch || 'main'
    }
    
    return { success: true, repo }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Enable GitHub Pages
export async function enablePages(
  owner: string,
  repo: string,
  branch: string = 'main',
  path: string = '/'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const config = loadGitConfig()
  
  if (!config.auth) {
    return { success: false, error: 'Not authenticated' }
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.auth.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: {
          branch,
          path
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.message || 'Failed to enable Pages' }
    }
    
    const data = await response.json()
    
    return {
      success: true,
      url: data.html_url || `https://${owner}.github.io/${repo}/`
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get Pages status
export async function getPagesStatus(
  owner: string,
  repo: string
): Promise<{ enabled: boolean; url?: string; status?: string }> {
  const config = loadGitConfig()
  
  if (!config.auth) {
    return { enabled: false }
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      headers: {
        'Authorization': `Bearer ${config.auth.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!response.ok) {
      return { enabled: false }
    }
    
    const data = await response.json()
    
    return {
      enabled: true,
      url: data.html_url,
      status: data.status
    }
  } catch {
    return { enabled: false }
  }
}

// Full deploy flow: init → commit → create repo → push → enable pages
export async function deployToGitHub(
  projectDir: string,
  projectName: string,
  isPrivate: boolean = false
): Promise<{
  success: boolean
  repoUrl?: string
  pagesUrl?: string
  error?: string
}> {
  const config = loadGitConfig()
  
  if (!config.auth) {
    return { success: false, error: 'Not authenticated. Please add a GitHub token first.' }
  }
  
  // 1. Initialize repo if needed
  const initResult = await initRepo(projectDir)
  if (!initResult.success) {
    return { success: false, error: `Init failed: ${initResult.error}` }
  }
  
  // 2. Commit all changes
  const commitResult = await commit(projectDir, 'Initial commit')
  if (!commitResult.success && commitResult.error !== 'No changes to commit') {
    return { success: false, error: `Commit failed: ${commitResult.error}` }
  }
  
  // 3. Create GitHub repo
  const repoName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const createResult = await createRepo(repoName, isPrivate, `Built with Jett`)
  if (!createResult.success) {
    return { success: false, error: `Create repo failed: ${createResult.error}` }
  }
  
  const repo = createResult.repo!
  
  // 4. Add remote
  const remoteUrl = `https://${config.auth.token}@github.com/${repo.fullName}.git`
  const remoteResult = await addRemote(projectDir, remoteUrl)
  if (!remoteResult.success) {
    return { success: false, error: `Add remote failed: ${remoteResult.error}` }
  }
  
  // 5. Push
  const pushResult = await push(projectDir)
  if (!pushResult.success) {
    return { success: false, error: `Push failed: ${pushResult.error}` }
  }
  
  // 6. Enable GitHub Pages (optional, may fail for private repos on free plan)
  let pagesUrl: string | undefined
  if (!isPrivate) {
    const pagesResult = await enablePages(repo.owner, repo.name)
    if (pagesResult.success) {
      pagesUrl = pagesResult.url
    }
  }
  
  return {
    success: true,
    repoUrl: repo.url,
    pagesUrl
  }
}

// Export config functions
export { loadGitConfig as getConfig, saveGitConfig as updateConfig }
