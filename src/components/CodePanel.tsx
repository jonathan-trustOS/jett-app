import { useState, useEffect } from 'react'

interface Props {
  projectId: string
  currentTaskIndex?: number
  lastUpdate?: number // timestamp to trigger refresh
}

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

export default function CodePanel({ projectId, currentTaskIndex, lastUpdate }: Props) {
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [newFiles, setNewFiles] = useState<Set<string>>(new Set())

  // Fetch file list
  useEffect(() => {
    loadFiles()
  }, [projectId, lastUpdate])

  const loadFiles = async () => {
    const result = await window.jett.listFiles(projectId)
    if (result.success) {
      const oldFiles = new Set(files)
      const newlyAdded = result.files.filter((f: string) => !oldFiles.has(f))
      
      // Mark new files for highlight animation
      if (newlyAdded.length > 0) {
        setNewFiles(new Set(newlyAdded))
        setTimeout(() => setNewFiles(new Set()), 2000) // Clear after 2s
      }
      
      setFiles(result.files)
      
      // Auto-select first src file if nothing selected
      if (!selectedFile && result.files.length > 0) {
        const srcFile = result.files.find((f: string) => f.startsWith('src/'))
        setSelectedFile(srcFile || result.files[0])
      }
    }
  }

  // Load file content when selected
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile)
    }
  }, [selectedFile, lastUpdate])

  const loadFileContent = async (filePath: string) => {
    setLoading(true)
    const result = await window.jett.readFile(projectId, filePath)
    if (result.success) {
      setFileContent(result.content)
    } else {
      setFileContent(`// Error loading file: ${result.error}`)
    }
    setLoading(false)
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx':
      case 'ts':
        return '📄'
      case 'jsx':
      case 'js':
        return '📜'
      case 'css':
        return '🎨'
      case 'json':
        return '📦'
      case 'html':
        return '🌐'
      case 'md':
        return '📝'
      default:
        return '⚙️'
    }
  }

  const getFileTypeBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx':
        return 'React Component'
      case 'ts':
        return 'TypeScript'
      case 'jsx':
        return 'React Component'
      case 'js':
        return 'JavaScript'
      case 'css':
        return 'Styles'
      case 'json':
        return 'Config'
      case 'html':
        return 'HTML'
      default:
        return 'File'
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileContent)
  }

  // Group files by directory
  const groupedFiles = files.reduce((acc, file) => {
    // Skip node_modules and hidden files
    if (file.includes('node_modules') || file.startsWith('.')) return acc
    
    const parts = file.split('/')
    const dir = parts.length > 1 ? parts[0] : 'root'
    
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(file)
    return acc
  }, {} as Record<string, string[]>)

  // Sort directories: src first, then others, config files last
  const sortedDirs = Object.keys(groupedFiles).sort((a, b) => {
    if (a === 'src') return -1
    if (b === 'src') return 1
    if (a === 'root') return 1
    if (b === 'root') return -1
    return a.localeCompare(b)
  })

  return (
    <div className="h-full flex bg-[var(--bg-primary)] border-l border-r border-[var(--border-primary)]">
      {/* File Tree */}
      <div className="w-48 border-r border-[var(--border-primary)] flex flex-col">
        <div className="p-2 border-b border-[var(--border-primary)] text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Files
        </div>
        <div className="flex-1 overflow-auto p-2">
          {files.length === 0 ? (
            <div className="text-[var(--text-tertiary)] text-sm text-center py-4">
              No files yet
            </div>
          ) : (
            sortedDirs.map(dir => (
              <div key={dir} className="mb-2">
                {dir !== 'root' && (
                  <div className="text-xs text-[var(--text-tertiary)] font-medium mb-1 flex items-center gap-1">
                    📁 {dir}
                  </div>
                )}
                {groupedFiles[dir].map(file => {
                  const fileName = file.split('/').pop() || file
                  const isNew = newFiles.has(file)
                  const isSelected = selectedFile === file
                  
                  return (
                    <button
                      key={file}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-2 py-1 rounded text-sm flex items-center gap-1.5 transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 text-[var(--text-primary)]' 
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                      } ${isNew ? 'animate-pulse bg-emerald-900/50' : ''}`}
                    >
                      <span className="text-xs">{getFileIcon(fileName)}</span>
                      <span className="truncate">{fileName}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* File Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile ? (
          <>
            {/* File Header */}
            <div className="p-2 border-b border-[var(--border-primary)] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-[var(--text-primary)] font-medium truncate">
                  {selectedFile}
                </span>
                <span className="px-1.5 py-0.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded">
                  {getFileTypeBadge(selectedFile)}
                </span>
              </div>
              <button
                onClick={copyToClipboard}
                className="px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors flex items-center gap-1"
              >
                📋 Copy
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="p-4 text-[var(--text-tertiary)]">Loading...</div>
              ) : (
                <pre className="p-4 text-sm font-mono leading-relaxed">
                  <code>
                    {fileContent.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-[var(--bg-secondary)]/50">
                        <span className="w-10 text-right pr-4 text-slate-600 select-none flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[var(--text-secondary)] whitespace-pre overflow-x-auto">
                          {line || ' '}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
            <div className="text-center">
              <div className="text-3xl mb-2">📄</div>
              <p>Select a file to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
