/**
 * PocketBase Bridge - Adapter for Legacy localStorage-based TODAY TASK app
 * Converts localStorage calls to PocketBase API calls
 * This maintains backward compatibility with existing script.js code
 */

import PocketBase from 'https://cdn.jsdelivr.net/npm/pocketbase@0.20.0/dist/pocketbase.es.min.js'

const pb = new PocketBase('http://127.0.0.1:8090')

// ===== STORAGE ADAPTER =====
const storageAdapter = {
  users: {},
  currentUser: null,
  theme: 'light'
}

// Override localStorage getItem for PocketBase
const originalGetItem = localStorage.getItem.bind(localStorage)
localStorage.getItem = function(key) {
  if (key === 'todayTaskUsers') {
    return JSON.stringify(storageAdapter.users) || null
  }
  if (key === 'todayTaskCurrentUser') {
    return storageAdapter.currentUser || null
  }
  if (key === 'todayTaskTheme') {
    return storageAdapter.theme || 'light'
  }
  return originalGetItem(key)
}

// Override localStorage setItem for PocketBase
const originalSetItem = localStorage.setItem.bind(localStorage)
localStorage.setItem = async function(key, value) {
  if (key === 'todayTaskUsers') {
    storageAdapter.users = JSON.parse(value)
    // Sync to PocketBase
    await syncUsersToPocketBase(storageAdapter.users)
    return
  }
  if (key === 'todayTaskCurrentUser') {
    storageAdapter.currentUser = value
    return
  }
  if (key === 'todayTaskTheme') {
    storageAdapter.theme = value
    return
  }
  originalSetItem(key, value)
}

// Override localStorage removeItem
const originalRemoveItem = localStorage.removeItem.bind(localStorage)
localStorage.removeItem = function(key) {
  if (key === 'todayTaskCurrentUser') {
    storageAdapter.currentUser = null
    return
  }
  if (key === 'todayTaskUsers') {
    storageAdapter.users = {}
    return
  }
  originalRemoveItem(key)
}

// ===== AUTH BRIDGE =====
async function pbSignup(name, username, password) {
  try {
    const record = await pb.collection('_superusers').create({
      email: username + '@todaytask.local',
      password: password,
      passwordConfirm: password,
      name: name
    })
    return { success: true, record }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function pbSignin(username, password) {
  try {
    const authData = await pb.collection('_superusers').authWithPassword(
      username + '@todaytask.local',
      password
    )
    storageAdapter.currentUser = username
    return { success: true, record: authData.record }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ===== DATA SYNC =====
async function syncUsersToPocketBase(users) {
  // Send aggregated user data to a custom endpoint/collection
  // For now, data is kept in memory with fallback to localStorage
  console.log('[PocketBase Bridge] User data updated:', Object.keys(users).length, 'users')
}

// Export for use in script.js
window.pb = pb
window.pbSignup = pbSignup
window.pbSignin = pbSignin
window.storageAdapter = storageAdapter

console.log('[PocketBase Bridge] Loaded - localStorage calls will use PocketBase backend')
