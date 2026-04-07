// TypeScript SDK wrapper for PocketBase
// Install with: npm install pocketbase @types/node

// @ts-ignore - will be available after npm install pocketbase
import PocketBase from 'pocketbase'

// @ts-ignore - process available in Node.js environment
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL ?? 'http://127.0.0.1:8090')
pb.autoCancellation(false)

export default pb

export interface PostRecord {
  id: string
  title: string
  content: string
  author: string
  published: boolean
  created: string
  updated: string
  expand?: {
    author?: UserRecord
  }
}

export interface UserRecord {
  id: string
  email: string
  name: string
  avatar: string
  created: string
  updated: string
}

export function getCurrentUser() {
  return pb.authStore.model as UserRecord | null
}

export function isLoggedIn() {
  return pb.authStore.isValid
}
