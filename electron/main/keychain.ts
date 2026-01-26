/**
 * Jett Keychain Module
 * Secure key storage using Electron's safeStorage API
 * Uses OS keychain: macOS Keychain, Windows Credential Manager, Linux Secret Service
 */

import { safeStorage } from 'electron'
import Store from 'electron-store'

const store = new Store()

// Keys that should be stored securely
const SECURE_KEYS = ['apiKey', 'vercelToken', 'supabaseServiceKey', 'stripeSecretKey']

/**
 * Check if secure storage is available on this system
 */
export function isSecureStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

/**
 * Store a key securely using OS keychain
 * Falls back to plaintext with warning if not available
 */
export function storeSecureKey(key: string, value: string): void {
  if (!value) {
    deleteSecureKey(key)
    return
  }

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const encrypted = safeStorage.encryptString(value)
      store.set(`secure.${key}`, encrypted.toString('base64'))
      // Remove any plaintext version
      store.delete(key)
      store.delete(`insecure.${key}`)
    } catch (error) {
      console.error(`Failed to encrypt ${key}:`, error)
      // Fall back to insecure storage
      store.set(`insecure.${key}`, value)
    }
  } else {
    console.warn(`Secure storage not available. Storing ${key} in plaintext.`)
    store.set(`insecure.${key}`, value)
  }
}

/**
 * Retrieve a securely stored key
 */
export function getSecureKey(key: string): string | null {
  // Try secure storage first
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = store.get(`secure.${key}`) as string | undefined
    if (encrypted) {
      try {
        const buffer = Buffer.from(encrypted, 'base64')
        return safeStorage.decryptString(buffer)
      } catch (error) {
        console.error(`Failed to decrypt ${key}:`, error)
      }
    }
  }

  // Fall back to insecure storage
  const insecure = store.get(`insecure.${key}`) as string | undefined
  if (insecure) {
    return insecure
  }

  // Check legacy plaintext location (for migration)
  const legacy = store.get(key) as string | undefined
  return legacy || null
}

/**
 * Delete a securely stored key
 */
export function deleteSecureKey(key: string): void {
  store.delete(`secure.${key}`)
  store.delete(`insecure.${key}`)
  store.delete(key) // Also delete legacy plaintext
}

/**
 * Check if a key exists (in any storage location)
 */
export function hasSecureKey(key: string): boolean {
  return !!(
    store.get(`secure.${key}`) ||
    store.get(`insecure.${key}`) ||
    store.get(key)
  )
}

/**
 * Migrate existing plaintext keys to secure storage
 * Call this on app startup
 */
export async function migrateToSecureStorage(): Promise<{ migrated: string[]; failed: string[] }> {
  const migrated: string[] = []
  const failed: string[] = []

  for (const key of SECURE_KEYS) {
    // Check for plaintext value in legacy location
    const plaintextValue = store.get(key) as string | undefined
    
    if (plaintextValue) {
      // Check if already migrated
      const alreadySecure = store.get(`secure.${key}`)
      
      if (!alreadySecure) {
        try {
          storeSecureKey(key, plaintextValue)
          migrated.push(key)
          console.log(`Migrated ${key} to secure storage`)
        } catch (error) {
          console.error(`Failed to migrate ${key}:`, error)
          failed.push(key)
        }
      }
    }
  }

  return { migrated, failed }
}

/**
 * Get storage status for diagnostics
 */
export function getStorageStatus(): {
  secureAvailable: boolean
  keys: { [key: string]: 'secure' | 'insecure' | 'legacy' | 'none' }
} {
  const status: { [key: string]: 'secure' | 'insecure' | 'legacy' | 'none' } = {}

  for (const key of SECURE_KEYS) {
    if (store.get(`secure.${key}`)) {
      status[key] = 'secure'
    } else if (store.get(`insecure.${key}`)) {
      status[key] = 'insecure'
    } else if (store.get(key)) {
      status[key] = 'legacy'
    } else {
      status[key] = 'none'
    }
  }

  return {
    secureAvailable: safeStorage.isEncryptionAvailable(),
    keys: status,
  }
}

/**
 * Clear all stored keys (for logout/reset)
 */
export function clearAllKeys(): void {
  for (const key of SECURE_KEYS) {
    deleteSecureKey(key)
  }
}

export default {
  isSecureStorageAvailable,
  storeSecureKey,
  getSecureKey,
  deleteSecureKey,
  hasSecureKey,
  migrateToSecureStorage,
  getStorageStatus,
  clearAllKeys,
}
