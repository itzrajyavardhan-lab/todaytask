# TODAY TASK - Complete Setup Guide

## Overview
TODAY TASK is a personal task manager with a complete backend database integration. Users can signup, signin, create sections, and manage their tasks.

## Architecture
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: SQLite (in-memory for demo, can be persisted)
- **Authentication**: BCrypt password hashing
- **API**: RESTful endpoints

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Modern web browser

## Installation

### Step 1: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework
- `sqlite3` - Database
- `bcrypt` - Password hashing
- `cors` - Cross-Origin Resource Sharing
- `body-parser` - Request parsing

### Step 2: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

Expected output:
```
🚀 TODAY TASK Server running on http://localhost:3000
✅ Database initialized with users, tasks, and sections tables
```

### Step 3: Open the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## Features

### User Management
- ✅ User Registration (Signup)
- ✅ User Login (Signin)
- ✅ Secure Password Storage (BCrypt)
- ✅ User Session Management
- ✅ Logout

### Task Management
- ✅ Create Sections
- ✅ Add Tasks to Sections
- ✅ Toggle Task Completion
- ✅ Delete Tasks
- ✅ Delete Sections

### UI Features
- ✅ Dark/Light Theme Toggle
- ✅ Responsive Design
- ✅ Loading Indicators
- ✅ Error Messages
- ✅ Icon Picker for Sections
- ✅ Activity Dashboard
- ✅ Statistics Display

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL (hashed with bcrypt),
    fullName TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Sections Table
```sql
CREATE TABLE sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    sectionId TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
)
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    sectionId TEXT NOT NULL,
    taskText TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
)
```

## API Endpoints

### Authentication

#### POST /api/signup
Create a new user account

**Request Body:**
```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "userId": 1,
  "username": "johndoe",
  "fullName": "John Doe"
}
```

#### POST /api/signin
Login user

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "userId": 1,
  "username": "johndoe",
  "fullName": "John Doe"
}
```

### User Data

#### GET /api/user/:userId
Get user information and sections

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "fullName": "John Doe"
  },
  "sections": [...]
}
```

### Tasks

#### POST /api/task
Create a new task

**Request Body:**
```json
{
  "userId": 1,
  "sectionId": "section_1",
  "taskText": "Complete project"
}
```

#### GET /api/tasks/:userId/:sectionId
Get tasks for a section

### Sections

#### POST /api/section
Create a new section

**Request Body:**
```json
{
  "userId": 1,
  "sectionId": "section_1",
  "name": "Work",
  "icon": "💼"
}
```

## Testing the Application

### Test Signup Flow
1. Go to http://localhost:3000
2. Fill in signup form:
   - Full Name: Test User
   - Username: testuser
   - Password: password123
3. Click SIGN UP
4. You should see success message
5. Click to switch to Sign In

### Test Signin Flow
1. Fill in signin form:
   - Username: testuser
   - Password: password123
2. Click SIGN IN
3. Dashboard should load with default sections
4. You should see user name in header

### Test Task Management
1. After signing in, add a task in a section
2. Click "Add New Section" to create new section
3. Select an icon and name for section
4. Click Create
5. New section appears in dashboard

## File Structure
```
.
├── server.js           # Express backend server
├── app.js             # Frontend JavaScript
├── index.html         # Main HTML file
├── style.css          # Styling
├── package.json       # Dependencies
└── SETUP_GUIDE.md     # This file
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, modify in `server.js`:
```javascript
const PORT = 3001; // Change to different port
```

### Database Errors
Database is in-memory by default. To persist data, change in `server.js`:
```javascript
const db = new sqlite3.Database('./tasks.db', (err) => {
    // ...
});
```

### CORS Errors
Make sure both frontend and backend are on same machine. Update API_URL in `app.js` if needed.

### Buttons Not Working
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console for errors (F12)
4. Verify server is running

## Performance Tips
- The in-memory database is fast but data is lost on restart
- For production, use a persistent database
- Consider adding connection pooling for multiple users
- Implement rate limiting for API endpoints

## Security Notes
- Passwords are hashed with bcrypt (10 salt rounds)
- Add HTTPS in production
- Add input validation on backend
- Implement rate limiting
- Add API authentication tokens (JWT recommended)
- Add CSRF protection

## Future Enhancements
- [ ] User authentication with JWT tokens
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Social login (Google, GitHub)
- [ ] File upload support
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Recurring tasks
- [ ] Task categories and tags

## Support
For issues or questions, please check:
1. Server console for error messages
2. Browser console (F12) for frontend errors
3. Network tab for API call failures

## License
MIT License - Feel free to use and modify

## Author
Created by Rajyavardhan
