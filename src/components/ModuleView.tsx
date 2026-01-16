/**
 * ModuleView - Modular build interface
 * Shows features as independent modules that can be built/improved separately
 */

import { useState, useEffect, useRef } from 'react'
import CodePanel from './CodePanel'
import {
  IconCheck, IconX, IconBuild, IconDocument, IconAlert, IconRocket,
  IconRefresh, IconLightbulb, IconCode, IconClock, IconSearch, IconTrash,
  IconPlay, IconSparkles, IconCog
} from './Icons'

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
  files: string[]
}

interface Feature {
  id: string
  title: string
  description: string
}

interface Project {
  id: string
  name: string
  prd: {
    features: Feature[]
    overview: { name: string; description: string }
  }
  modules: Module[]
  priorityStack: string[]
}

interface ModuleViewProps {
  project: Project
  onProjectUpdate: (project: Project) => void
  onBuildModule: (moduleId: string) => void
  apiKey: string
  provider?: string
  model?: string
}

export default function ModuleView({ project, onProjectUpdate, onBuildModule, apiKey, provider = 'anthropic', model = 'claude-sonnet-4-20250514' }: ModuleViewProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [buildingModuleId, setBuildingModuleId] = useState<string | null>(null)
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null)
  const [buildLog, setBuildLog] = useState<string[]>([])
  const [showLogDrawer, setShowLogDrawer] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<'code' | 'preview'>('preview')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lastFileUpdate, setLastFileUpdate] = useState(Date.now())
  const [isDeploying, setIsDeploying] = useState(false)
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [isBuildingSuggestion, setIsBuildingSuggestion] = useState(false)
  
  // Webview ref for screenshot capture
  const webviewRef = useRef<any>(null)

  // Ensure modules and priorityStack exist
  const modules = project.modules || []
  const priorityStack = project.priorityStack || []
  const features = project.prd?.features || []

  // Auto-create modules when entering Build view with features but no modules
  useEffect(() => {
    if (modules.length === 0 && features.length > 0 && !isGenerating) {
      generateModulesFromFeatures()
    }
  }, []) // Only run on mount

  // Auto-select the next module that needs building
  useEffect(() => {
    if (modules.length > 0 && !selectedModuleId) {
      // Find first module that isn't complete (in priority order)
      const nextModule = priorityStack
        .map(id => modules.find(m => m.id === id))
        .find(m => m && m.status !== 'complete')
      
      if (nextModule) {
        setSelectedModuleId(nextModule.id)
      } else {
        // All complete, select first one
        setSelectedModuleId(priorityStack[0] || modules[0]?.id)
      }
    }
  }, [modules, priorityStack, selectedModuleId])

  const log = (message: string) => {
    setBuildLog(prev => [...prev, message])
    console.log(message)
  }

  // Generate tasks for a specific module
  const generateModuleTasks = async (module: Module): Promise<Task[]> => {
    const isCore = module.name === 'Core Setup'
    
    const prompt = isCore 
      ? `Generate 3-4 tasks to set up the core project structure for "${project.prd?.overview?.name || 'App'}":
- Set up Vite + React + TypeScript + Tailwind
- Create basic layout and navigation structure
- Set up routing if needed

Respond with tasks in this format:
---TASKS-START---
1. Task description here
2. Another task
3. Third task
---TASKS-END---`
      : `Generate 3-4 tasks to build the "${module.name}" feature:
Description: ${module.description}

Project context: ${project.prd?.overview?.name || 'App'} - ${project.prd?.overview?.description || ''}

The core setup is already done. Focus only on this specific feature.

Respond with tasks in this format:
---TASKS-START---
1. Task description here
2. Another task
3. Third task
---TASKS-END---`

    const result = await window.jett.claudeApi(
      apiKey,
      JSON.stringify([{ role: 'user', content: prompt }]),
      undefined,
      provider,
      model
    )

    if (result.success && result.text) {
      const taskMatch = result.text.match(/---TASKS-START---([\s\S]*?)---TASKS-END---/)
      if (taskMatch) {
        const taskLines = taskMatch[1].trim().split('\n').filter((line: string) => line.trim())
        return taskLines.map((line: string, idx: number) => ({
          id: `${module.id}-task-${idx}`,
          description: line.replace(/^\d+\.\s*/, '').trim(),
          status: 'pending' as const,
          attempts: 0
        }))
      }
    }

    // Default tasks if generation fails
    return isCore ? [
      { id: `${module.id}-task-0`, description: 'Set up project with Vite, React, and Tailwind CSS', status: 'pending' as const, attempts: 0 },
      { id: `${module.id}-task-1`, description: 'Create basic app layout and structure', status: 'pending' as const, attempts: 0 },
      { id: `${module.id}-task-2`, description: 'Add navigation components', status: 'pending' as const, attempts: 0 }
    ] : [
      { id: `${module.id}-task-0`, description: `Create ${module.name} component`, status: 'pending' as const, attempts: 0 },
      { id: `${module.id}-task-1`, description: `Add ${module.name} functionality and state`, status: 'pending' as const, attempts: 0 },
      { id: `${module.id}-task-2`, description: `Style and polish ${module.name}`, status: 'pending' as const, attempts: 0 }
    ]
  }

  // Execute a single task
  const executeTask = async (module: Module, taskIndex: number): Promise<boolean> => {
    const task = module.tasks[taskIndex]
    if (!task) return false

    log(`🔧 Executing: ${task.description}`)

    const prdContext = `Project: ${project.prd?.overview?.name || 'App'}
Module: ${module.name}
Description: ${module.description}
Features: ${project.prd?.features?.map((f: any) => f.title).join(', ') || 'None specified'}`

    const systemPrompt = `You are a code generator. You MUST output all files using this EXACT format:

---FILE-START path="src/Example.tsx"---
// file content here
---FILE-END---

CRITICAL: Always wrap file content between ---FILE-START path="filepath"--- and ---FILE-END--- tags.
Every response MUST include at least one file in this format.
Use React + TypeScript + Tailwind CSS.`

    const userPrompt = `Execute this task: ${task.description}

${prdContext}

Generate the necessary files. Remember to use the exact format:
---FILE-START path="src/components/ComponentName.tsx"---
code here
---FILE-END---`

    try {
      // Include system prompt in messages
      const messages = [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ]
      
      console.log('🔄 Calling API for task:', task.description)
      console.log('Provider:', provider, 'Model:', model)
      
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify(messages),
        undefined,
        provider,
        model
      )

      console.log('API result success:', result.success)
      if (!result.success) {
        console.log('API error:', result.error)
        log(`  ❌ API Error: ${result.error || 'Unknown error'}`)
        return false
      }

      if (result.success && result.text) {
        // Debug: log response length
        console.log(`API response length: ${result.text.length} chars`)
        console.log(`Response preview: ${result.text.substring(0, 200)}...`)
        
        // Try multiple regex patterns to catch different formats
        const fileRegex = /---FILE-START\s*path="([^"]+)"\s*---([\s\S]*?)---FILE-END---/g
        const altRegex = /```(?:tsx?|jsx?|typescript|javascript)?\s*\n?\/\/\s*([^\n]+\.tsx?)\n([\s\S]*?)```/g
        
        let match
        let filesWritten = 0
        const filesCreated: string[] = []

        // Try primary format
        while ((match = fileRegex.exec(result.text)) !== null) {
          const [, filePath, content] = match
          await window.jett.writeFile(project.id, filePath, content.trim())
          log(`  📄 Created: ${filePath}`)
          filesWritten++
          filesCreated.push(filePath)
        }

        // If no files found, try alternate format (code blocks with path comments)
        if (filesWritten === 0) {
          while ((match = altRegex.exec(result.text)) !== null) {
            const [, filePath, content] = match
            const cleanPath = filePath.startsWith('src/') ? filePath : `src/${filePath}`
            await window.jett.writeFile(project.id, cleanPath, content.trim())
            log(`  📄 Created: ${cleanPath}`)
            filesWritten++
            filesCreated.push(cleanPath)
          }
        }

        // Last resort: look for any code block and save as the task implies
        if (filesWritten === 0 && result.text.includes('```')) {
          const codeMatch = result.text.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/)
          if (codeMatch) {
            const guessedPath = `src/components/${module.name.replace(/\s+/g, '')}.tsx`
            await window.jett.writeFile(project.id, guessedPath, codeMatch[1].trim())
            log(`  📄 Created (guessed): ${guessedPath}`)
            filesWritten++
            filesCreated.push(guessedPath)
          }
        }

        if (filesWritten > 0) {
          // Update module files
          const updatedModule = {
            ...module,
            files: [...new Set([...module.files, ...filesCreated])]
          }
          updateModule(updatedModule)
          setLastFileUpdate(Date.now()) // Trigger CodePanel refresh
          
          // Verify task completion with screenshot
          log(`  🔍 Verifying task...`)
          
          // Wait for preview to update
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Capture screenshot from webview
          let screenshot: string | undefined
          if (webviewRef.current) {
            try {
              const webContentsId = webviewRef.current.getWebContentsId()
              const result = await window.jett.captureWebviewScreenshot(webContentsId)
              if (result.success) {
                screenshot = result.data
                log(`  📸 Screenshot captured`)
              }
            } catch (e) {
              log(`  ⚠️ Could not capture screenshot`)
            }
          }
          
          // Ask AI to verify
          const verifyResult = await window.jett.claudeApi(
            apiKey,
            JSON.stringify([{ 
              role: 'user', 
              content: `Verify this task is complete: "${task.description}"

Files created: ${filesCreated.join(', ')}

${screenshot ? 'I have attached a screenshot of the current state.' : 'No screenshot available.'}

Reply with just WORKING if the task appears complete, or BROKEN if something seems missing or broken.`
            }]),
            screenshot,
            provider,
            model
          )
          
          if (verifyResult.success && verifyResult.text) {
            const response = verifyResult.text.toUpperCase()
            if (response.includes('WORKING')) {
              log(`  ✅ WORKING`)
              
              // Create snapshot after successful task
              try {
                const snapshotResult = await window.jett.history.createSnapshot(
                  project.id,
                  module.tasks.indexOf(task) + 1,
                  task.description
                )
                if (snapshotResult.success) {
                  log(`  📸 Snapshot saved`)
                }
              } catch (e) {
                console.log('Snapshot failed:', e)
              }
              
              // Run code simplifier
              try {
                log(`  ✨ Simplifying code...`)
                const simplifyResult = await window.jett.simplifier.simplifyProject(project.id)
                if (simplifyResult.success && simplifyResult.filesChanged > 0) {
                  log(`  ✨ Simplified ${simplifyResult.filesChanged} file(s)`)
                }
              } catch (e) {
                console.log('Simplifier failed:', e)
              }
              
              // Learn patterns for memory
              try {
                const filesResult = await window.jett.listFiles(project.id)
                if (filesResult.success && filesResult.files) {
                  const srcFiles = filesResult.files.filter((f: string) => f.startsWith('src/') && f.endsWith('.tsx'))
                  let allCode = ''
                  for (const file of srcFiles.slice(0, 5)) {
                    const content = await window.jett.readFile(project.id, file)
                    if (content.success) allCode += content.content + '\n'
                  }
                  if (allCode) {
                    await window.jett.memory.learnPatterns(allCode)
                  }
                }
              } catch (e) {
                console.log('Learning failed:', e)
              }
              
              return true
            } else if (response.includes('BROKEN')) {
              log(`  ⚠️ BROKEN - verification failed`)
              return false
            }
          }
          
          // Default to success if files were written
          log(`  ✅ Files created successfully`)
          return true
        } else {
          log(`  ⚠️ No files extracted from response`)
          return false
        }
      }
      return false
    } catch (error: any) {
      log(`❌ Error: ${error.message}`)
      return false
    }
  }

  // Update a module in the project
  const updateModule = (updatedModule: Module) => {
    const updatedModules = modules.map(m => 
      m.id === updatedModule.id ? updatedModule : m
    )
    onProjectUpdate({
      ...project,
      modules: updatedModules
    })
  }

  // Build a module (generate tasks + execute them)
  const buildModule = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module || !apiKey) return

    setBuildingModuleId(moduleId)
    setBuildLog([])
    log(`🚀 Building module: ${module.name}`)

    // Update status to building
    let updatedModule: Module = { ...module, status: 'building' }
    updateModule(updatedModule)

    try {
      // Generate tasks if none exist
      if (updatedModule.tasks.length === 0) {
        log('🧠 Generating tasks...')
        const tasks = await generateModuleTasks(updatedModule)
        updatedModule = { ...updatedModule, tasks }
        updateModule(updatedModule)
        log(`✅ Generated ${tasks.length} tasks`)
      }

      // Execute tasks
      for (let i = 0; i < updatedModule.tasks.length; i++) {
        setCurrentTaskIndex(i)
        
        let success = false
        let attempts = 0
        const maxAttempts = 3
        
        while (!success && attempts < maxAttempts) {
          attempts++
          
          // Update task status to executing
          const tasksWithExecuting = [...updatedModule.tasks]
          tasksWithExecuting[i] = { ...tasksWithExecuting[i], status: 'executing', attempts }
          updatedModule = { ...updatedModule, tasks: tasksWithExecuting }
          updateModule(updatedModule)

          if (attempts > 1) {
            log(`  🔄 Retry attempt ${attempts}/${maxAttempts}...`)
          }
          
          success = await executeTask(updatedModule, i)
          
          if (!success && attempts < maxAttempts) {
            log(`  ⚠️ Task failed, auto-fixing...`)
          }
        }

        // Update task status based on final result
        const tasksWithResult = [...updatedModule.tasks]
        tasksWithResult[i] = { 
          ...tasksWithResult[i], 
          status: success ? 'working' : 'failed',
          attempts
        }
        updatedModule = { ...updatedModule, tasks: tasksWithResult }
        updateModule(updatedModule)

        if (!success) {
          log(`  ❌ Task failed after ${maxAttempts} attempts, continuing...`)
        }
        
        // Run npm install after first task of first module (Core Setup)
        const isFirstModule = priorityStack.indexOf(moduleId) === 0
        const isFirstTask = i === 0
        if (success && isFirstModule && isFirstTask) {
          log('\n📦 Installing dependencies...')
          let installResult = await window.jett.runNpmInstall(project.id)
          
          // Auto-fix npm errors (up to 2 attempts)
          let npmAttempts = 0
          while (!installResult.success && npmAttempts < 2) {
            npmAttempts++
            log(`❌ npm install failed: ${installResult.error || 'Unknown error'}`)
            
            if (installResult.errorAnalysis?.hasAutoFixable) {
              log(`🔧 Attempting auto-fix (${npmAttempts}/2)...`)
              
              // Try quick fix first
              const firstError = installResult.errorAnalysis.errors?.[0]
              if (firstError) {
                try {
                  const quickFixResult = await window.jett.errors.getQuickFix(firstError)
                  if (quickFixResult.success && quickFixResult.fix) {
                    log(`  💡 Quick fix: ${quickFixResult.fix}`)
                  }
                } catch (e) {
                  console.log('Quick fix not available')
                }
              }
              
              // Use AI to fix package.json or other issues
              const fixPrompt = installResult.errorAnalysis.fixPrompt
              if (fixPrompt) {
                const fixResult = await window.jett.claudeApi(
                  apiKey,
                  JSON.stringify([{ role: 'user', content: fixPrompt }]),
                  undefined,
                  provider,
                  model
                )
                
                if (fixResult.success && fixResult.text) {
                  const fileRegex = /---FILE-START\s*path="([^"]+)"\s*---([\s\S]*?)---FILE-END---/g
                  let match
                  while ((match = fileRegex.exec(fixResult.text)) !== null) {
                    const [, filePath, content] = match
                    await window.jett.writeFile(project.id, filePath, content.trim())
                    log(`  📄 Fixed: ${filePath}`)
                  }
                }
              }
              
              // Retry npm install
              log('  📦 Retrying npm install...')
              installResult = await window.jett.runNpmInstall(project.id)
            } else {
              break // No auto-fixable errors
            }
          }
          
          if (!installResult.success) {
            log(`❌ npm install failed after ${npmAttempts + 1} attempts`)
          } else {
            log('✅ Dependencies installed')
          }
          
          // Start dev server
          log('🚀 Starting dev server...')
          await startDevServer()
        }
      }

      // Check if all tasks succeeded
      const allWorking = updatedModule.tasks.every(t => t.status === 'working')
      
      // Generate suggestions for completed module
      let moduleSuggestions: Suggestion[] = []
      if (allWorking) {
        try {
          log('💡 Generating suggestions...')
          const suggestionsResult = await window.jett.learning.getSuggestions('any', 3)
          if (suggestionsResult.success && suggestionsResult.suggestions) {
            moduleSuggestions = suggestionsResult.suggestions.map((s: any, i: number) => ({
              id: `${moduleId}-suggestion-${i}`,
              rank: (i + 1) as 1 | 2 | 3,
              category: s.category || 'Polish',
              title: s.title || 'Improvement',
              description: s.description || '',
              severity: s.severity || 'medium'
            }))
            log(`✅ Generated ${moduleSuggestions.length} suggestions`)
          }
        } catch (e) {
          console.log('Could not generate suggestions:', e)
        }
      }
      
      const finalModule = {
        ...updatedModule,
        status: (allWorking ? 'complete' : 'needs-work') as 'draft' | 'building' | 'complete' | 'needs-work',
        version: updatedModule.version + 1,
        suggestions: moduleSuggestions
      }
      updateModule(finalModule)

      log(`✅ Module ${allWorking ? 'complete' : 'needs work'}: ${module.name} v${finalModule.version}`)

      // Auto-progress: start next module if this one completed
      if (allWorking) {
        const currentIndex = priorityStack.indexOf(moduleId)
        if (currentIndex < priorityStack.length - 1) {
          const nextModuleId = priorityStack[currentIndex + 1]
          // Use the current modules array to check next module status
          const currentModules = project.modules || []
          const nextModule = currentModules.find(m => m.id === nextModuleId)
          if (nextModule && nextModule.status === 'draft') {
            log(`⏭️ Auto-starting next module: ${nextModule.name}`)
            // Small delay before starting next module
            setTimeout(() => {
              buildModule(nextModuleId)
            }, 500)
            return // Don't clear building state yet
          }
        }
      }

    } catch (error: any) {
      log(`❌ Build failed: ${error.message}`)
      updatedModule = { ...updatedModule, status: 'needs-work' }
      updateModule(updatedModule)
    } finally {
      setBuildingModuleId(null)
      setCurrentTaskIndex(null)
    }
  }

  // Start dev server for preview
  const startDevServer = async () => {
    try {
      log('🚀 Starting dev server...')
      const serverResult = await window.jett.startDevServer(project.id)
      if (serverResult.success) {
        const url = `http://localhost:${serverResult.port}`
        setPreviewUrl(url)
        setIsServerRunning(true)
        log(`✅ Dev server running at ${url}`)
      } else {
        log(`❌ Failed to start dev server: ${serverResult.error}`)
        setIsServerRunning(false)
      }
    } catch (error: any) {
      log(`❌ Dev server error: ${error.message}`)
      setIsServerRunning(false)
    }
  }

  // Auto-start dev server when first module completes
  useEffect(() => {
    const hasCompleteModule = modules.some(m => m.status === 'complete')
    if (hasCompleteModule && !previewUrl) {
      startDevServer()
    }
  }, [modules])

  // Deploy to Vercel
  const handleDeploy = async () => {
    setIsDeploying(true)
    log('\n🚀 Deploying to Vercel...')
    
    try {
      const result = await window.jett.deployToVercel(project.id)
      if (result.success) {
        log(`✅ Deployed: ${result.url}`)
        await window.jett.setDeployUrl(project.id, result.url)
      } else {
        log(`❌ Deploy failed: ${result.error}`)
      }
    } catch (error: any) {
      log(`❌ Deploy error: ${error.message}`)
    } finally {
      setIsDeploying(false)
    }
  }

  // Rollback to after a specific task
  const handleRollback = async (moduleId: string, taskIndex: number) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return
    
    const snapshotId = `task-${taskIndex + 1}`
    log(`\n⏪ Rolling back ${module.name} to after Task ${taskIndex + 1}...`)
    
    // Check if snapshot exists
    const detailsResult = await window.jett.history.getDetails(project.id, snapshotId)
    if (!detailsResult.success) {
      log(`❌ No snapshot found for Task ${taskIndex + 1}`)
      log(`   Snapshots are only available for tasks completed in this session.`)
      return
    }
    
    // Restore files
    const restoreResult = await window.jett.history.restore(project.id, snapshotId)
    if (!restoreResult.success) {
      log(`❌ Rollback failed: ${restoreResult.error}`)
      return
    }
    log(`  📂 Restored ${restoreResult.filesRestored} files`)
    
    // Delete snapshots after this point
    const deleteResult = await window.jett.history.deleteAfter(project.id, taskIndex + 1)
    if (deleteResult.success && deleteResult.deleted > 0) {
      log(`  🗑️ Cleaned up ${deleteResult.deleted} newer snapshots`)
    }
    
    // Reset task statuses in this module
    const updatedTasks = module.tasks.map((task, idx) => {
      if (idx <= taskIndex) {
        return { ...task, status: 'working' as const }
      } else {
        return { ...task, status: 'pending' as const, attempts: 0 }
      }
    })
    
    const updatedModule = {
      ...module,
      tasks: updatedTasks,
      status: 'needs-work' as const
    }
    updateModule(updatedModule)
    
    // Trigger file panel refresh
    setLastFileUpdate(Date.now())
    log(`✅ Rolled back to after Task ${taskIndex + 1}`)
  }

  // Build a suggestion for a module
  const handleBuildSuggestion = async (moduleId: string, suggestionId: string) => {
    const module = modules.find(m => m.id === moduleId)
    if (!module) return
    
    const suggestion = module.suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return
    
    setIsBuildingSuggestion(true)
    log(`\n🔧 Building: ${suggestion.title}`)
    log(`   Category: ${suggestion.category}`)
    log(`   ${suggestion.description}`)
    
    try {
      // Get learning context for consistency
      let contextString = ''
      try {
        const learningContext = await window.jett.learning.getContext(project.id)
        contextString = learningContext.success ? learningContext.formatted : ''
      } catch (e) {
        console.log('Learning context not available')
      }
      
      // Get list of existing files for context
      const filesResult = await window.jett.listFiles(project.id)
      const existingFiles = filesResult.success ? filesResult.files.join(', ') : 'unknown'
      
      // Build the suggestion implementation prompt
      const suggestionPrompt = `Implement this improvement to an existing React + Tailwind application:

## Improvement Required
**Category:** ${suggestion.category}
**Title:** ${suggestion.title}
**Description:** ${suggestion.description}

## Existing Project Files
${existingFiles}

${contextString}

## Instructions
1. Read the existing code patterns above
2. Implement the "${suggestion.title}" improvement
3. ONLY modify files that need changes - don't rewrite everything
4. Maintain consistency with existing styles and patterns
5. Output ONLY the files that need to be created or modified

Output each file in this exact format:
---FILE-START path="src/path/to/file.tsx"---
// file contents here
---FILE-END---

Focus on minimal, targeted changes that implement the improvement without breaking existing functionality.`

      log(`  📡 Calling AI...`)
      
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: suggestionPrompt }]),
        undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        const fileRegex = /---FILE-START\s*path="([^"]+)"\s*---([\s\S]*?)---FILE-END---/g
        let match
        let filesWritten = 0
        
        while ((match = fileRegex.exec(result.text)) !== null) {
          const [, filePath, content] = match
          await window.jett.writeFile(project.id, filePath, content.trim())
          log(`  📄 Updated: ${filePath}`)
          filesWritten++
          setLastFileUpdate(Date.now())
        }

        if (filesWritten === 0) {
          log(`  ⚠️ AI didn't output any files`)
          setIsBuildingSuggestion(false)
          return
        }

        // Wait for hot reload
        log(`  ⏳ Waiting for hot reload...`)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verify the suggestion was implemented
        log(`  🔍 Verifying implementation...`)
        
        let screenshot: string | undefined
        if (webviewRef.current) {
          try {
            const webContentsId = webviewRef.current.getWebContentsId()
            const screenshotResult = await window.jett.captureWebviewScreenshot(webContentsId)
            if (screenshotResult.success) screenshot = screenshotResult.data
          } catch (e) {
            log('  ⚠️ Could not capture screenshot')
          }
        }

        const verifyResult = await window.jett.claudeApi(
          apiKey,
          JSON.stringify([{ 
            role: 'user', 
            content: `Verify this improvement was implemented: "${suggestion.title}" - ${suggestion.description}. 
            
Look at the screenshot and determine if the improvement is visible/working.
Reply WORKING if the improvement appears to be implemented, or BROKEN if it's not visible or there are errors.` 
          }]),
          screenshot,
          provider,
          model
        )

        const verifyResponse = verifyResult.success ? verifyResult.text.toUpperCase() : 'UNKNOWN'
        const succeeded = verifyResponse.includes('WORKING')
        
        if (succeeded) {
          log(`  ✅ WORKING - Improvement verified!`)
        } else {
          log(`  ⚠️ Could not verify - may need manual check`)
        }

        // Remove the built suggestion from the module
        const updatedSuggestions = module.suggestions.filter(s => s.id !== suggestionId)
        const updatedModule = {
          ...module,
          suggestions: updatedSuggestions,
          version: module.version + 1
        }
        updateModule(updatedModule)
        
        log(`✅ Suggestion built successfully`)
        setSelectedSuggestionId(null)

      } else {
        log(`  ❌ AI request failed`)
      }
    } catch (error: any) {
      log(`❌ Error building suggestion: ${error.message}`)
    } finally {
      setIsBuildingSuggestion(false)
    }
  }

  // Convert PRD features to modules if not already done
  const generateModulesFromFeatures = async () => {
    if (!apiKey) {
      alert('Please set your API key in Settings first')
      return
    }

    setIsGenerating(true)

    // Create modules from features
    const newModules: Module[] = (project.prd?.features || []).map((feature, idx) => ({
      id: `module-${Date.now()}-${idx}`,
      name: feature.title,
      description: feature.description,
      status: 'draft' as const,
      version: 0,
      tasks: [],
      suggestions: [],
      files: []
    }))

    // Add a "Core Setup" module at the beginning
    const coreModule: Module = {
      id: `module-${Date.now()}-core`,
      name: 'Core Setup',
      description: 'Project structure, routing, and shared components',
      status: 'draft',
      version: 0,
      tasks: [],
      suggestions: [],
      files: []
    }

    const allModules = [coreModule, ...newModules]
    const newPriorityStack = allModules.map(m => m.id)

    const updatedProject = {
      ...project,
      modules: allModules,
      priorityStack: newPriorityStack
    }

    onProjectUpdate(updatedProject)
    setIsGenerating(false)
  }

  const getStatusColor = (status: Module['status']) => {
    switch (status) {
      case 'complete': return 'var(--success)'
      case 'building': return 'var(--accent-primary)'
      case 'needs-work': return 'var(--warning)'
      default: return 'var(--text-tertiary)'
    }
  }

  const getStatusIcon = (status: Module['status']) => {
    switch (status) {
      case 'complete': return <IconCheck size={14} />
      case 'building': return <IconBuild size={14} />
      case 'needs-work': return <IconAlert size={14} />
      default: return <IconDocument size={14} />
    }
  }

  const moveInStack = (moduleId: string, direction: 'up' | 'down') => {
    const stack = [...priorityStack]
    const currentIndex = stack.indexOf(moduleId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= stack.length) return

    // Swap
    [stack[currentIndex], stack[newIndex]] = [stack[newIndex], stack[currentIndex]]

    onProjectUpdate({
      ...project,
      priorityStack: stack
    })
  }

  const selectedModule = modules.find(m => m.id === selectedModuleId)

  // If no modules yet, show conversion UI
  if (modules.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🧩</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {isGenerating ? 'Creating Modules...' : 'Modular Development'}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {isGenerating 
              ? 'Converting your features into buildable modules...'
              : features.length === 0 
                ? 'Add features in the PRD first, then come back here.'
                : 'Setting up your project modules...'}
          </p>
          
          {isGenerating && (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" style={{ color: 'var(--accent-primary)' }} viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span style={{ color: 'var(--text-secondary)' }}>
                {features.length} features → {features.length + 1} modules
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Get modules in priority order
  const orderedModules = priorityStack
    .map(id => modules.find(m => m.id === id))
    .filter(Boolean) as Module[]

  return (
    <div className="h-full flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left: Module List + Priority Stack */}
      <div 
        className="w-80 flex flex-col flex-shrink-0"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-primary)' }}
      >
        {/* Header */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Modules
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {orderedModules.filter(m => m.status === 'complete').length} / {orderedModules.length} complete
          </p>
        </div>

        {/* Module Cards */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {orderedModules.map((module, idx) => (
            <div
              key={module.id}
              onClick={() => setSelectedModuleId(module.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedModuleId === module.id ? 'ring-2 ring-indigo-500' : ''
              }`}
              style={{ 
                background: module.status === 'complete' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : selectedModuleId === module.id ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                border: `1px solid ${
                  module.status === 'complete' 
                    ? 'rgba(34, 197, 94, 0.3)' 
                    : selectedModuleId === module.id ? 'var(--accent-primary)' : 'var(--border-primary)'
                }`
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{getStatusIcon(module.status)}</span>
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {module.name}
                  </span>
                </div>
                {module.version > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    v{module.version}
                  </span>
                )}
              </div>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {module.description}
              </p>
              
              {/* Priority controls */}
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Priority #{idx + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveInStack(module.id, 'up') }}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveInStack(module.id, 'down') }}
                    disabled={idx === orderedModules.length - 1}
                    className="p-1 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ↓
                  </button>
                </div>
              </div>

              {/* Suggestions badge */}
              {module.suggestions.length > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                    <IconLightbulb size={12} /> {module.suggestions.length} suggestions
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Build Next Button */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
          {orderedModules.some(m => m.status === 'draft' || m.status === 'needs-work') && !buildingModuleId && (
            <button
              onClick={() => {
                const nextModule = orderedModules.find(m => m.status === 'draft' || m.status === 'needs-work')
                if (nextModule) buildModule(nextModule.id)
              }}
              disabled={!apiKey}
              className="w-full py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              <IconBuild size={14} /> Build Next Module
            </button>
          )}
          {buildingModuleId && (
            <div 
              className="w-full py-2.5 rounded-lg font-medium text-center flex items-center justify-center gap-2"
              style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}
            >
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Building...
            </div>
          )}
          {orderedModules.every(m => m.status === 'complete') && !buildingModuleId && (
            <div 
              className="w-full py-2.5 rounded-lg font-medium text-center"
              style={{ background: 'var(--success-light)', color: 'var(--success)' }}
            >
              <IconCheck size={14} /> All Modules Complete
            </div>
          )}
        </div>
      </div>

      {/* Right: Selected Module Details */}
      <div className="w-96 flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--border-primary)' }}>
        {selectedModule ? (
          <>
            {/* Module Header */}
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {selectedModule.name}
                    </h1>
                    <span 
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        background: `${getStatusColor(selectedModule.status)}20`,
                        color: getStatusColor(selectedModule.status)
                      }}
                    >
                      {selectedModule.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {selectedModule.description}
                  </p>
                </div>
                <button
                  onClick={() => buildModule(selectedModule.id)}
                  disabled={!apiKey || buildingModuleId === selectedModule.id}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-1"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  {buildingModuleId === selectedModule.id ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      ...
                    </>
                  ) : selectedModule.status === 'draft' ? (
                    <><IconRocket size={12} /> Build</>
                  ) : (
                    <><IconRefresh size={12} /> Rebuild</>
                  )}
                </button>
              </div>
            </div>

            {/* Module Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Tasks */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Tasks ({selectedModule.tasks.length})
                </h3>
                {selectedModule.tasks.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Tasks will be generated when you build this module.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedModule.tasks.map((task, idx) => (
                      <div 
                        key={task.id} 
                        className={`p-3 rounded-lg transition-all ${
                          buildingModuleId === selectedModule.id && currentTaskIndex === idx 
                            ? 'ring-2 ring-indigo-500' 
                            : ''
                        }`}
                        style={{ 
                          background: task.status === 'working' ? 'var(--success-light)' :
                                     task.status === 'failed' ? 'var(--error-light)' :
                                     task.status === 'executing' ? 'var(--accent-primary-light)' :
                                     'var(--bg-secondary)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span>
                              {task.status === 'working' ? <IconCheck size={12} /> : 
                               task.status === 'failed' ? <IconX size={12} /> :
                               task.status === 'executing' ? (
                                 <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                 </svg>
                               ) : '⬜'}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              {task.description}
                            </span>
                          </div>
                          {/* Rollback button for completed tasks */}
                          {task.status === 'working' && !buildingModuleId && (
                            <button
                              onClick={() => handleRollback(selectedModule.id, idx)}
                              className="text-xs px-2 py-1 rounded transition-all ml-2"
                              style={{ 
                                background: 'var(--bg-tertiary)', 
                                color: 'var(--text-secondary)' 
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover)'
                                e.currentTarget.style.color = 'var(--text-primary)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-tertiary)'
                                e.currentTarget.style.color = 'var(--text-secondary)'
                              }}
                              title="Roll back to after this task"
                            >
                              ↩
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Build Log - Collapsible Drawer */}
              {buildLog.length > 0 && (
                <div 
                  className="fixed bottom-0 left-80 right-0 z-50 transition-all duration-300"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-primary)',
                    transform: showLogDrawer ? 'translateY(0)' : 'translateY(calc(100% - 36px))'
                  }}
                >
                  <button
                    onClick={() => setShowLogDrawer(!showLogDrawer)}
                    className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span className="flex items-center gap-2">
                      <IconDocument size={14} /> Build Log ({buildLog.length} entries)
                      {buildingModuleId && <span className="animate-pulse">● Building...</span>}
                    </span>
                    <span>{showLogDrawer ? '▼' : '▲'}</span>
                  </button>
                  <div 
                    className="px-4 pb-4 font-mono text-xs max-h-48 overflow-auto"
                  >
                    {buildLog.map((line, idx) => (
                      <div key={idx} style={{ color: 'var(--text-secondary)' }}>{line}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {selectedModule.suggestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Suggestions ({selectedModule.suggestions.length})
                    </h3>
                    {selectedSuggestionId && (
                      <button
                        onClick={() => handleBuildSuggestion(selectedModule.id, selectedSuggestionId)}
                        disabled={isBuildingSuggestion}
                        className="px-3 py-1 rounded text-xs font-medium transition-all disabled:opacity-50"
                        style={{ background: 'var(--accent-primary)', color: 'white' }}
                      >
                        {isBuildingSuggestion ? <><IconClock size={12} /> Building...</> : <><IconCog size={12} /> Build Selected</>}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedModule.suggestions.map(suggestion => (
                      <div 
                        key={suggestion.id}
                        onClick={() => setSelectedSuggestionId(
                          selectedSuggestionId === suggestion.id ? null : suggestion.id
                        )}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedSuggestionId === suggestion.id ? 'ring-2 ring-indigo-500' : ''
                        }`}
                        style={{ 
                          background: selectedSuggestionId === suggestion.id 
                            ? 'var(--accent-primary-light)' 
                            : 'var(--bg-secondary)', 
                          border: '1px solid var(--border-primary)' 
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {suggestion.title}
                            </span>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {suggestion.description}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded ml-2" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {suggestion.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {selectedModule.files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Files ({selectedModule.files.length})
                  </h3>
                  <div className="space-y-1">
                    {selectedModule.files.map((file, idx) => (
                      <div key={idx} className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        📄 {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-2 flex justify-center opacity-50"><IconDocument size={40} /></div>
              <p style={{ color: 'var(--text-tertiary)' }}>Select a module to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Code/Preview Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between px-4 py-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-4">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <button
                onClick={() => setRightPanelTab('preview')}
                className="px-3 py-1.5 text-xs font-medium rounded transition-all"
                style={{ 
                  background: rightPanelTab === 'preview' ? 'var(--bg-primary)' : 'transparent',
                  color: rightPanelTab === 'preview' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                🖥️ Preview
              </button>
              <button
                onClick={() => setRightPanelTab('code')}
                className="px-3 py-1.5 text-xs font-medium rounded transition-all"
                style={{ 
                  background: rightPanelTab === 'code' ? 'var(--bg-primary)' : 'transparent',
                  color: rightPanelTab === 'code' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <IconCode size={14} /> Code
              </button>
            </div>
            {previewUrl && rightPanelTab === 'preview' && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span className={`w-2 h-2 rounded-full ${isServerRunning ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                <span className="truncate max-w-[200px]">{previewUrl}</span>
                <button 
                  onClick={startDevServer}
                  className="hover:text-[var(--text-primary)]"
                  title="Restart server"
                >
                  <IconRefresh size={14} />
                </button>
              </div>
            )}
          </div>
          
          {/* Deploy button */}
          {orderedModules.every(m => m.status === 'complete') && (
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1"
              style={{ background: 'var(--success)', color: 'white' }}
            >
              {isDeploying ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Deploying...
                </>
              ) : (
                <><IconRocket size={14} /> Deploy</>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {rightPanelTab === 'preview' ? (
            previewUrl ? (
              <webview
                key={previewUrl}
                ref={webviewRef}
                src={previewUrl}
                className="w-full h-full"
                // @ts-ignore
                allowpopups="true"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mb-2 flex justify-center opacity-60"><IconRocket size={40} /></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Build a module to start preview</p>
                  <button
                    onClick={startDevServer}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    Start Dev Server
                  </button>
                </div>
              </div>
            )
          ) : (
            <CodePanel 
              projectId={project.id}
              lastUpdate={lastFileUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}
