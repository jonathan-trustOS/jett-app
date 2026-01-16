// ============================================
// VALIDATION SYSTEM IPC HANDLERS
// ============================================
// Add this to electron/main/index.ts

import {
  runAllValidations,
  validateCodeReviewPlugin,
  validateMemoryPlugin,
  validateGitHubPlugin,
  ValidationSummary
} from '../validation/index'

// Run all plugin validations
ipcMain.handle('validation:run-all', async (_event) => {
  try {
    // Collect logs to send back
    const logs: string[] = []
    const onProgress = (msg: string) => {
      logs.push(msg)
      // Optionally send progress to renderer
      mainWindow?.webContents.send('validation:progress', msg)
    }
    
    const summary = await runAllValidations(onProgress)
    return { success: true, summary, logs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Run specific plugin validation
ipcMain.handle('validation:run-plugin', async (
  _event,
  plugin: 'code-review' | 'memory' | 'github'
) => {
  try {
    let results
    switch (plugin) {
      case 'code-review':
        results = await validateCodeReviewPlugin()
        break
      case 'memory':
        results = await validateMemoryPlugin()
        break
      case 'github':
        results = await validateGitHubPlugin()
        break
    }
    return { success: true, results }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
