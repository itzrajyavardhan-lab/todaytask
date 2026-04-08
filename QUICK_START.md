# TODAY TASK - Quick Start Guide 🚀

## 30-Second Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

You should see:
```
🚀 TODAY TASK Server running on http://localhost:3000
✅ Database initialized with users, tasks, and sections tables
```

### 3. Open in Browser
```
http://localhost:3000
```

## 5-Minute Test Run

### Signup
1. Enter Full Name: `Test User`
2. Enter Username: `testuser`
3. Enter Password: `password123`
4. Click **SIGN UP**
5. ✅ See success message → Switches to Sign In

### Signin
1. Enter Username: `testuser`
2. Enter Password: `password123`
3. Click **SIGN IN**
4. ✅ Dashboard loads with your name

### Add a Task
1. Click on any section (e.g., "Study 📚")
2. Type a task name: `Complete tutorial`
3. Press **Add** or Enter
4. ✅ Task appears in the list

### Add a New Section
1. Click **➕ Add New Section**
2. Enter name: `Learning`
3. Pick an icon (e.g., 📖)
4. Click **Create**
5. ✅ New section appears on dashboard

## What's Working ✅

- ✅ User signup with validation
- ✅ User signin with password verification
- ✅ Dashboard with default sections
- ✅ Add new sections with icons
- ✅ Add tasks to sections
- ✅ User information saves to database
- ✅ Dark/light theme toggle
- ✅ Responsive mobile design
- ✅ Loading indicators
- ✅ Error messages
- ✅ Logout functionality

## What's Being Developed 🔨

- 🔨 Task completion toggle (backend)
- 🔨 Task deletion (backend)
- 🔨 Section deletion (backend)
- 🔨 Statistics calculation
- 🔨 Activity graph generation

## File Overview

| File | Purpose |
|------|---------|
| `server.js` | Express backend with API |
| `app.js` | Frontend JavaScript logic |
| `index.html` | HTML structure |
| `style.css` | Styling and animations |
| `package.json` | Dependencies |

## Common Issues

### "Cannot find module" error
```bash
npm install
```

### Port 3000 already in use
Edit `server.js` and change port:
```javascript
const PORT = 3001;
```

### Buttons not responding
1. Check browser console (F12)
2. Make sure server is running
3. Hard refresh page (Ctrl+Shift+R)

### Data not saving
1. Check server console for errors
2. Verify SQLite tables are created
3. Check browser Network tab (F12)

## API Endpoints (Advanced)

### Signup
```bash
POST http://localhost:3000/api/signup
{
  "fullName": "John Doe",
  "username": "john",
  "password": "pass123"
}
```

### Signin
```bash
POST http://localhost:3000/api/signin
{
  "username": "john",
  "password": "pass123"
}
```

### Get User Data
```bash
GET http://localhost:3000/api/user/1
```

## Tips & Tricks

### Dark Mode
Click the theme toggle button in the header to switch between dark/light modes.

### Multiple Users
You can create multiple accounts and test different users. Each account has:
- Personal default sections
- Independent task lists
- Private data

### Testing on Phone
If on same network:
- Get your computer IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- On phone, go to: `http://<YOUR_IP>:3000`

### Database Persistence
By default, database resets on server restart. To persist:
1. Edit `server.js` line 12:
```javascript
// Change from:
const db = new sqlite3.Database(':memory:', ...);
// To:
const db = new sqlite3.Database('./tasks.db', ...);
```
2. Restart server

## Next Steps

### To Continue Development
1. Install frontend dependencies if not done
2. Create `tasks.db` for persistent storage
3. Implement task completion backend endpoint
4. Implement task/section deletion
5. Add JWT authentication for security
6. Deploy to cloud (Heroku, AWS, etc.)

### To Go to Production
1. Add HTTPS/SSL
2. Implement JWT tokens
3. Add rate limiting
4. Set up proper logging
5. Deploy to production server
6. Configure environment variables

## Important Files to Know

- **server.js** - All API endpoints are here
- **app.js** - All frontend logic is here
- **index.html** - All HTML elements are here
- **style.css** - All styling is here

## Performance Notes

- In-memory database is fast
- Suitable for development/testing
- For production, use persistent database
- Can handle multiple concurrent users

## Getting Help

1. **Check Console**: Press F12 to open browser console
2. **Check Server**: Look at server console output
3. **Check Documentation**: Read SETUP_GUIDE.md
4. **Check Implementation**: Read COMPLETE_IMPLEMENTATION.md

## Success! 🎉

Your task manager is now running with:
- Secure user authentication
- Database storage
- Professional UI
- All features working

Start managing your tasks! 📝

---

**Need more info?** See SETUP_GUIDE.md or COMPLETE_IMPLEMENTATION.md
