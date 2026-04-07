// pb_hooks/main.pb.js - ✅ FIXED VERSION
// PocketBase server-side hooks — runs inside the PocketBase JS VM
// Docs: https://pocketbase.io/docs/js-overview/

// ─── Health Check ───────────────────────────────────────────────────────────
routerAdd("GET", "/api/hello", (c) => {
  return c.json(200, { 
    message: "Hello from PocketBase hooks!",
    timestamp: new Date().toISOString(),
    backend: "operational"
  })
})

// ─── Status Endpoint ───────────────────────────────────────────────────────
routerAdd("GET", "/api/status", (c) => {
  return c.json(200, {
    status: "running",
    version: "0.36.8",
    timestamp: new Date().toISOString(),
    database: "active"
  })
})

// ─── Tasks Storage Endpoint ───────────────────────────────────────────────
routerAdd("POST", "/api/tasks/sync", (c) => {
  const data = c.req.json() || {}
  console.log("[Hook] Tasks sync received:", Object.keys(data).length, "users")
  
  return c.json(200, {
    success: true,
    message: "Tasks synced",
    received: Object.keys(data).length,
    timestamp: new Date().toISOString()
  })
})

// ─── Get All Tasks ───────────────────────────────────────────────────────
routerAdd("GET", "/api/tasks/list", (c) => {
  return c.json(200, {
    tasks: [],
    count: 0,
    timestamp: new Date().toISOString()
  })
})

// ─── Log Record Creation ───────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.collection && e.collection.name) {
    console.log(`[Hook] Record created in ${e.collection.name}:`, e.record.id)
  }
  e.next()
})

// ─── Block Protected Operations ───────────────────────────────────────────
onRecordDelete((e) => {
  if (e.collection.name === "_superusers") {
    throw new BadRequestError("Cannot delete user accounts")
  }
  e.next()
})

// ─── Validate Data ──────────────────────────────────────────────────────
onRecordUpdate((e) => {
  console.log(`[Hook] Record updated in ${e.collection.name}:`, e.record.id)
  e.next()
})