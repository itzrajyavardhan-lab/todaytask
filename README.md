# MyApp - PocketBase + Frontend

## Backend (PocketBase)

PocketBase is a single-binary backend with embedded SQLite, auth, realtime, and file storage.

### Start the backend

```bash
npm run pb
```

Then open http://127.0.0.1:8090/_/

### First-time setup

```bash
npm run pb:admin
```

### Migrations

```bash
npm run pb:migrate
```

## Frontend Integration

The TypeScript SDK wrapper is available at `src/lib/pocketbase.ts` for easy integration with your frontend framework.

### Usage

```typescript
import pb, { getCurrentUser, isLoggedIn } from '@/lib/pocketbase'

// Check authentication status
if (isLoggedIn()) {
  const user = getCurrentUser()
  console.log('Logged in as:', user?.email)
}

// Fetch records from posts collection
const posts = await pb.collection('posts').getList(1, 50, {
  expand: 'author'
})

// Create a new post
const newPost = await pb.collection('posts').create({
  title: 'My Post',
  content: 'Post content here',
  author: getCurrentUser()?.id,
  published: false
})
```
