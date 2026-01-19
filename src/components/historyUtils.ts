/**
 * History/Version Management Utilities
 * 
 * Renderer process - communicates with main process via IPC
 */

export interface PublishedVersion {
  id: string
  published_at: string
  description: string
  url: string
  screenshot?: string
  files: Record<string, string>
}

/**
 * Generate a unique ID for versions
 */
function generateId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Capture screenshot of the preview via IPC
 */
async function captureScreenshot(): Promise<string | undefined> {
  // Skip screenshot for now - can be added later
  return undefined
}

/**
 * Capture current project files via IPC
 */
async function captureCurrentFiles(projectPath: string): Promise<Record<string, string>> {
  // @ts-ignore - jett is exposed via preload
  if (!window.jett?.history?.captureFiles) {
    throw new Error('IPC not available - cannot capture files')
  }
  
  // @ts-ignore
  const result = await window.jett.history.captureFiles(projectPath)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to capture files')
  }
  
  return result.files
}

/**
 * Write files to project directory via IPC
 */
async function writeFiles(projectPath: string, files: Record<string, string>): Promise<void> {
  // @ts-ignore - jett is exposed via preload
  if (!window.jett?.history?.writeFiles) {
    throw new Error('IPC not available - cannot write files')
  }
  
  // @ts-ignore
  const result = await window.jett.history.writeFiles(projectPath, files)
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to write files')
  }
}

/**
 * Deploy project to Vercel using their API
 */
async function deployToVercel(
  projectPath: string, 
  projectName: string,
  files: Record<string, string>
): Promise<string> {
  // Get Vercel token from settings
  const vercelToken = localStorage.getItem('vercel_token')
  
  if (!vercelToken) {
    throw new Error('Vercel token not configured. Add it in Settings → API tab.')
  }
  
  // Prepare files for Vercel API format
  const vercelFiles = Object.entries(files).map(([file, content]) => ({
    file,
    data: content
  }))
  
  // Create deployment
  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: vercelFiles,
      projectSettings: {
        framework: 'vite'
      }
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Vercel deployment failed')
  }
  
  const deployment = await response.json()
  const deploymentUrl = `https://${deployment.url}`
  
  // Poll until ready (max 60 seconds)
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const statusResponse = await fetch(
      `https://api.vercel.com/v13/deployments/${deployment.id}`,
      {
        headers: { 'Authorization': `Bearer ${vercelToken}` }
      }
    )
    
    const status = await statusResponse.json()
    
    if (status.readyState === 'READY') {
      return deploymentUrl
    }
    
    if (status.readyState === 'ERROR') {
      throw new Error('Deployment failed')
    }
  }
  
  return deploymentUrl
}

/**
 * Publish current project state as a new version
 */
export async function publishVersion(
  projectPath: string,
  projectName: string,
  description: string,
  existingVersions: PublishedVersion[]
): Promise<{ version: PublishedVersion; allVersions: PublishedVersion[]; url: string }> {
  // 1. Capture current files
  const files = await captureCurrentFiles(projectPath)
  
  // 2. Capture screenshot
  const screenshot = await captureScreenshot()
  
  // 3. Deploy to Vercel
  const url = await deployToVercel(projectPath, projectName, files)
  
  // 4. Create version object
  const version: PublishedVersion = {
    id: generateId(),
    published_at: new Date().toISOString(),
    description,
    url,
    screenshot,
    files
  }
  
  // 5. Add to versions array (newest first)
  const allVersions = [version, ...existingVersions]
  
  return { version, allVersions, url }
}

/**
 * Restore project to a previous version
 */
export async function restoreVersion(
  projectPath: string,
  projectName: string,
  versionId: string,
  existingVersions: PublishedVersion[]
): Promise<PublishedVersion[]> {
  const versionToRestore = existingVersions.find(v => v.id === versionId)
  if (!versionToRestore) {
    throw new Error(`Version not found: ${versionId}`)
  }
  
  // Capture current files for backup
  const currentFiles = await captureCurrentFiles(projectPath)
  const screenshot = await captureScreenshot()
  
  const backupVersion: PublishedVersion = {
    id: generateId(),
    published_at: new Date().toISOString(),
    description: 'Backup before restore',
    url: existingVersions[0]?.url || '',
    screenshot,
    files: currentFiles
  }
  
  // Write restored files to project
  await writeFiles(projectPath, versionToRestore.files)
  
  return [backupVersion, ...existingVersions]
}

/**
 * Format date for display
 */
export function formatVersionDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }
}

export function formatShortDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}
