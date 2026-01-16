import { useState, useEffect } from 'react'

interface CodeViewerProps {
  filePath: string | null
}

export default function CodeViewer({ filePath }: CodeViewerProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filePath) {
      setContent('')
      return
    }
    loadFile(filePath)
  }, [filePath])

  const loadFile = async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.jett.readFile(path)
      if (result.success && result.content) {
        setContent(result.content)
      } else {
        setError(result.error || 'Failed to read file')
      }
    } catch (err) {
      setError('Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop() || ''
    const langs: Record<string, string> = {
      tsx: 'TypeScript React',
      ts: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript React',
      json: 'JSON',
      css: 'CSS',
      html: 'HTML',
      md: 'Markdown',
    }
    return langs[ext] || 'Plain Text'
  }

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center text-jett-muted">
        <div className="text-center">
          <p className="text-4xl mb-4">📄</p>
          <p>Select a file to view</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-jett-muted">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-10 bg-jett-surface border-b border-jett-border flex items-center justify-between px-4">
        <span className="text-sm font-medium">{filePath}</span>
        <span className="text-xs text-jett-muted">{getLanguage(filePath)}</span>
      </div>
      <div className="flex-1 overflow-auto bg-jett-bg">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  )
}