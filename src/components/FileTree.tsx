import { useState, useEffect } from 'react'

interface FileTreeProps {
  onFileSelect: (path: string) => void
  selectedFile: string | null
}

export default function FileTree({ onFileSelect, selectedFile }: FileTreeProps) {
  const [files, setFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const result = await window.jett.listFiles()
      if (result.success) {
        setFiles(result.files.sort())
        // Auto-expand first level folders
        const folders = new Set<string>()
        result.files.forEach((f: string) => {
          const parts = f.split('/')
          if (parts.length > 1) folders.add(parts[0])
        })
        setExpanded(folders)
      }
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folder: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(folder)) {
        next.delete(folder)
      } else {
        next.add(folder)
      }
      return next
    })
  }

  // Build tree structure
  const buildTree = (paths: string[]) => {
    const tree: Record<string, any> = {}
    paths.forEach(path => {
      const parts = path.split('/')
      let current = tree
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { __file: path }
        } else {
          if (!current[part]) current[part] = {}
          current = current[part]
        }
      })
    })
    return tree
  }

  const renderTree = (node: Record<string, any>, path = '', depth = 0) => {
    const entries = Object.entries(node).filter(([key]) => key !== '__file')
    
    return entries.map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name
      const isFile = value.__file
      const isExpanded = expanded.has(fullPath)
      
      if (isFile) {
        const ext = name.split('.').pop() || ''
        const icon = getFileIcon(ext)
        return (
          <div
            key={fullPath}
            onClick={() => onFileSelect(value.__file)}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-sm hover:bg-jett-border rounded ${
              selectedFile === value.__file ? 'bg-jett-accent/20 text-jett-accent' : 'text-jett-text'
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            <span className="text-xs">{icon}</span>
            <span>{name}</span>
          </div>
        )
      } else {
        return (
          <div key={fullPath}>
            <div
              onClick={() => toggleFolder(fullPath)}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer text-sm hover:bg-jett-border rounded text-jett-text"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              <span className="text-xs">{isExpanded ? '📂' : '📁'}</span>
              <span>{name}</span>
            </div>
            {isExpanded && renderTree(value, fullPath, depth + 1)}
          </div>
        )
      }
    })
  }

  const getFileIcon = (ext: string) => {
    const icons: Record<string, string> = {
      tsx: '⚛️',
      ts: '📘',
      js: '📒',
      jsx: '⚛️',
      json: '📋',
      css: '🎨',
      html: '🌐',
      md: '📝',
      env: '🔒',
    }
    return icons[ext] || '📄'
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-jett-muted">
        Loading files...
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-sm text-jett-muted">
        No files yet. Complete a task to generate code.
      </div>
    )
  }

  const tree = buildTree(files)

  return (
    <div className="py-2">
      <div className="px-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-jett-muted uppercase">Files</span>
        <button 
          onClick={loadFiles}
          className="text-xs text-jett-muted hover:text-jett-text"
        >
          ↻ Refresh
        </button>
      </div>
      {renderTree(tree)}
    </div>
  )
}