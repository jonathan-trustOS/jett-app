/**
 * RichTextEditor - Pre-built Rich Text Editor Component
 * 
 * Features:
 * - Bold, italic, underline formatting
 * - Headings (H1, H2, H3)
 * - Lists (ordered, unordered)
 * - Links
 * - Code blocks
 * - Character/word count
 * 
 * Customization via props:
 * - value: Initial HTML content
 * - onChange: Callback when content changes
 * - placeholder: Placeholder text
 * - minHeight: Minimum editor height
 * - showWordCount: Show word/character count
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================
// TYPES
// ============================================

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: number
  showWordCount?: boolean
  readOnly?: boolean
}

// ============================================
// ICONS
// ============================================

const IconBold = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </svg>
)

const IconItalic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const IconUnderline = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </svg>
)

const IconStrikethrough = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 3.6 3.9h.2" />
    <path d="M8.7 19.1c2.3.6 4.4 1 6.2.9 2.7 0 5.3-.7 5.3-3.6 0-1.5-1.8-3.3-3.6-3.9h-.2" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
)

const IconListOrdered = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
  </svg>
)

const IconListUnordered = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
)

const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const IconCode = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const IconQuote = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </svg>
)

const IconHeading = ({ level }: { level: number }) => (
  <span className="font-bold text-sm">H{level}</span>
)

// ============================================
// COMPONENT
// ============================================

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  minHeight = 200,
  showWordCount = true,
  readOnly = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [])

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
    updateActiveFormats()
  }, [onChange])

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>()
    if (document.queryCommandState('bold')) formats.add('bold')
    if (document.queryCommandState('italic')) formats.add('italic')
    if (document.queryCommandState('underline')) formats.add('underline')
    if (document.queryCommandState('strikeThrough')) formats.add('strikethrough')
    if (document.queryCommandState('insertOrderedList')) formats.add('orderedList')
    if (document.queryCommandState('insertUnorderedList')) formats.add('unorderedList')
    setActiveFormats(formats)
  }, [])

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    handleInput()
  }

  const formatBlock = (tag: string) => {
    editorRef.current?.focus()
    document.execCommand('formatBlock', false, tag)
    handleInput()
  }

  const insertLink = () => {
    if (!linkUrl.trim()) return
    execCommand('createLink', linkUrl)
    setLinkUrl('')
    setShowLinkInput(false)
  }

  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    children, 
    title 
  }: { 
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition-colors ${
        active ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-white/10'
      }`}
      style={{ color: active ? undefined : 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )

  const Divider = () => (
    <div className="w-px h-6 mx-1" style={{ background: 'var(--border-primary)' }} />
  )

  // Calculate word/character count
  const getStats = () => {
    const text = editorRef.current?.textContent || ''
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const chars = text.length
    return { words, chars }
  }

  const stats = showWordCount ? getStats() : null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center flex-wrap gap-1 p-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          {/* Text formatting */}
          <ToolbarButton onClick={() => execCommand('bold')} active={activeFormats.has('bold')} title="Bold (Ctrl+B)">
            <IconBold />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('italic')} active={activeFormats.has('italic')} title="Italic (Ctrl+I)">
            <IconItalic />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('underline')} active={activeFormats.has('underline')} title="Underline (Ctrl+U)">
            <IconUnderline />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('strikeThrough')} active={activeFormats.has('strikethrough')} title="Strikethrough">
            <IconStrikethrough />
          </ToolbarButton>

          <Divider />

          {/* Headings */}
          <ToolbarButton onClick={() => formatBlock('h1')} title="Heading 1">
            <IconHeading level={1} />
          </ToolbarButton>
          <ToolbarButton onClick={() => formatBlock('h2')} title="Heading 2">
            <IconHeading level={2} />
          </ToolbarButton>
          <ToolbarButton onClick={() => formatBlock('h3')} title="Heading 3">
            <IconHeading level={3} />
          </ToolbarButton>
          <ToolbarButton onClick={() => formatBlock('p')} title="Paragraph">
            <span className="text-sm">P</span>
          </ToolbarButton>

          <Divider />

          {/* Lists */}
          <ToolbarButton onClick={() => execCommand('insertUnorderedList')} active={activeFormats.has('unorderedList')} title="Bullet List">
            <IconListUnordered />
          </ToolbarButton>
          <ToolbarButton onClick={() => execCommand('insertOrderedList')} active={activeFormats.has('orderedList')} title="Numbered List">
            <IconListOrdered />
          </ToolbarButton>

          <Divider />

          {/* Other */}
          <ToolbarButton onClick={() => formatBlock('blockquote')} title="Quote">
            <IconQuote />
          </ToolbarButton>
          <ToolbarButton onClick={() => formatBlock('pre')} title="Code Block">
            <IconCode />
          </ToolbarButton>
          
          <div className="relative">
            <ToolbarButton onClick={() => setShowLinkInput(!showLinkInput)} title="Insert Link">
              <IconLink />
            </ToolbarButton>
            {showLinkInput && (
              <div 
                className="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-lg z-10"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}
              >
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                    placeholder="https://..."
                    className="px-2 py-1 rounded text-sm outline-none w-48"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  <button
                    onClick={insertLink}
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onSelect={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        className="p-4 outline-none prose prose-invert max-w-none"
        style={{ 
          minHeight, 
          color: 'var(--text-primary)',
          background: 'var(--bg-primary)'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Footer with word count */}
      {showWordCount && (
        <div className="px-4 py-2 flex justify-end gap-4 text-xs" style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>
          <span>{stats?.words || 0} words</span>
          <span>{stats?.chars || 0} characters</span>
        </div>
      )}

      {/* Placeholder styles */}
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        [contenteditable] blockquote { 
          border-left: 3px solid var(--border-primary); 
          padding-left: 1em; 
          margin: 1em 0;
          color: var(--text-secondary);
        }
        [contenteditable] pre {
          background: var(--bg-secondary);
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          font-family: monospace;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2em;
          margin: 1em 0;
        }
        [contenteditable] a {
          color: #60a5fa;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
