/**
 * HelpPanel - Draggable AI Help Chat
 * Fixed: Uses correct API signature with provider/model
 */

import { useState, useRef, useEffect } from 'react'
import { IconSparkles } from './Icons'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface HelpPanelProps {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  provider?: string
  model?: string
}

const QUICK_QUESTIONS = [
  'How do I deploy my app?',
  'What should I put in the PRD?',
  'How does the build process work?',
  'What are keyboard shortcuts?',
  'How do I add my API key?',
]

const HELP_CONTEXT = `You are Jett's Help Assistant. Answer questions about using Jett - an AI app builder for designers.

Key features:
- Projects: Create/manage apps
- PRD: 8 sections (Overview, Features, User Flows, Design Notes, Business Rules, Edge Cases, Tech Notes, References)
- Build: AI executes tasks with screenshot verification
- Review: AI code review
- History: Version control
- Deploy: One-click Vercel deploy

Workflow: Create project → Fill PRD → Generate tasks → "Do it" → Deploy
Shortcuts: Cmd+N (new), Cmd+B (build), Cmd+, (settings)

Keep answers concise.`

// Header tab component (matches other nav tabs)
export function HelpBubble({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
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
      title="Help"
    >
      <IconSparkles size={14} />
      Help
    </button>
  )
}

export default function HelpPanel({ isOpen, onClose, apiKey, provider, model }: HelpPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState({ x: window.innerWidth - 370, y: window.innerHeight - 520 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const panelRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 350, e.clientX - dragOffset.x))
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y))
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const sendMessage = async (content: string) => {
    if (!content.trim() || !apiKey) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build messages with Help context prepended to first message
      const allMessages = [...messages, userMessage]
      const apiMessages = allMessages.map((m, i) => ({
        role: m.role,
        content: i === 0 && m.role === 'user' 
          ? `[Context: ${HELP_CONTEXT}]\n\nUser question: ${m.content}`
          : m.content
      }))

      // Call API with correct signature: (apiKey, messages, screenshot, provider, model)
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify(apiMessages),
        undefined,  // no screenshot
        provider,
        model
      )

      if (result.success && result.text) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.text
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('Help chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I had trouble connecting: ${error.message || 'Unknown error'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col rounded-xl shadow-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: 340,
        height: 480,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-move select-none"
        style={{ 
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 mr-1" style={{ color: 'var(--text-tertiary)' }}>
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
            </div>
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current" />
              <span className="w-1 h-1 rounded-full bg-current" />
            </div>
          </div>
          <IconSparkles size={18} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Help</span>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="Collapse"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <>
            <div className="text-center py-4">
              <div 
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--accent-primary-light)' }}
              >
                <IconSparkles size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                How can I help?
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Ask me anything about using Jett
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                Quick questions
              </p>
              {QUICK_QUESTIONS.map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(question)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: message.role === 'user' 
                      ? 'var(--accent-primary)' 
                      : 'var(--bg-secondary)',
                    color: message.role === 'user' 
                      ? 'white' 
                      : 'var(--text-primary)',
                    border: message.role === 'assistant' ? '1px solid var(--border-primary)' : 'none'
                  }}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ 
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ color: 'var(--text-tertiary)', animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ color: 'var(--text-tertiary)', animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ color: 'var(--text-tertiary)', animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading || !apiKey}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ 
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)'
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !apiKey}
            className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ 
              background: 'var(--accent-primary)',
              color: 'white'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        {!apiKey && (
          <p className="text-xs mt-2" style={{ color: 'var(--warning)' }}>
            Add your API key in Settings to use Help
          </p>
        )}
      </form>

      {/* Footer */}
      <a
        href="https://jettbuilder.com/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-4 py-2 text-xs transition-colors"
        style={{ 
          background: 'var(--bg-secondary)',
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border-primary)'
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        View full documentation
      </a>
    </div>
  )
}
