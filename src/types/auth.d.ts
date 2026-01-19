// Add to src/types/global.d.ts or create this file

interface JettAuth {
  getSession: (key: string) => Promise<string | null>
  setSession: (key: string, value: string) => Promise<boolean>
  removeSession: (key: string) => Promise<boolean>
  getRememberedEmail: () => Promise<string | null>
  setRememberedEmail: (email: string) => Promise<boolean>
}

interface Window {
  jett?: {
    auth?: JettAuth
    // ... other existing jett methods
  }
}
