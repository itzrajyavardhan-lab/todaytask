// pb_hooks/main.pb.js
// PocketBase server-side hooks — runs inside the PocketBase JS VM
// Docs: https://pocketbase.io/docs/js-overview/

// ─── Example: Log every record create ───────────────────────────────────────
onRecordCreate((e) => {
  if (e.collection && e.collection.name) {
    console.log(`[hook] created: ${e.collection.name} / ${e.record.id}`)
  }
  e.next()
})

// ─── Example: Custom API route ───────────────────────────────────────────────
routerAdd("GET", "/api/hello", (c) => {
  return c.json(200, { message: "Hello from PocketBase hooks!" })
})

// ─── Example: Block delete on protected collections ──────────────────────────
onRecordDelete((e) => {
  if (e.collection.name === "users") {
    throw new BadRequestError("Cannot delete users via API")
  }
  e.next()
})