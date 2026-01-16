// ============================================
// VALIDATION PRELOAD ADDITIONS
// ============================================
// Add this to electron/preload/index.ts in the contextBridge.exposeInMainWorld call

// Add to the jett object:
validation: {
  runAll: () => ipcRenderer.invoke('validation:run-all'),
  runPlugin: (plugin: 'code-review' | 'memory' | 'github') => 
    ipcRenderer.invoke('validation:run-plugin', plugin),
  onProgress: (callback: (message: string) => void) => 
    ipcRenderer.on('validation:progress', (_event, msg) => callback(msg))
}

// ============================================
// TYPE ADDITIONS
// ============================================
// Add to your window type declarations:

interface ValidationResult {
  criterion: string
  plugin: 'code-review' | 'memory' | 'github'
  passed: boolean
  actual: string | number
  expected: string | number
  duration?: number
  details?: string
}

interface ValidationSummary {
  timestamp: string
  passed: number
  failed: number
  total: number
  results: ValidationResult[]
}

interface JettValidation {
  runAll: () => Promise<{ success: boolean; summary?: ValidationSummary; logs?: string[]; error?: string }>
  runPlugin: (plugin: 'code-review' | 'memory' | 'github') => Promise<{ success: boolean; results?: ValidationResult[]; error?: string }>
  onProgress: (callback: (message: string) => void) => void
}

// Add validation to Window.jett interface
interface Jett {
  // ... existing methods ...
  validation: JettValidation
}
