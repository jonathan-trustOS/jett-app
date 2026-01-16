import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../services/ai'
import { useContextStore } from '../stores/contextStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string
  hasPrd?: boolean
  filesWritten?: string[]
  steps?: string[]
}

interface ChatPanelProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  onPrdGenerated?: (prd: string) => void
  onTasksGenerated?: (tasks: string[]) => void
  onOpenPrd?: () => void
  onFilesWritten?: (files: string[]) => void
  onTaskExecuted?: () => void
  provider?: string
  taskToExecute?: string | null
  onTaskStarted?: () => void
  pendingVerification?: string | null
  onVerificationComplete?: () => void
}

const API_KEY_STORAGE = 'jett-api-key'

export default function ChatPanel({ 
  messages, 
  setMessages, 
  onPrdGenerated, 
  onTasksGenerated,
  onOpenPrd, 
  onFilesWritten, 
  onTaskExecuted,
  provider = 'claude', 
  taskToExecute, 
  onTaskStarted,
  pendingVerification,
  onVerificationComplete
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [currentSteps, setCurrentSteps] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { lastScreenshot, setLastScreenshot } = useContextStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClear = () => setLastScreenshot(null)
    window.addEventListener('jett-clear-screenshot', handleClear)
    return () => window.removeEventListener('jett-clear-screenshot', handleClear)
  }, [])

  useEffect(() => {
    if (taskToExecute && !isLoading) {
      console.log('🚀 Executing task:', taskToExecute)
      onTaskStarted?.()
      handleSendWithInput(`Do it: ${taskToExecute}`)
    }
  }, [taskToExecute])

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploadedImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const extractAndWriteFiles = async (response: string): Promise<string[]> => {
    const fileRegex = /---FILE-START\s*path="([^"]+)"\s*---([\s\S]*?)---FILE-END---/g
    const filesWritten: string[] = []
    
    let match
    while ((match = fileRegex.exec(response)) !== null) {
      const [, filePath, content] = match
      try {
        const result = await window.jett.writeFile(filePath, content.trim())
        if (result.success) {
          filesWritten.push(filePath)
        }
      } catch (error) {
        console.error(`Failed to write ${filePath}:`, error)
      }
    }
    
    return filesWritten
  }

  const extractSteps = (response: string): string[] => {
    const stepsMatch = response.match(/---STEPS-START---([\s\S]*?)---STEPS-END---/)
    if (!stepsMatch) return []
    return stepsMatch[1].trim().split('\n').filter(line => line.trim())
  }

  const extractTasks = (response: string): string[] => {
    const match = response.match(/---TASKS-START---([\s\S]*?)---TASKS-END---/)
    if (!match) return []
    return match[1].trim().split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
  }

  const handleSendWithInput = async (inputText: string, imageOverride?: string | null) => {
    if (!inputText.trim() || isLoading) return
    
    if (!apiKey) {
      setShowKeyInput(true)
      return
    }

    const userContent = inputText.trim()
    const isTaskExecution = userContent.startsWith('Do it:')
    const imageToAttach = imageOverride ?? uploadedImage ?? lastScreenshot

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      image: imageToAttach || undefined
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setUploadedImage(null)
    setLastScreenshot(null)
    setIsLoading(true)
    setCurrentSteps([])

    try {
      const history = updatedMessages
  .filter(m => m.id !== '1')
  .map(m => {
    if (m.image && m.role === 'user') {
      return {
        role: m.role as const,
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: m.image.replace(/^data:image\/\w+;base64,/, '') }},
          { type: 'text', text: m.content }
        ]
      }
    }
    return { role: m.role as const, content: m.content }
  })
      
      const response = await sendMessage(apiKey, history as any, undefined, provider)
      
      const steps = extractSteps(response)
      setCurrentSteps(steps)
      
      const prdMatch = response.match(/---PRD-START---([\s\S]*?)---PRD-END---/)
      if (prdMatch && onPrdGenerated) {
        onPrdGenerated(prdMatch[1].trim())
      }

      const tasks = extractTasks(response)
      if (tasks.length > 0 && onTasksGenerated) {
        onTasksGenerated(tasks)
      }
      
      const filesWritten = await extractAndWriteFiles(response)
      if (filesWritten.length > 0 && onFilesWritten) {
        onFilesWritten(filesWritten)
      }

      if (isTaskExecution && onTaskExecuted) {
        onTaskExecuted()
      }
      
      let displayContent = response
        .replace(/---PRD-START---[\s\S]*?---PRD-END---/, '')
        .replace(/---TASKS-START---[\s\S]*?---TASKS-END---/, '')
        .replace(/---FILE-START[\s\S]*?---FILE-END---/g, '')
        .replace(/---STEPS-START---[\s\S]*?---STEPS-END---/, '')
        .replace(/---TASK-COMPLETE---/, '')
        .trim()
      
      const hasPrd = !!prdMatch
      if (hasPrd && !displayContent) {
        displayContent = '✅ PRD generated! Ready to build.'
      }
      if (filesWritten.length > 0 && !displayContent) {
        displayContent = '✅ Done!'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        hasPrd,
        filesWritten: filesWritten.length > 0 ? filesWritten : undefined,
        steps: steps.length > 0 ? steps : undefined
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setCurrentSteps([])
    }
  }

  const handleSend = async () => {
    const inputText = input.trim() || ((uploadedImage || lastScreenshot) ? 'Analyze this screenshot. What do you see?' : '')
    if (!inputText && !uploadedImage && !lastScreenshot) return
    await handleSendWithInput(inputText)
  }

  // Verification: just set up the screenshot and prompt, user clicks Send
  useEffect(() => {
    if (!pendingVerification) return
    
    const setup = async () => {
      const screenshot = await window.jett.captureContext()
      if (screenshot) {
        setLastScreenshot(screenshot)
        setInput(`Verify: "${pendingVerification}" - Does this look correct? Reply WORKING or BROKEN.`)
      }
      onVerificationComplete?.()
    }
    
    setTimeout(setup, 1000)
  }, [pendingVerification])

  const saveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE, apiKey)
    setShowKeyInput(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentImage = uploadedImage || lastScreenshot

  return (
    <div className="flex flex-col h-full">
      {showKeyInput && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-jett-surface p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Enter API Key</h3>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
              className="w-full bg-jett-bg border border-jett-border rounded px-3 py-2 text-sm mb-4"
            />
            <div className="flex space-x-2">
              <button onClick={saveApiKey} className="flex-1 bg-jett-accent text-white py-2 rounded text-sm">Save</button>
              <button onClick={() => setShowKeyInput(false)} className="flex-1 bg-jett-border text-white py-2 rounded text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-jett-accent text-white' : 'bg-jett-surface border border-jett-border'}`}>
              {message.image && (
                <img src={message.image} alt="Attached" className="max-w-full rounded mb-2 max-h-48 object-contain" />
              )}
              {message.steps && message.steps.length > 0 && (
                <div className="mb-2 text-xs text-jett-muted space-y-1">
                  {message.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.filesWritten && message.filesWritten.length > 0 && (
                <details className="mt-2 text-xs text-jett-muted">
                  <summary className="cursor-pointer text-green-400">Files created ({message.filesWritten.length})</summary>
                  <div className="mt-1 pl-2">
                    {message.filesWritten.map((file, i) => (
                      <p key={i}>• {file}</p>
                    ))}
                  </div>
                </details>
              )}
              {message.hasPrd && onOpenPrd && (
                <button onClick={onOpenPrd} className="mt-2 bg-jett-accent text-white px-3 py-1.5 rounded text-sm hover:bg-jett-accent/90">
                  View PRD →
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-jett-surface border border-jett-border rounded-lg px-4 py-2">
              {currentSteps.length > 0 ? (
                <div className="text-xs space-y-1">
                  {currentSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-jett-muted">
                      <span className="animate-pulse">○</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-jett-muted animate-pulse">Thinking...</p>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-jett-surface border border-jett-border rounded-full p-2 shadow-lg hover:bg-jett-border transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}

      <div className="border-t border-jett-border p-4">
        {currentImage && (
          <div className="mb-2 relative inline-block">
            <img src={currentImage} alt="Attachment" className="h-20 rounded border border-jett-border" />
            <button 
              onClick={() => { setUploadedImage(null); setLastScreenshot(null); }} 
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-end space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-jett-surface border border-jett-border hover:bg-jett-border text-jett-muted px-3 py-3 rounded-lg text-sm">📎</button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to create?"
            rows={1}
            className="flex-1 bg-jett-surface border border-jett-border rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-jett-accent"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !currentImage) || isLoading}
            className="bg-jett-accent hover:bg-jett-accent/90 disabled:opacity-50 text-white px-4 py-3 rounded-lg text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}