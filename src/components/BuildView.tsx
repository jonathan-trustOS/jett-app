import { useState, useEffect, useRef } from 'react'
import CodePanel from './CodePanel'
import BuildErrorModal from './BuildErrorModal'
import { IconCheck, IconX, IconAlert, IconRefresh, IconCog, IconClock } from './Icons'

interface Task {
  id: string
  description: string
  status: 'pending' | 'executing' | 'verifying' | 'working' | 'failed'
  attempts: number
}

interface DetectedError {
  category: 'npm' | 'typescript' | 'vite' | 'runtime' | 'unknown'
  type: string
  message: string
  file?: string
  line?: number
  column?: number
  suggestion?: string
  autoFixable: boolean
  rawOutput: string
}

interface ErrorAnalysis {
  errors: DetectedError[]
  summary: string
  hasAutoFixable: boolean
  fixPrompt?: string
}

interface Suggestion {
  id: string
  rank: 1 | 2 | 3
  category: string
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface VersionEntry {
  version: number
  deployedAt: string
  url: string
}

interface Project {
  id: string
  name: string
  status: 'draft' | 'building' | 'complete'
  mode: 'dev' | 'test' | 'prod'
  prd: any
  tasks: Task[]
  deployUrl: string | null
  prodUrl: string | null
  prodVersion: number
  versionHistory: VersionEntry[]
  suggestions: Suggestion[]
}

interface Props {
  project: Project
  apiKey: string
  provider: string
  model: string
  onProjectUpdate: (project: Project) => void
  onBack: () => void
}

export default function BuildView({ project, apiKey, provider, model, onProjectUpdate, onBack }: Props) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isServerRunning, setIsServerRunning] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastFileUpdate, setLastFileUpdate] = useState(Date.now())
  const [centerTab, setCenterTab] = useState<'preview' | 'code'>('preview')
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [isBuildingSuggestion, setIsBuildingSuggestion] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [currentErrorAnalysis, setCurrentErrorAnalysis] = useState<ErrorAnalysis | null>(null)
  const [isAutoFixing, setIsAutoFixing] = useState(false)
  const [pendingRetryAction, setPendingRetryAction] = useState<(() => void) | null>(null)
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null)
  const [editingTaskText, setEditingTaskText] = useState('')
  const [shouldStopExecution, setShouldStopExecution] = useState(false)
  const webviewRef = useRef<any>(null)
  const tasksRef = useRef<Task[]>(tasks)
  const terminalRef = useRef<HTMLDivElement>(null)
  const stopExecutionRef = useRef(false)

  useEffect(() => { tasksRef.current = tasks }, [tasks])

  const isComplete = tasks.length > 0 && tasks.every(t => t.status === 'working')

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalLogs])

  useEffect(() => {
    window.jett.onTerminalOutput((output: string) => {
      setTerminalLogs(prev => [...prev, output])
    })
  }, [])

  useEffect(() => {
    if (tasks.length === 0 && project.prd) {
      generateTasks()
    }
  }, [])

  const log = (message: string) => {
    setTerminalLogs(prev => [...prev, message])
  }

  // Error modal handlers
  const handleErrorAutoFix = async () => {
    if (!currentErrorAnalysis?.fixPrompt) return
    
    setIsAutoFixing(true)
    log('🔧 Attempting AI auto-fix...')
    
    try {
      const fixResult = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: currentErrorAnalysis.fixPrompt }]),
        undefined,
        provider,
        model
      )
      
      if (fixResult.success && fixResult.text) {
        const fileRegex = /---FILE-START\s*path="([^"]+)"\s*---([\s\S]*?)---FILE-END---/g
        let match
        let filesFixed = 0
        while ((match = fileRegex.exec(fixResult.text)) !== null) {
          const [, filePath, content] = match
          await window.jett.writeFile(project.id, filePath, content.trim())
          log(`  📄 Fixed: ${filePath}`)
          filesFixed++
        }
        
        if (filesFixed > 0) {
          log(`✅ Fixed ${filesFixed} file(s)`)
          setShowErrorModal(false)
          setCurrentErrorAnalysis(null)
          
          // Retry the pending action
          if (pendingRetryAction) {
            log('🔄 Retrying...')
            pendingRetryAction()
          }
        } else {
          log('⚠️ No fixes generated')
        }
      } else {
        log(`❌ Auto-fix failed: ${fixResult.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      log(`❌ Auto-fix error: ${error.message}`)
    } finally {
      setIsAutoFixing(false)
    }
  }

  const handleErrorRetry = () => {
    setShowErrorModal(false)
    setCurrentErrorAnalysis(null)
    if (pendingRetryAction) {
      pendingRetryAction()
    }
  }

  const handleErrorSkip = async () => {
    setShowErrorModal(false)
    setCurrentErrorAnalysis(null)
    
    // Mark current task as working (skipped) and move to next
    if (currentTaskIndex !== null && currentTaskIndex < tasks.length) {
      const updatedTasks = [...tasks]
      updatedTasks[currentTaskIndex] = { ...updatedTasks[currentTaskIndex], status: 'working' }
      setTasks(updatedTasks)
      tasksRef.current = updatedTasks
      await window.jett.updateTasks(project.id, updatedTasks)
      log(`⏭️ Skipped task: ${tasks[currentTaskIndex].description}`)
      
      // Continue to next task
      const nextIndex = currentTaskIndex + 1
      if (nextIndex < tasks.length) {
        executeTask(nextIndex)
      } else {
        setIsExecuting(false)
        log('✅ Build complete (with skipped tasks)')
      }
    }
  }

  const handleViewTerminal = () => {
    setShowErrorModal(false)
    // Terminal is always visible, just close the modal
  }

  // Task editing handlers
  const startEditingTask = (index: number) => {
    setEditingTaskIndex(index)
    setEditingTaskText(tasks[index].description)
  }

  const cancelEditingTask = () => {
    setEditingTaskIndex(null)
    setEditingTaskText('')
  }

  const saveEditedTask = async () => {
    if (editingTaskIndex === null) return
    
    const updatedTasks = [...tasks]
    updatedTasks[editingTaskIndex] = {
      ...updatedTasks[editingTaskIndex],
      description: editingTaskText.trim()
    }
    
    setTasks(updatedTasks)
    await window.jett.updateTasks(project.id, updatedTasks)
    
    const updatedProject = { ...project, tasks: updatedTasks }
    onProjectUpdate(updatedProject)
    await window.jett.updateProject(updatedProject)
    
    log(`✏️ Updated task ${editingTaskIndex + 1}: "${editingTaskText.trim()}"`)
    
    setEditingTaskIndex(null)
    setEditingTaskText('')
  }

  // Stop execution handler
  const stopExecution = () => {
    stopExecutionRef.current = true
    setShouldStopExecution(true)
    log('⏹️ Stopping execution...')
  }

  const generateTasks = async () => {
    if (!apiKey) {
      log('❌ No API key. Set your API key in settings.')
      return
    }

    setIsGenerating(true)
    log('🧠 Generating tasks from PRD...')

    try {
      const hasMultipleScreens = project.prd.screens && project.prd.screens.length > 1
      const platform = project.prd.overview.platform || 'web'
      
      const prdSummary = `
Project: ${project.prd.overview.name}
Description: ${project.prd.overview.description}
Core Goal: ${project.prd.overview.coreGoal}
Platform: ${platform}

Features:
${project.prd.features.map((f: any) => `- ${f.title}: ${f.description}`).join('\n')}

Screens:
${project.prd.screens.map((s: any) => `- ${s.name}: ${s.description}`).join('\n')}

Tech Stack: ${project.prd.techStack.frontend}, ${project.prd.techStack.backend}, ${project.prd.techStack.hosting}

Design Notes: ${project.prd.designNotes || 'None'}

${hasMultipleScreens ? `IMPORTANT: This app has ${project.prd.screens.length} screens. Use React Router for navigation between screens. Create separate page components for each screen.` : ''}
${platform === 'mobile' ? 'IMPORTANT: Design for mobile-first with touch-friendly UI, larger tap targets, and responsive layouts.' : ''}
${platform === 'both' ? 'IMPORTANT: Design responsive layouts that work on both mobile and desktop.' : ''}
`
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: `Generate 5 tasks to build this app:\n\n${prdSummary}` }]),
        undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        const taskMatch = result.text.match(/---TASKS-START---([\s\S]*?)---TASKS-END---/)
        if (taskMatch) {
          const taskLines = taskMatch[1].trim().split('\n').filter((line: string) => line.trim())
          const newTasks: Task[] = taskLines.map((line: string, idx: number) => ({
            id: `task-${idx}`,
            description: line.replace(/^\d+\.\s*/, '').trim(),
            status: 'pending' as const,
            attempts: 0
          }))
          setTasks(newTasks)
          await window.jett.updateTasks(project.id, newTasks)
          log(`✅ Generated ${newTasks.length} tasks`)
        } else {
          // Default tasks - include router setup if multiple screens
          const defaultTasks: Task[] = hasMultipleScreens ? [
            { id: 'task-0', description: 'Set up project with Vite, React, Tailwind CSS, and React Router', status: 'pending', attempts: 0 },
            { id: 'task-1', description: `Create page components for each screen: ${project.prd.screens.map((s: any) => s.name).join(', ')}`, status: 'pending', attempts: 0 },
            { id: 'task-2', description: 'Set up routing with navigation between pages', status: 'pending', attempts: 0 },
            { id: 'task-3', description: 'Add state management and interactivity to each page', status: 'pending', attempts: 0 },
            { id: 'task-4', description: 'Style all pages with Tailwind CSS and add final polish', status: 'pending', attempts: 0 }
          ] : [
            { id: 'task-0', description: 'Set up project with Vite, React, and Tailwind CSS', status: 'pending', attempts: 0 },
            { id: 'task-1', description: `Create main component for ${project.prd.overview.name}`, status: 'pending', attempts: 0 },
            { id: 'task-2', description: 'Add state management and interactivity', status: 'pending', attempts: 0 },
            { id: 'task-3', description: 'Style the interface with Tailwind CSS', status: 'pending', attempts: 0 },
            { id: 'task-4', description: 'Final polish and user experience improvements', status: 'pending', attempts: 0 }
          ]
          setTasks(defaultTasks)
          await window.jett.updateTasks(project.id, defaultTasks)
          log('✅ Generated 5 default tasks')
        }
      } else {
        log(`❌ Error: ${result.error}`)
      }
    } catch (error: any) {
      log(`❌ Error: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const executeTask = async (taskIndex: number) => {
    // Check if execution was stopped
    if (stopExecutionRef.current) {
      stopExecutionRef.current = false
      setShouldStopExecution(false)
      setIsExecuting(false)
      log('⏹️ Execution stopped by user')
      return
    }

    const currentTasks = tasksRef.current
    const task = currentTasks[taskIndex]
    if (!task) return

    setIsExecuting(true)
    setCurrentTaskIndex(taskIndex)
    log(`\n🔧 Executing: ${task.description}`)

    const updatedTasks = [...currentTasks]
    updatedTasks[taskIndex] = { ...task, status: 'executing' }
    setTasks(updatedTasks)

    try {
      // Get learning context (patterns from previous tasks)
      const learningContext = await window.jett.learning.getContext(project.id)
      const contextString = learningContext.success ? learningContext.formatted : ''
      
      const prdContext = `Project: ${project.prd.overview.name}\nFeatures: ${project.prd.features.map((f: any) => f.title).join(', ')}`
      
      // Build enhanced prompt with learning context
      const hasMultipleScreens = project.prd.screens && project.prd.screens.length > 1
      const platform = project.prd.overview.platform || 'web'
      const screensContext = project.prd.screens?.map((s: any) => `- ${s.name}: ${s.description}`).join('\n') || 'None'
      
      const enhancedPrompt = `Execute this task: ${task.description}

${contextString}

PRD Context:
${prdContext}
Platform: ${platform}
Screens:
${screensContext}

Instructions:
- Follow established project patterns
- Maintain consistency with existing code
${hasMultipleScreens ? `- Use React Router for navigation (react-router-dom)
- Create separate page components in src/pages/ folder
- Include a navigation component for moving between pages
- Use <Link> components for navigation, not <a> tags` : ''}
${platform === 'mobile' ? '- Design mobile-first with touch-friendly UI (min 44px tap targets)' : ''}
${platform === 'both' ? '- Use responsive Tailwind classes (sm:, md:, lg:)' : ''}`
      
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: enhancedPrompt }]),
        undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        const fileRegex = /---FILE-START\s*path="([^"]+)"\s*---([\s\S]*?)---FILE-END---/g
        let match
        let filesWritten = 0
        const filesCreated: { [path: string]: string } = {}
        let allCode = ''
        
        while ((match = fileRegex.exec(result.text)) !== null) {
          const [, filePath, content] = match
          await window.jett.writeFile(project.id, filePath, content.trim())
          log(`  📄 Created: ${filePath}`)
          filesWritten++
          filesCreated[filePath] = content.trim()
          allCode += content.trim() + '\n'
          setLastFileUpdate(Date.now()) // Trigger CodePanel refresh
        }
        
        // Extract and save patterns for learning
        if (filesWritten > 0) {
          await window.jett.learning.extractPatterns(
            project.id,
            task.description,
            allCode,
            filesCreated
          )
          log('  🧠 Learned patterns')
        }

        if (taskIndex === 0 && filesWritten > 0) {
          log('\n📦 Installing dependencies...')
          let installResult = await window.jett.runNpmInstall(project.id)
          
          // Auto-fix npm errors (up to 2 attempts)
          let npmAttempts = 0
          while (!installResult.success && npmAttempts < 2) {
            npmAttempts++
            log(`❌ npm install failed: ${installResult.error || 'Unknown error'}`)
            
            if (installResult.errorAnalysis?.hasAutoFixable) {
              log(`🔧 Attempting auto-fix (${npmAttempts}/2)...`)
              
              // Try quick fix first (e.g., npm install missing-package)
              const firstError = installResult.errorAnalysis.errors[0]
              if (firstError) {
                const quickFixResult = await window.jett.errors.getQuickFix(firstError)
                if (quickFixResult.success && quickFixResult.fix) {
                  log(`  💡 Quick fix: ${quickFixResult.fix}`)
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
            log('💡 Click "View Error" for details')
            
            // Show error modal
            if (installResult.errorAnalysis) {
              setCurrentErrorAnalysis(installResult.errorAnalysis)
              setPendingRetryAction(() => () => executeTask(taskIndex))
              setShowErrorModal(true)
            }
          } else {
            log('✅ Dependencies installed')
          }
          
          log('🚀 Starting dev server...')
          const serverResult = await window.jett.startDevServer(project.id)
          if (serverResult.success && serverResult.port) {
            setPreviewUrl(`http://localhost:${serverResult.port}`)
            setIsServerRunning(true)
            log(`✅ Server running at localhost:${serverResult.port}`)
          } else {
            log(`⚠️ Server didn't start: ${serverResult.error || 'Could not detect port'}`)
            log('💡 Click "Restart Server" after build completes')
          }
        }

        await new Promise(r => setTimeout(r, taskIndex === 0 ? 5000 : 2000))

        const latestTasks = [...tasksRef.current]
        latestTasks[taskIndex] = { ...latestTasks[taskIndex], status: 'verifying' }
        setTasks(latestTasks)
        await verifyTask(taskIndex)
      } else {
        log(`❌ Error: ${result.error}`)
        const latestTasks = [...tasksRef.current]
        latestTasks[taskIndex] = { ...latestTasks[taskIndex], status: 'failed' }
        setTasks(latestTasks)
      }
    } catch (error: any) {
      log(`❌ Error: ${error.message}`)
      const latestTasks = [...tasksRef.current]
      latestTasks[taskIndex] = { ...latestTasks[taskIndex], status: 'failed' }
      setTasks(latestTasks)
    }

    setIsExecuting(false)
  }

  const verifyTask = async (taskIndex: number) => {
    const currentTasks = tasksRef.current
    const task = currentTasks[taskIndex]
    log(`\n🔍 Verifying: ${task.description}`)

    let screenshot = null
    if (webviewRef.current) {
      try {
        const webContentsId = webviewRef.current.getWebContentsId()
        const result = await window.jett.captureWebviewScreenshot(webContentsId)
        if (result.success) screenshot = result.data
      } catch (e) {
        log('  ⚠️ Could not capture screenshot')
      }
    }

    try {
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: `Verify this task is complete: "${task.description}". Reply WORKING or BROKEN.` }]),
        screenshot || undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        const response = result.text.toUpperCase()
        const updatedTasks = [...tasksRef.current]

        if (response.includes('WORKING')) {
          log(`  ✅ WORKING`)
          updatedTasks[taskIndex] = { ...task, status: 'working' }
          setTasks(updatedTasks)
          await window.jett.updateTasks(project.id, updatedTasks)

          // Create snapshot after successful task
          const snapshotResult = await window.jett.history.createSnapshot(
            project.id,
            taskIndex + 1, // task-1 for first task, etc.
            task.description
          )
          if (snapshotResult.success) {
            log(`  📸 Snapshot saved`)
          }

          // Run code simplifier on project files
          log(`  ✨ Simplifying code...`)
          const simplifyResult = await window.jett.simplifier.simplifyProject(project.id)
          if (simplifyResult.success && simplifyResult.filesChanged > 0) {
            log(`  ✨ Simplified ${simplifyResult.filesChanged} file(s) (${simplifyResult.totalChanges} changes)`)
          }

          // Learn patterns for memory
          const filesResult = await window.jett.listFiles(project.id)
          if (filesResult.success && filesResult.files) {
            // Read code from src files for learning
            const srcFiles = filesResult.files.filter((f: string) => f.startsWith('src/') && f.endsWith('.tsx'))
            let allCode = ''
            for (const file of srcFiles.slice(0, 5)) { // Limit to 5 files
              const content = await window.jett.readFile(project.id, file)
              if (content.success) allCode += content.content + '\n'
            }
            if (allCode) {
              const memResult = await window.jett.memory.learn(project.id, allCode, true)
              if (memResult.success && memResult.patternsLearned > 0) {
                log(`  🧠 Memorized ${memResult.patternsLearned} new patterns`)
              }
            }
          }

          // Auto-commit to git if enabled
          const gitConfig = await window.jett.github.getConfig()
          if (gitConfig.success && gitConfig.config?.autoCommit) {
            const gitResult = await window.jett.github.commitTask(project.id, taskIndex, task.description)
            if (gitResult.success && gitResult.sha) {
              log(`  🐙 Git commit: ${gitResult.sha}`)
            }
          }

          if (taskIndex + 1 < updatedTasks.length) {
            // Check if execution was stopped
            if (stopExecutionRef.current) {
              stopExecutionRef.current = false
              setShouldStopExecution(false)
              setIsExecuting(false)
              log('⏹️ Execution stopped by user')
              return
            }
            setCurrentTaskIndex(taskIndex + 1)
            setTimeout(() => executeTask(taskIndex + 1), 1000)
          } else {
            log('\n🎉 All tasks complete!')
            log('💡 Generating smart suggestions...')
            
            // Get smart suggestions from learning system
            const suggestionsResult = await window.jett.learning.getSuggestions('any', 3)
            const learnedSuggestions: Suggestion[] = suggestionsResult.success && suggestionsResult.suggestions
              ? suggestionsResult.suggestions.map((s: any, i: number) => ({
                  id: s.id,
                  rank: (i + 1) as 1 | 2 | 3,
                  category: s.category,
                  title: s.title,
                  description: s.description,
                  severity: s.severity
                }))
              : [
                  // Fallback suggestions
                  {
                    id: `sug-${Date.now()}-1`,
                    rank: 1 as const,
                    category: 'Accessibility',
                    title: 'Add focus states to buttons',
                    description: 'Buttons lack visible focus indicators for keyboard navigation',
                    severity: 'high' as const
                  },
                  {
                    id: `sug-${Date.now()}-2`,
                    rank: 2 as const,
                    category: 'UX',
                    title: 'Add loading indicator',
                    description: 'No feedback when actions are processing',
                    severity: 'medium' as const
                  },
                  {
                    id: `sug-${Date.now()}-3`,
                    rank: 3 as const,
                    category: 'Polish',
                    title: 'Add smooth transitions',
                    description: 'Animations between states improve perceived quality',
                    severity: 'low' as const
                  }
                ]
            
            await window.jett.updateProjectStatus(project.id, 'complete')
            const updatedProject = { 
              ...project, 
              status: 'complete' as const, 
              tasks: updatedTasks,
              suggestions: learnedSuggestions
            }
            onProjectUpdate(updatedProject)
            await window.jett.updateProject(updatedProject)
            log('✅ Ready! Build suggestions or Go Live.')
          }
        } else if (response.includes('BROKEN')) {
          const attempts = task.attempts + 1
          log(`  🔧 BROKEN (attempt ${attempts}/3)`)

          if (attempts >= 3) {
            updatedTasks[taskIndex] = { ...task, status: 'failed', attempts }
            log(`  ❌ Failed after 3 attempts`)
            log(`  💡 Click "View Error" for details`)
            
            // Analyze what went wrong and show modal
            const analysisResult = await window.jett.errors.analyze(
              `Task "${task.description}" failed visual verification after 3 attempts. ` +
              `The AI repeatedly marked it as BROKEN.`
            )
            if (analysisResult.success) {
              setCurrentErrorAnalysis(analysisResult.analysis)
              setPendingRetryAction(() => () => {
                // Reset task and retry
                const resetTasks = [...tasksRef.current]
                resetTasks[taskIndex] = { ...resetTasks[taskIndex], status: 'pending', attempts: 0 }
                setTasks(resetTasks)
                window.jett.updateTasks(project.id, resetTasks)
                executeTask(taskIndex)
              })
              setShowErrorModal(true)
            }
          } else {
            // Check if execution was stopped
            if (stopExecutionRef.current) {
              stopExecutionRef.current = false
              setShouldStopExecution(false)
              setIsExecuting(false)
              log('⏹️ Execution stopped by user')
              updatedTasks[taskIndex] = { ...task, status: 'pending', attempts }
              setTasks(updatedTasks)
              await window.jett.updateTasks(project.id, updatedTasks)
              return
            }
            updatedTasks[taskIndex] = { ...task, status: 'pending', attempts }
            setTimeout(() => executeTask(taskIndex), 1000)
          }
          setTasks(updatedTasks)
          await window.jett.updateTasks(project.id, updatedTasks)
        }
      }
    } catch (error: any) {
      log(`❌ Verify error: ${error.message}`)
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    log('\n🚀 Deploying to Vercel...')

    try {
      const result = await window.jett.deployToVercel(project.id)
      if (result.success && result.url) {
        log(`✅ Deployed: ${result.url}`)
        await window.jett.setDeployUrl(project.id, result.url)
        onProjectUpdate({ ...project, deployUrl: result.url })
      } else {
        log(`❌ Deploy failed: ${result.error}`)
      }
    } catch (error: any) {
      log(`❌ Deploy error: ${error.message}`)
    }

    setIsDeploying(false)
  }

  // Mode transition handlers
  const handleSendToTest = async () => {
    log('\n🧪 Entering Test mode...')
    
    // Generate mock suggestions for now
    const mockSuggestions: Suggestion[] = [
      {
        id: 'sug-1',
        rank: 1,
        category: 'Accessibility',
        title: 'Add focus states to buttons',
        description: 'Buttons lack visible focus indicators for keyboard navigation',
        severity: 'high'
      },
      {
        id: 'sug-2',
        rank: 2,
        category: 'UX',
        title: 'Add loading indicator',
        description: 'No feedback when actions are processing',
        severity: 'medium'
      },
      {
        id: 'sug-3',
        rank: 3,
        category: 'Responsive',
        title: 'Improve mobile layout',
        description: 'Content may overflow on screens below 375px',
        severity: 'low'
      }
    ]
    
    const updatedProject = { 
      ...project, 
      mode: 'test' as const,
      suggestions: mockSuggestions
    }
    onProjectUpdate(updatedProject)
    await window.jett.updateProject(updatedProject)
    log('✅ Now in Test mode - Review suggestions below')
  }

  const handleBackToDev = async () => {
    log('\n🔧 Returning to Dev mode...')
    log('💡 Getting fresh suggestions...')
    
    // Get fresh suggestions from learning system
    const result = await window.jett.learning.getSuggestions('any', 3)
    
    const freshSuggestions: Suggestion[] = result.success && result.suggestions
      ? result.suggestions.map((s: any, i: number) => ({
          id: s.id,
          rank: (i + 1) as 1 | 2 | 3,
          category: s.category,
          title: s.title,
          description: s.description,
          severity: s.severity
        }))
      : [
          // Fallback suggestions
          {
            id: `sug-${Date.now()}-1`,
            rank: 1 as const,
            category: 'Performance',
            title: 'Optimize image loading',
            description: 'Add lazy loading for images to improve initial page load',
            severity: 'medium' as const
          },
          {
            id: `sug-${Date.now()}-2`,
            rank: 2 as const,
            category: 'UX',
            title: 'Add keyboard shortcuts',
            description: 'Allow power users to navigate with keyboard',
            severity: 'low' as const
          },
          {
            id: `sug-${Date.now()}-3`,
            rank: 3 as const,
            category: 'Polish',
            title: 'Improve empty states',
            description: 'Add helpful illustrations and guidance when no data',
            severity: 'low' as const
          }
        ]
    
    const updatedProject = { 
      ...project, 
      mode: 'dev' as const,
      suggestions: freshSuggestions
    }
    onProjectUpdate(updatedProject)
    await window.jett.updateProject(updatedProject)
    log('✅ Back in Dev mode - suggestions ready')
  }

  const handleGenerateSuggestions = async () => {
    log('\n💡 Getting smart suggestions...')
    
    // Get suggestions from learning system
    const result = await window.jett.learning.getSuggestions('any', 3)
    
    const suggestions: Suggestion[] = result.success && result.suggestions
      ? result.suggestions.map((s: any, i: number) => ({
          id: s.id,
          rank: (i + 1) as 1 | 2 | 3,
          category: s.category,
          title: s.title,
          description: s.description,
          severity: s.severity
        }))
      : [
          // Fallback suggestions
          {
            id: `sug-${Date.now()}-1`,
            rank: 1 as const,
            category: 'Accessibility',
            title: 'Add focus states to buttons',
            description: 'Buttons lack visible focus indicators for keyboard navigation',
            severity: 'high' as const
          },
          {
            id: `sug-${Date.now()}-2`,
            rank: 2 as const,
            category: 'UX',
            title: 'Add loading indicator',
            description: 'No feedback when actions are processing',
            severity: 'medium' as const
          },
          {
            id: `sug-${Date.now()}-3`,
            rank: 3 as const,
            category: 'Polish',
            title: 'Add smooth transitions',
            description: 'Animations between states improve perceived quality',
            severity: 'low' as const
          }
        ]
    
    const updatedProject = { 
      ...project, 
      suggestions
    }
    onProjectUpdate(updatedProject)
    await window.jett.updateProject(updatedProject)
    log('✅ Suggestions ready!')
  }

  const handleGoLive = async () => {
    setIsDeploying(true)
    
    // Calculate next version
    const currentVersion = project.prodVersion || 0
    const nextVersion = currentVersion + 1
    
    log(`\n🚀 Deploying v${nextVersion}...`)

    try {
      const result = await window.jett.deployToVercel(project.id)
      if (result.success && result.url) {
        log(`✅ Deployed: ${result.url}`)
        
        // Create version entry
        const versionEntry: VersionEntry = {
          version: nextVersion,
          deployedAt: new Date().toISOString(),
          url: result.url
        }
        
        // Add to history (newest first)
        const existingHistory = project.versionHistory || []
        const newHistory = [versionEntry, ...existingHistory]
        
        const updatedProject = { 
          ...project, 
          mode: 'prod' as const,
          prodUrl: result.url,
          deployUrl: result.url,
          prodVersion: nextVersion,
          versionHistory: newHistory
        }
        await window.jett.setDeployUrl(project.id, result.url)
        onProjectUpdate(updatedProject)
        await window.jett.updateProject(updatedProject)
        log(`🎉 v${nextVersion} is now LIVE!`)
      } else {
        log(`❌ Deploy failed: ${result.error}`)
      }
    } catch (error: any) {
      log(`❌ Deploy error: ${error.message}`)
    }

    setIsDeploying(false)
  }

  const handleBuildSuggestion = async () => {
    if (!selectedSuggestion) return
    
    const suggestion = project.suggestions.find(s => s.id === selectedSuggestion)
    if (!suggestion) return
    
    setIsBuildingSuggestion(true)
    log(`\n🔧 Building: ${suggestion.title}`)
    log(`   Category: ${suggestion.category}`)
    log(`   ${suggestion.description}`)
    
    try {
      // Get learning context for consistency
      const learningContext = await window.jett.learning.getContext(project.id)
      const contextString = learningContext.success ? learningContext.formatted : ''
      
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
        const filesCreated: { [path: string]: string } = {}
        let allCode = ''
        
        while ((match = fileRegex.exec(result.text)) !== null) {
          const [, filePath, content] = match
          await window.jett.writeFile(project.id, filePath, content.trim())
          log(`  📄 Updated: ${filePath}`)
          filesWritten++
          filesCreated[filePath] = content.trim()
          allCode += content.trim() + '\n'
          setLastFileUpdate(Date.now())
        }

        if (filesWritten === 0) {
          log(`  ⚠️ AI didn't output any files`)
          log(`  Response preview: ${result.text.slice(0, 200)}...`)
          setIsBuildingSuggestion(false)
          return
        }

        // Extract patterns from the new code
        await window.jett.learning.extractPatterns(
          project.id,
          `${suggestion.category}: ${suggestion.title}`,
          allCode,
          filesCreated
        )
        log(`  🧠 Learned patterns`)

        // Wait for hot reload
        log(`  ⏳ Waiting for hot reload...`)
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verify the suggestion was implemented
        log(`  🔍 Verifying implementation...`)
        
        let screenshot = null
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
          screenshot || undefined,
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

        // Record outcome in learning system
        await window.jett.learning.recordSuggestion(suggestion.id, succeeded)
        log(`  🧠 Recorded outcome: ${succeeded ? 'success' : 'needs review'}`)

        // Add as completed task
        const newTask: Task = {
          id: `task-${Date.now()}`,
          description: `${suggestion.title} (${suggestion.category})`,
          status: succeeded ? 'working' : 'verifying',
          attempts: 1
        }
        const updatedTasks = [...tasks, newTask]
        setTasks(updatedTasks)
        await window.jett.updateTasks(project.id, updatedTasks)

        // Create snapshot after successful suggestion build
        if (succeeded) {
          const snapshotResult = await window.jett.history.createSnapshot(
            project.id,
            updatedTasks.length, // task index = length since we just added one
            `${suggestion.category}: ${suggestion.title}`
          )
          if (snapshotResult.success) {
            log(`  📸 Snapshot saved`)
          }
        }

        log(`\n🔄 Getting fresh suggestions...`)

        // Get fresh suggestions - exclude current AND already-built suggestions
        const currentIds = project.suggestions.map(s => s.id)
        // Also exclude suggestions that match task descriptions (already built)
        const builtTitles = updatedTasks
          .filter(t => t.description.includes('(')) // Suggestion tasks have "(Category)" suffix
          .map(t => t.description.split(' (')[0].toLowerCase())
        
        const refreshResult = await window.jett.learning.refreshSuggestions(currentIds, 'any', 3)
        
        // Filter out any suggestions that match already-built task titles
        let newSuggestions: Suggestion[] = refreshResult.success && refreshResult.suggestions
          ? refreshResult.suggestions
              .filter((s: any) => !builtTitles.includes(s.title.toLowerCase()))
              .slice(0, 3)
              .map((s: any, i: number) => ({
                id: s.id,
                rank: (i + 1) as 1 | 2 | 3,
                category: s.category,
                title: s.title,
                description: s.description,
                severity: s.severity
              }))
          : project.suggestions.filter(s => s.id !== selectedSuggestion)

        const updatedProject = { ...project, suggestions: newSuggestions, tasks: updatedTasks }
        onProjectUpdate(updatedProject)
        await window.jett.updateProject(updatedProject)
        
        setSelectedSuggestion(null)
        log(`✅ Done! ${newSuggestions.length} suggestions available.`)

      } else {
        log(`❌ AI Error: ${result.error || 'Unknown error'}`)
        await window.jett.learning.recordSuggestion(suggestion.id, false)
      }
    } catch (error: any) {
      log(`❌ Error: ${error.message}`)
      await window.jett.learning.recordSuggestion(suggestion.id, false)
    }

    setIsBuildingSuggestion(false)
  }

  const handleRestartServer = async () => {
    log('\n🔄 Restarting server...')
    await window.jett.stopDevServer()
    log('📦 Installing dependencies...')
    const installResult = await window.jett.runNpmInstall(project.id)
    log(`   Install result: ${installResult ? 'success' : 'failed'}`)
    log('🚀 Starting dev server...')
    const serverResult = await window.jett.startDevServer(project.id)
    log(`   Server result: ${JSON.stringify(serverResult)}`)
    if (serverResult.success && serverResult.port) {
      const url = `http://localhost:${serverResult.port}`
      setPreviewUrl(url)
      setIsServerRunning(true)
      log(`✅ Server running at ${url}`)
    } else {
      log(`❌ Server failed to start: ${serverResult.error || 'unknown error'}`)
    }
  }

  const handleRollback = async (taskIndex: number) => {
    // Rollback to state AFTER task taskIndex completed
    // taskIndex 0 = after task 1, etc.
    const snapshotId = `task-${taskIndex + 1}`
    
    log(`\n⏪ Rolling back to after Task ${taskIndex + 1}...`)
    
    // Check if snapshot exists first
    const detailsResult = await window.jett.history.getDetails(project.id, snapshotId)
    if (!detailsResult.success) {
      log(`❌ No snapshot found for Task ${taskIndex + 1}`)
      log(`   This project was built before History was added.`)
      log(`   Snapshots are only available for tasks completed after v1.5.0`)
      log(`\n💡 Tip: For new builds, snapshots are created automatically.`)
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
    
    // Reset task statuses - keep tasks up to taskIndex, remove extras from suggestions
    const originalTaskCount = 5 // Original build tasks
    const updatedTasks = tasks
      .slice(0, Math.max(originalTaskCount, taskIndex + 1)) // Keep original 5 or up to rollback point
      .map((task, idx) => {
        if (idx <= taskIndex) {
          return { ...task, status: 'working' as const }
        } else {
          return { ...task, status: 'pending' as const, attempts: 0 }
        }
      })
    setTasks(updatedTasks)
    await window.jett.updateTasks(project.id, updatedTasks)
    
    // Update current task index
    setCurrentTaskIndex(taskIndex + 1)
    
    // Trigger file panel refresh
    setLastFileUpdate(Date.now())
    
    log(`✅ Rolled back! Ready to re-run Task ${taskIndex + 2}`)
    log(`   Click "Do it" to continue from Task ${taskIndex + 2}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <span className="opacity-40">○</span>
      case 'executing': return <IconClock size={12} />
      case 'verifying': return <IconCog size={12} className="animate-spin" />
      case 'working': return <IconCheck size={12} />
      case 'failed': return <IconX size={12} />
      default: return <span className="opacity-40">○</span>
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Build Error Modal */}
      <BuildErrorModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false)
          setCurrentErrorAnalysis(null)
        }}
        analysis={currentErrorAnalysis}
        onAutoFix={handleErrorAutoFix}
        onRetry={handleErrorRetry}
        onSkip={handleErrorSkip}
        onViewTerminal={handleViewTerminal}
        isFixing={isAutoFixing}
      />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Tasks */}
        <div 
          className="w-72 flex flex-col flex-shrink-0"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-primary)' }}
        >
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <h2 
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Tasks
            </h2>
          </div>
          
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {isGenerating ? (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                <div className="text-2xl mb-2">🧠</div>
                Generating tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                <div className="mb-4">No tasks yet</div>
                <button
                  onClick={generateTasks}
                  className="px-4 py-2 rounded-lg font-medium transition-all"
                  style={{ 
                    background: 'var(--accent-primary)', 
                    color: 'white' 
                  }}
                >
                  🚀 Generate Tasks
                </button>
              </div>
            ) : (
              tasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg transition-all duration-150"
                  style={{ 
                    background: idx === currentTaskIndex && isExecuting 
                      ? 'var(--accent-primary-light)' 
                      : task.status === 'working'
                      ? 'var(--success-light)'
                      : task.status === 'failed'
                      ? 'var(--error-light)'
                      : editingTaskIndex === idx
                      ? 'var(--bg-hover)'
                      : 'var(--bg-elevated)',
                    border: '1px solid ' + (
                      idx === currentTaskIndex && isExecuting 
                        ? 'var(--accent-primary)' 
                        : task.status === 'working'
                        ? 'var(--success)'
                        : task.status === 'failed'
                        ? 'var(--error)'
                        : editingTaskIndex === idx
                        ? 'var(--accent-primary)'
                        : 'var(--border-primary)'
                    )
                  }}
                >
                  {/* Edit mode */}
                  {editingTaskIndex === idx ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingTaskText}
                        onChange={(e) => setEditingTaskText(e.target.value)}
                        className="w-full p-2 rounded text-sm resize-none"
                        style={{ 
                          background: 'var(--bg-primary)', 
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-primary)'
                        }}
                        rows={2}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            saveEditedTask()
                          } else if (e.key === 'Escape') {
                            cancelEditingTask()
                          }
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEditingTask}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditedTask}
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            background: 'var(--accent-primary)', 
                            color: 'white' 
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal display mode */
                    <div className="flex items-start gap-2 overflow-hidden">
                      <span className="text-lg flex-shrink-0">{getStatusIcon(task.status)}</span>
                      <span className="text-sm flex-1 break-words" style={{ color: 'var(--text-primary)' }}>{task.description}</span>
                      {/* Edit button for pending tasks */}
                      {task.status === 'pending' && !isExecuting && (
                        <button
                          onClick={() => startEditingTask(idx)}
                          className="text-xs px-2 py-1 rounded transition-all duration-150 opacity-50 hover:opacity-100 flex-shrink-0"
                          style={{ 
                            background: 'var(--bg-tertiary)', 
                            color: 'var(--text-secondary)' 
                          }}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                      )}
                      {/* Rollback button for completed tasks */}
                      {task.status === 'working' && !isExecuting && (
                        <button
                          onClick={() => handleRollback(idx)}
                          className="text-xs px-2 py-1 rounded transition-all duration-150"
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
                          title={`Roll back to after this task`}
                        >
                          ↩
                        </button>
                      )}
                      {/* View Error button for failed tasks */}
                      {task.status === 'failed' && !isExecuting && (
                        <button
                          onClick={async () => {
                            const analysisResult = await window.jett.errors.analyze(
                              `Task "${task.description}" failed after ${task.attempts} attempts.`
                            )
                            if (analysisResult.success) {
                              setCurrentErrorAnalysis(analysisResult.analysis)
                              setPendingRetryAction(() => () => {
                                const resetTasks = [...tasksRef.current]
                                resetTasks[idx] = { ...resetTasks[idx], status: 'pending', attempts: 0 }
                                setTasks(resetTasks)
                                window.jett.updateTasks(project.id, resetTasks)
                                executeTask(idx)
                              })
                              setShowErrorModal(true)
                            }
                          }}
                          className="text-xs px-2 py-1 rounded transition-all duration-150"
                          style={{ 
                            background: 'var(--error-light)', 
                            color: 'var(--error)' 
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--error)'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--error-light)'
                            e.currentTarget.style.color = 'var(--error)'
                          }}
                          title="View error details"
                        >
                          <IconAlert size={12} /> Fix
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
            {isExecuting && (
              <div className="flex gap-2">
                <div 
                  className="flex-1 py-2.5 font-medium rounded-lg text-center text-sm"
                  style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}
                >
                  {shouldStopExecution 
                    ? '⏹️ Stopping...'
                    : tasks[currentTaskIndex]?.status === 'verifying' 
                    ? `🔍 Verifying ${currentTaskIndex + 1} of ${tasks.length}...`
                    : `⏳ Building ${currentTaskIndex + 1} of ${tasks.length}...`
                  }
                </div>
                <button
                  onClick={stopExecution}
                  disabled={shouldStopExecution}
                  className="px-4 py-2.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
                  style={{ 
                    background: 'var(--error)', 
                    color: 'white' 
                  }}
                  title="Stop execution after current step"
                >
                  ⏹️
                </button>
              </div>
            )}
            
            {/* DEV mode buttons */}
            {(!project.mode || project.mode === 'dev') && (
              <>
                {tasks.length > 0 && !isExecuting && !isComplete && (
                  <button
                    onClick={() => {
                      // Find first incomplete task (pending or failed)
                      const firstIncompleteIndex = tasks.findIndex(t => t.status === 'pending' || t.status === 'failed')
                      const startIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0
                      executeTask(startIndex)
                    }}
                    disabled={!apiKey}
                    className="w-full py-2.5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    {tasks.some(t => t.status === 'working') ? '▶️ Resume Build' : '▶️ Start Build'}
                  </button>
                )}
                
                {isComplete && !isDeploying && (
                  <button
                    onClick={handleGoLive}
                    className="w-full py-2.5 font-medium rounded-lg transition-all duration-150"
                    style={{ background: 'var(--success)', color: 'white' }}
                  >
                    🚀 Go Live
                  </button>
                )}
                
                {/* Show Get Suggestions if complete but no suggestions */}
                {isComplete && (!project.suggestions || project.suggestions.length === 0) && (
                  <button
                    onClick={handleGenerateSuggestions}
                    className="w-full py-2.5 font-medium rounded-lg transition-all duration-150"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    💡 Get Suggestions
                  </button>
                )}
                
                {isDeploying && (
                  <div 
                    className="w-full py-2.5 font-medium rounded-lg text-center text-sm"
                    style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                  >
                    ⏳ Deploying...
                  </div>
                )}
              </>
            )}
            
            {/* PROD mode - Version info and history */}
            {project.mode === 'prod' && (
              <>
                {/* Current version info */}
                <div 
                  className="p-3 rounded-lg mb-2"
                  style={{ background: 'var(--success-light)', border: '1px solid var(--success)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--success)' }} className="font-medium">🚀 Live</span>
                    <span style={{ color: 'var(--text-primary)' }} className="font-bold">v{project.prodVersion || 1}</span>
                  </div>
                  {project.versionHistory?.[0] && (
                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Deployed {new Date(project.versionHistory[0].deployedAt).toLocaleDateString()} at {new Date(project.versionHistory[0].deployedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                
                {/* Version history */}
                {project.versionHistory && project.versionHistory.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>History</div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {project.versionHistory.map((entry, idx) => (
                        <div 
                          key={entry.version}
                          className="flex items-center justify-between text-xs p-2 rounded"
                          style={{ 
                            background: idx === 0 ? 'var(--success-light)' : 'var(--bg-tertiary)',
                            color: idx === 0 ? 'var(--success)' : 'var(--text-tertiary)'
                          }}
                        >
                          <span>v{entry.version}</span>
                          <span>{new Date(entry.deployedAt).toLocaleDateString()}</span>
                          {idx === 0 && <span className="text-emerald-400">● live</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleBackToDev}
                  className="w-full py-2 bg-[var(--bg-tertiary)] hover:bg-slate-600 text-[var(--text-primary)] font-medium rounded-lg transition-colors"
                >
                  ← Back to Dev
                </button>
              </>
            )}

            {!isExecuting && !isServerRunning && tasks.some(t => t.status === 'working') && (
              <button
                onClick={handleRestartServer}
                className="w-full py-2 bg-[var(--bg-tertiary)] hover:bg-slate-600 text-[var(--text-primary)] font-medium rounded-lg transition-colors"
              >
                <IconRefresh size={14} /> Restart Server
              </button>
            )}
          </div>
        </div>

        {/* Suggestions Panel (DEV mode when build complete, or has suggestions) */}
        {(!project.mode || project.mode === 'dev') && isComplete && project.suggestions && project.suggestions.length > 0 && (
          <div className="w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-[var(--border-primary)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide flex items-center gap-2">
                💡 Suggestions
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Select one to build</p>
            </div>
            
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {project.suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => setSelectedSuggestion(suggestion.id)}
                  disabled={isBuildingSuggestion}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedSuggestion === suggestion.id
                      ? 'border-indigo-500 bg-indigo-900/30 ring-1 ring-indigo-500'
                      : suggestion.severity === 'high' ? 'border-red-700/50 bg-red-900/10 hover:bg-red-900/20' :
                        suggestion.severity === 'medium' ? 'border-amber-700/50 bg-amber-900/10 hover:bg-amber-900/20' :
                        'border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'
                  } ${isBuildingSuggestion ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      selectedSuggestion === suggestion.id
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-slate-500'
                    }`}>
                      {selectedSuggestion === suggestion.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{suggestion.title}</div>
                      <div className="text-xs text-[var(--text-secondary)] mb-1">{suggestion.category}</div>
                      <p className="text-xs text-[var(--text-secondary)]">{suggestion.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-[var(--border-primary)]">
              <button
                onClick={handleBuildSuggestion}
                disabled={!selectedSuggestion || isBuildingSuggestion}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] text-[var(--text-primary)] font-medium rounded-lg transition-colors"
              >
                {isBuildingSuggestion ? <><IconClock size={12} /> Building...</> : <><IconCog size={12} /> Build Selected</>}
              </button>
            </div>
          </div>
        )}

        {/* Center: Tabbed Code/Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] flex items-center px-2 gap-1 flex-shrink-0">
            <button
              onClick={() => setCenterTab('preview')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                centerTab === 'preview'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
              }`}
            >
              🖥️ Preview
            </button>
            <button
              onClick={() => setCenterTab('code')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                centerTab === 'code'
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
              }`}
            >
              📄 Code
            </button>
            
            {/* URL bar when on preview tab */}
            {centerTab === 'preview' && (
              <div className="ml-auto flex items-center gap-2">
                <div className="px-3 py-1 bg-[var(--bg-primary)] rounded text-sm text-[var(--text-secondary)] flex items-center gap-2">
                  <span className="truncate max-w-[300px]">{previewUrl || 'http://localhost:5173'}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isServerRunning ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
              </div>
            )}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0">
            {centerTab === 'preview' ? (
              <div className="h-full bg-[var(--bg-primary)] relative">
                {previewUrl ? (
                  <webview
                    key={previewUrl}
                    ref={webviewRef}
                    src={previewUrl}
                    className="w-full h-full"
                    // @ts-ignore
                    allowpopups="true"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🚀</div>
                      <p>Start the build to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <CodePanel 
                projectId={project.id} 
                currentTaskIndex={currentTaskIndex}
                lastUpdate={lastFileUpdate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Terminal */}
      <div className="h-40 bg-slate-950 border-t border-[var(--border-primary)] flex-shrink-0 flex flex-col">
        <div className="p-2 border-b border-slate-800 text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wide flex-shrink-0">
          Terminal
        </div>
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-2 font-mono text-xs text-[var(--text-secondary)]"
        >
          {terminalLogs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
