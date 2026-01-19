/**
 * History IPC Handlers
 * 
 * Main process handlers for History tab file operations
 */

import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// Get project directory path
function getProjectDir(projectId: string): string {
  const projectsDir = path.join(app.getPath('documents'), 'jett-projects')
  return path.join(projectsDir, projectId)
}

/**
 * Register all history-related IPC handlers
 */
export function registerHistoryHandlers() {
  // Capture all project files
  ipcMain.handle('history:capture-files', async (_event, projectPath: string) => {
    try {
      const projectDir = getProjectDir(projectPath)
      const files: Record<string, string> = {}
      
      if (!fs.existsSync(projectDir)) {
        return { success: false, error: 'Project directory not found' }
      }
      
      // Recursively read all files
      function readDir(dir: string, prefix = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          // Skip node_modules, .git, dist, and other build artifacts
          if (['node_modules', '.git', 'dist', '.next', '.cache', 'build'].includes(entry.name)) {
            continue
          }
          
          const fullPath = path.join(dir, entry.name)
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
          
          if (entry.isDirectory()) {
            readDir(fullPath, relativePath)
          } else {
            // Only include text files we care about
            const ext = path.extname(entry.name).toLowerCase()
            const textExtensions = [
              '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.scss',
              '.md', '.txt', '.yaml', '.yml', '.env', '.gitignore', '.config'
            ]
            
            // Include files with text extensions or specific names
            const includedNames = ['package.json', 'tsconfig.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js']
            
            if (textExtensions.includes(ext) || includedNames.includes(entry.name)) {
              try {
                const content = fs.readFileSync(fullPath, 'utf-8')
                files[relativePath] = content
              } catch (e) {
                // Skip files that can't be read as text
                console.warn(`Skipping file ${relativePath}: not readable as text`)
              }
            }
          }
        }
      }
      
      readDir(projectDir)
      
      return { success: true, files }
    } catch (error: any) {
      console.error('Failed to capture files:', error)
      return { success: false, error: error.message }
    }
  })
  
  // Write files to project directory
  ipcMain.handle('history:write-files', async (_event, projectPath: string, files: Record<string, string>) => {
    try {
      const projectDir = getProjectDir(projectPath)
      
      if (!fs.existsSync(projectDir)) {
        return { success: false, error: 'Project directory not found' }
      }
      
      // Write each file
      for (const [relativePath, content] of Object.entries(files)) {
        const fullPath = path.join(projectDir, relativePath)
        const dir = path.dirname(fullPath)
        
        // Ensure directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
        
        fs.writeFileSync(fullPath, content, 'utf-8')
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('Failed to write files:', error)
      return { success: false, error: error.message }
    }
  })
  
  // Capture screenshot (placeholder - can be implemented later)
  ipcMain.handle('history:capture-screenshot', async () => {
    // For now, return no screenshot
    // This could capture the preview webview in the future
    return { success: true, screenshot: undefined }
  })
}
