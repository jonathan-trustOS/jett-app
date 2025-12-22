import { create } from 'zustand'

export interface ClickContext {
  id: string
  timestamp: number
  url: string
  pageTitle: string
  screenshot: string | null
  clickTarget: {
    tagName: string
    text: string
    id?: string
    className?: string
    x: number
    y: number
  }
  viewportSize: {
    width: number
    height: number
  }
}

interface ContextStore {
  // Current context
  currentUrl: string
  currentLabel: string
  
  // Click history (last N clicks for AI context)
  clickHistory: ClickContext[]
  maxHistoryLength: number
  
  // Screenshot state
  isCapturing: boolean
  lastScreenshot: string | null
  
  // Actions
  setCurrentContext: (url: string, label: string) => void
  addClickContext: (context: ClickContext) => void
  setCapturing: (isCapturing: boolean) => void
  setLastScreenshot: (screenshot: string | null) => void
  clearHistory: () => void
  
  // Getters for AI
  getRecentContext: (n?: number) => ClickContext[]
}

export const useContextStore = create<ContextStore>((set, get) => ({
  // Initial state
  currentUrl: 'about:blank',
  currentLabel: 'Getting started',
  clickHistory: [],
  maxHistoryLength: 10,
  isCapturing: false,
  lastScreenshot: null,
  
  // Actions
  setCurrentContext: (url, label) => set({ currentUrl: url, currentLabel: label }),
  
  addClickContext: (context) => set((state) => {
    const newHistory = [context, ...state.clickHistory].slice(0, state.maxHistoryLength)
    return { 
      clickHistory: newHistory,
      lastScreenshot: context.screenshot 
    }
  }),
  
  setCapturing: (isCapturing) => set({ isCapturing }),
  
  setLastScreenshot: (screenshot) => set({ lastScreenshot: screenshot }),
  
  clearHistory: () => set({ clickHistory: [], lastScreenshot: null }),
  
  // Get recent context for AI
  getRecentContext: (n = 3) => get().clickHistory.slice(0, n),
}))
