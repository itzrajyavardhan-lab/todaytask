// Simple Express server with SQLite database for TODAY TASK
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Database setup
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Database error:', err);
    } else {
        console.log('Connected to in-memory SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password TEXT NOT NULL,
                fullName TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Users table error:', err);
            else console.log('✅ Users table created');
        });

        // Tasks table
        db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                sectionId TEXT NOT NULL,
                taskText TEXT NOT NULL,
                completed BOOLEAN DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Tasks table error:', err);
            else console.log('✅ Tasks table created');
        });

        // Sections table
        db.run(`
            CREATE TABLE IF NOT EXISTS sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                sectionId TEXT NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES users(id)
            )
        `, (err) => {
            if (err) console.error('Sections table error:', err);
            else console.log('✅ Sections table created');
        });
    });
}

// Routes

// ===== SIGNUP =====
app.post('/api/signup', (req, res) => {
    const { fullName, username, password } = req.body;

    if (!fullName || !username || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }

    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Error hashing password' });
        }

        const sql = 'INSERT INTO users (fullName, username, password) VALUES (?, ?, ?)';
        db.run(sql, [fullName, username, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            // Create default sections for new user
            const userId = this.lastID;
            const defaultSections = [
                { sectionId: 'default1', name: 'Study', icon: '📚' },
                { sectionId: 'default2', name: 'Coding', icon: '💻' },
                { sectionId: 'default3', name: 'Work', icon: '💼' }
            ];

            let completed = 0;
            defaultSections.forEach(section => {
                const sectionSql = 'INSERT INTO sections (userId, sectionId, name, icon) VALUES (?, ?, ?, ?)';
                db.run(sectionSql, [userId, section.sectionId, section.name, section.icon], (err) => {
                    if (err) console.error('Error creating default section:', err);
                    completed++;
                    
                    if (completed === defaultSections.length) {
                        res.status(201).json({
                            success: true,
                            message: 'Account created successfully',
                            userId: userId,
                            username: username,
                            fullName: fullName
                        });
                    }
                });
            });
        });
    });
});

// ===== SIGNIN =====
app.post('/api/signin', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Authentication error' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            res.status(200).json({
                success: true,
                message: 'Login successful',
                userId: user.id,
                username: user.username,
                fullName: user.fullName
            });
        });
    });
});

// ===== GET USER DATA =====
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;

    const userSql = 'SELECT id, username, fullName FROM users WHERE id = ?';
    db.get(userSql, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sectionsSql = 'SELECT * FROM sections WHERE userId = ?';
        db.all(sectionsSql, [userId], (err, sections) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                user: user,
                sections: sections || []
            });
        });
    });
});

// ===== ADD TASK =====
app.post('/api/task', (req, res) => {
    const { userId, sectionId, taskText } = req.body;

    if (!userId || !sectionId || !taskText) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = 'INSERT INTO tasks (userId, sectionId, taskText) VALUES (?, ?, ?)';
    db.run(sql, [userId, sectionId, taskText], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add task' });
        }

        res.status(201).json({
            success: true,
            taskId: this.lastID,
            message: 'Task added successfully'
        });
    });
});

// ===== GET TASKS =====
app.get('/api/tasks/:userId/:sectionId', (req, res) => {
    const { userId, sectionId } = req.params;

    const sql = 'SELECT * FROM tasks WHERE userId = ? AND sectionId = ?';
    db.all(sql, [userId, sectionId], (err, tasks) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ tasks: tasks || [] });
    });
});

// ===== ADD SECTION =====
app.post('/api/section', (req, res) => {
    const { userId, sectionId, name, icon } = req.body;

    if (!userId || !sectionId || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = 'INSERT INTO sections (userId, sectionId, name, icon) VALUES (?, ?, ?, ?)';
    db.run(sql, [userId, sectionId, name, icon || '📚'], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add section' });
        }

        res.status(201).json({
            success: true,
            sectionId: this.lastID,
            message: 'Section added successfully'
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 TODAY TASK Server running on http://localhost:${PORT}`);
    console.log('✅ Database initialized with users, tasks, and sections tables\n');
});

module.exports = app;
