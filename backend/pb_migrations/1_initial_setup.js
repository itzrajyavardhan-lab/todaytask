// pb_migrations/1_initial_setup.js
migrate((app) => {

  // ── App settings ────────────────────────────────────────────────────────────
  let settings = app.settings()
  settings.meta.appName = "MyApp"                    // ← Claude: update from package.json name
  settings.meta.appURL  = "http://localhost:3000"
  settings.logs.maxDays = 7
  settings.logs.logAuthId = true
  settings.logs.logIP = false
  app.save(settings)

  // ── Posts collection (example — adjust to your app) ─────────────────────────
  let posts = new Collection({
    type: "base",
    name: "posts",
    listRule:   "@request.auth.id != ''",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "author = @request.auth.id",
    deleteRule: "author = @request.auth.id",
    fields: [
      {
        type: "text",
        name: "title",
        required: true,
        min: 1,
        max: 200,
      },
      {
        type: "editor",
        name: "content",
        required: false,
      },
      {
        type: "relation",
        name: "author",
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
        required: true,
        minSelect: 1,
        maxSelect: 1,
      },
      {
        type: "bool",
        name: "published",
        required: false,
      },
      {
        type: "autodate",
        name: "created",
        onCreate: true,
        onUpdate: false,
      },
      {
        type: "autodate",
        name: "updated",
        onCreate: true,
        onUpdate: true,
      },
    ],
    indexes: [
      "CREATE INDEX idx_posts_author ON posts (author)",
      "CREATE INDEX idx_posts_published ON posts (published)",
    ],
  })
  app.save(posts)

}, (app) => {
  // Rollback
  try { app.delete(app.findCollectionByNameOrId("posts")) } catch {}
})