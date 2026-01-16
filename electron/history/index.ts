/**
 * Jett History System
 * Snapshots and rollback for project files
 */

import path from 'path'
import fs from 'fs'

const HISTORY_DIR = '.jett/history'

// Files/directories to exclude from snapshots
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.jett',
  'dist',
  '.vite',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock'
]

function shouldInclude(relativePath: string): boolean {
  return !EXCLUDE_PATTERNS.some(pattern => 
    relativePath.includes(pattern) || relativePath.startsWith(pattern)
  )
}

// Get all files in a directory recursively
function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) return files
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)
    
    if (!shouldInclude(relativePath)) continue
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir))
    } else {
      files.push(relativePath)
    }
  }
  
  return files
}

// Create a snapshot of the current project state
export function createSnapshot(
  projectDir: string,
  taskIndex: number,
  taskDescription: string
): { success: boolean; snapshotId: string; error?: string } {
  try {
    const snapshotId = `task-${taskIndex}`
    const snapshotDir = path.join(projectDir, HISTORY_DIR, snapshotId)
    
    // Create snapshot directory
    if (fs.existsSync(snapshotDir)) {
      fs.rmSync(snapshotDir, { recursive: true })
    }
    fs.mkdirSync(snapshotDir, { recursive: true })
    
    // Get all project files
    const files = getAllFiles(projectDir)
    
    // Copy each file to snapshot
    for (const file of files) {
      const srcPath = path.join(projectDir, file)
      const destPath = path.join(snapshotDir, file)
      const destDir = path.dirname(destPath)
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      
      fs.copyFileSync(srcPath, destPath)
    }
    
    // Save metadata
    const metadata = {
      taskIndex,
      taskDescription,
      timestamp: new Date().toISOString(),
      fileCount: files.length,
      files
    }
    
    fs.writeFileSync(
      path.join(snapshotDir, '_metadata.json'),
      JSON.stringify(metadata, null, 2)
    )
    
    return { success: true, snapshotId }
  } catch (error: any) {
    return { success: false, snapshotId: '', error: error.message }
  }
}

// List available snapshots
export function listSnapshots(projectDir: string): {
  success: boolean
  snapshots: Array<{
    id: string
    taskIndex: number
    taskDescription: string
    timestamp: string
    fileCount: number
  }>
  error?: string
} {
  try {
    const historyDir = path.join(projectDir, HISTORY_DIR)
    
    if (!fs.existsSync(historyDir)) {
      return { success: true, snapshots: [] }
    }
    
    const entries = fs.readdirSync(historyDir, { withFileTypes: true })
    const snapshots: Array<{
      id: string
      taskIndex: number
      taskDescription: string
      timestamp: string
      fileCount: number
    }> = []
    
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('task-')) continue
      
      const metadataPath = path.join(historyDir, entry.name, '_metadata.json')
      if (!fs.existsSync(metadataPath)) continue
      
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
        snapshots.push({
          id: entry.name,
          taskIndex: metadata.taskIndex,
          taskDescription: metadata.taskDescription,
          timestamp: metadata.timestamp,
          fileCount: metadata.fileCount
        })
      } catch {
        // Skip invalid snapshots
      }
    }
    
    // Sort by task index
    snapshots.sort((a, b) => a.taskIndex - b.taskIndex)
    
    return { success: true, snapshots }
  } catch (error: any) {
    return { success: false, snapshots: [], error: error.message }
  }
}

// Restore project to a snapshot
export function restoreSnapshot(
  projectDir: string,
  snapshotId: string
): { success: boolean; filesRestored: number; error?: string } {
  try {
    const snapshotDir = path.join(projectDir, HISTORY_DIR, snapshotId)
    
    if (!fs.existsSync(snapshotDir)) {
      return { success: false, filesRestored: 0, error: 'Snapshot not found' }
    }
    
    // Read metadata
    const metadataPath = path.join(snapshotDir, '_metadata.json')
    if (!fs.existsSync(metadataPath)) {
      return { success: false, filesRestored: 0, error: 'Invalid snapshot (no metadata)' }
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    
    // Get current project files (to know what to delete)
    const currentFiles = getAllFiles(projectDir)
    
    // Delete current files that aren't in snapshot
    for (const file of currentFiles) {
      if (!metadata.files.includes(file)) {
        const fullPath = path.join(projectDir, file)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }
    }
    
    // Restore files from snapshot
    let filesRestored = 0
    for (const file of metadata.files) {
      const srcPath = path.join(snapshotDir, file)
      const destPath = path.join(projectDir, file)
      const destDir = path.dirname(destPath)
      
      if (!fs.existsSync(srcPath)) continue
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      
      fs.copyFileSync(srcPath, destPath)
      filesRestored++
    }
    
    // Clean up empty directories
    cleanEmptyDirs(projectDir)
    
    return { success: true, filesRestored }
  } catch (error: any) {
    return { success: false, filesRestored: 0, error: error.message }
  }
}

// Delete snapshots after a certain task (for when rolling back)
export function deleteSnapshotsAfter(
  projectDir: string,
  taskIndex: number
): { success: boolean; deleted: number; error?: string } {
  try {
    const historyDir = path.join(projectDir, HISTORY_DIR)
    
    if (!fs.existsSync(historyDir)) {
      return { success: true, deleted: 0 }
    }
    
    const entries = fs.readdirSync(historyDir, { withFileTypes: true })
    let deleted = 0
    
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('task-')) continue
      
      const match = entry.name.match(/^task-(\d+)$/)
      if (!match) continue
      
      const snapshotTaskIndex = parseInt(match[1], 10)
      if (snapshotTaskIndex > taskIndex) {
        const snapshotPath = path.join(historyDir, entry.name)
        fs.rmSync(snapshotPath, { recursive: true })
        deleted++
      }
    }
    
    return { success: true, deleted }
  } catch (error: any) {
    return { success: false, deleted: 0, error: error.message }
  }
}

// Get snapshot details
export function getSnapshotDetails(
  projectDir: string,
  snapshotId: string
): {
  success: boolean
  metadata?: {
    taskIndex: number
    taskDescription: string
    timestamp: string
    fileCount: number
    files: string[]
  }
  error?: string
} {
  try {
    const metadataPath = path.join(projectDir, HISTORY_DIR, snapshotId, '_metadata.json')
    
    if (!fs.existsSync(metadataPath)) {
      return { success: false, error: 'Snapshot not found' }
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    return { success: true, metadata }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Helper: Remove empty directories
function cleanEmptyDirs(dir: string) {
  if (!fs.existsSync(dir)) return
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (EXCLUDE_PATTERNS.includes(entry.name)) continue
    
    const fullPath = path.join(dir, entry.name)
    cleanEmptyDirs(fullPath)
    
    // Check if directory is now empty
    const remaining = fs.readdirSync(fullPath)
    if (remaining.length === 0) {
      fs.rmdirSync(fullPath)
    }
  }
}

// Create initial snapshot (task 0 - before any tasks)
export function createInitialSnapshot(projectDir: string): {
  success: boolean
  snapshotId: string
  error?: string
} {
  return createSnapshot(projectDir, 0, 'Initial project state')
}
