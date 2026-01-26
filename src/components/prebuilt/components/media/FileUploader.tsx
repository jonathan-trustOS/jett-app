/**
 * FileUploader - Pre-built File Upload Component
 * 
 * Features:
 * - Drag and drop
 * - Click to browse
 * - File type filtering
 * - Size limits
 * - Progress indicator
 * - Preview for images
 */

import { useState, useRef, useCallback } from 'react'

interface UploadedFile {
  id: string
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

interface FileUploaderProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  onUpload?: (files: File[]) => Promise<void>
  onFilesChange?: (files: UploadedFile[]) => void
}

const IconUpload = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconFile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function FileUploader({
  accept = '*',
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
  onUpload,
  onFilesChange
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateFiles = (newFiles: UploadedFile[]) => {
    setFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = []
    
    for (const file of Array.from(fileList)) {
      // Check file count
      if (files.length + newFiles.length >= maxFiles) break
      
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: 'error',
          error: `File exceeds ${maxSize}MB limit`
        })
        continue
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        preview,
        progress: 0,
        status: 'pending'
      })
    }

    const allFiles = [...files, ...newFiles]
    updateFiles(allFiles)

    // Simulate upload or call actual upload
    if (onUpload) {
      const pendingFiles = newFiles.filter(f => f.status === 'pending')
      for (const uploadFile of pendingFiles) {
        updateFiles(allFiles.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f))
        
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(r => setTimeout(r, 100))
          updateFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, progress: i } : f))
        }

        try {
          await onUpload([uploadFile.file])
          updateFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'complete' as const, progress: 100 } : f))
        } catch (e) {
          updateFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'error' as const, error: 'Upload failed' } : f))
        }
      }
    } else {
      // No upload handler, mark all as complete
      updateFiles(allFiles.map(f => f.status === 'pending' ? { ...f, status: 'complete' as const, progress: 100 } : f))
    }
  }, [files, maxFiles, maxSize, onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id)
    if (file?.preview) URL.revokeObjectURL(file.preview)
    updateFiles(files.filter(f => f.id !== id))
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'bg-blue-600/20 border-blue-500' : 'hover:bg-white/5'}`}
        style={{ background: 'var(--bg-secondary)', border: `2px dashed ${isDragging ? '#3b82f6' : 'var(--border-primary)'}` }}
      >
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleFileSelect} className="hidden" />
        <div className="flex flex-col items-center gap-4" style={{ color: 'var(--text-tertiary)' }}>
          <IconUpload />
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm mt-1">or click to browse</p>
          </div>
          <p className="text-xs">Max {maxSize}MB per file • {maxFiles} files max</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(uploadedFile => (
            <div key={uploadedFile.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
              {/* Preview/Icon */}
              <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-primary)' }}>
                {uploadedFile.preview ? (
                  <img src={uploadedFile.preview} alt="" className="w-full h-full object-cover rounded" />
                ) : (
                  <IconFile />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{uploadedFile.file.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatSize(uploadedFile.file.size)}</p>
                
                {/* Progress bar */}
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadedFile.progress}%` }} />
                  </div>
                )}

                {/* Error */}
                {uploadedFile.error && (
                  <p className="text-xs text-red-400 mt-1">{uploadedFile.error}</p>
                )}
              </div>

              {/* Status/Remove */}
              <div className="flex items-center gap-2">
                {uploadedFile.status === 'complete' && <span className="text-green-400"><IconCheck /></span>}
                {uploadedFile.status === 'error' && <span className="text-red-400"><IconX /></span>}
                <button onClick={() => removeFile(uploadedFile.id)} className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                  <IconX />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
