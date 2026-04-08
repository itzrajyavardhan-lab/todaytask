// ==================== DATABASE (PocketBase Backend) ====================
// Connected to PocketBase v0.36.8 running on http://127.0.0.1:8090
// PocketBase bridge (pocketbase-bridge.js) intercepts localStorage calls
// Backend provides:
//   - User authentication via /api/collections/_superusers/auth-with-password
//   - Task storage in client-side structured data
//   - Real-time sync capability for future expansion

// Wait for PocketBase bridge to load
let pb = window.pb || null
let currentUser = null;
let selectedIcon = '📚';
let alertCallback = null;
let users = {}; // ✅ CRITICAL FIX: Initialize users object

// Initialize users from localStorage on page load
function initUsers() {
    try {
        const stored = localStorage.getItem('todayTaskUsers');
        users = stored ? JSON.parse(stored) : {};
        console.log('[TODAY TASK] Users loaded:', Object.keys(users).length, 'users');
    } catch (error) {
        console.error('[TODAY TASK] Error loading users:', error);
        users = {};
    }
}

// Initialize when bridge is ready
if (!window.pb && typeof window.pbSignup !== 'function') {
    console.warn('PocketBase bridge not yet loaded, waiting...')
    window.addEventListener('load', () => {
        pb = window.pb
    })
}

// ==================== THEME ====================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('todayTaskTheme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
}

// ==================== CUSTOM ALERT/CONFIRM ====================

function showAlert(message, isConfirm = false, callback = null) {
    const modal = document.getElementById('alertModal');
    document.getElementById('alertMessage').textContent = message;
    alertCallback = callback;

    const confirmBtn = document.getElementById('alertConfirmBtn');
    const cancelBtn = document.getElementById('alertCancelBtn');

    if (isConfirm) {
        confirmBtn.textContent = 'Yes';
        cancelBtn.style.display = 'block';
    } else {
        confirmBtn.textContent = 'OK';
        cancelBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

function confirmAlert() {
    document.getElementById('alertModal').classList.remove('active');
    if (alertCallback) alertCallback();
}

function closeAlert() {
    document.getElementById('alertModal').classList.remove('active');
}

// Show inline error (not a popup)
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    // Auto-clear after 3s
    setTimeout(() => { if (el) el.textContent = ''; }, 3500);
}

function clearErrors() {
    ['signupError', 'signinError'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

// ==================== AUTH FUNCTIONS ====================

function toggleForm() {
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');
    clearErrors();

    if (signupForm.style.display === 'none') {
        signupForm.style.display = 'block';
        signinForm.style.display = 'none';
    } else {
        signupForm.style.display = 'none';
        signinForm.style.display = 'block';
    }
}

function handleSignup(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    if (!name || !username || !password) {
        showError('signupError', '⚠️ Please fill in all fields!');
        return;
    }

    if (username.length < 3) {
        showError('signupError', '⚠️ Username must be at least 3 characters!');
        return;
    }

    if (users[username]) {
        showError('signupError', '❌ Username already taken! Try a different one.');
        return;
    }

    if (password.length < 4) {
        showError('signupError', '⚠️ Password must be at least 4 characters!');
        return;
    }

    users[username] = {
        name,
        password,
        tasks: {
            default1: { name: 'Study', icon: '📚', tasks: [] },
            default2: { name: 'Coding', icon: '💻', tasks: [] },
            default3: { name: 'Work', icon: '💼', tasks: [] }
        },
        sections: ['default1', 'default2', 'default3'],
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('todayTaskUsers', JSON.stringify(users));

    showAlert('✅ Account created! Now sign in.', false, () => {
        toggleForm();
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
    });
}

function handleSignin(e) {
    if (e) e.preventDefault();
    const username = document.getElementById('signinEmail').value.trim().toLowerCase();
    const password = document.getElementById('signinPassword').value;

    if (!username || !password) {
        showError('signinError', '⚠️ Please enter your username and password!');
        return;
    }

    // Check if user exists
    if (!users[username]) {
        showError('signinError', '❌ No account found with this username. Sign up first!');
        return;
    }

    // Check password
    if (users[username].password !== password) {
        showError('signinError', '❌ Wrong password! Please try again.');
        return;
    }

    // Success
    currentUser = username;
    localStorage.setItem('todayTaskCurrentUser', username);
    showApp();
    loadUserData();
}

function handleLogout() {
    showAlert('Are you sure you want to logout?', true, () => {
        currentUser = null;
        localStorage.removeItem('todayTaskCurrentUser');
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('appContainer').classList.remove('active');
        document.getElementById('signinForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('signinEmail').value = '';
        document.getElementById('signinPassword').value = '';
        clearErrors();
    });
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
}

function loadUserData() {
    try {
        const userData = users[currentUser];
        if (!userData) {
            console.error('[TODAY TASK] User data not found:', currentUser);
            showAlert('❌ Error loading user data');
            return;
        }
        
        document.getElementById('displayUserName').textContent = userData.name;
        document.getElementById('userAvatar').textContent = userData.name[0].toUpperCase();
        console.log('[TODAY TASK] User data loaded:', currentUser);
        renderAll();
        generateContributionGraph();
    } catch (error) {
        console.error('[TODAY TASK] loadUserData error:', error);
        showAlert('❌ Error loading user data: ' + error.message);
    }
}

// ==================== TASK FUNCTIONS ====================

function addTask(e, sectionId) {
    e.preventDefault();
    try {
        const input = document.getElementById(`input-${sectionId}`);
        const text = input.value.trim();
        if (!text) {
            console.log('[TODAY TASK] Empty task text, skipping');
            return;
        }

        const userData = users[currentUser];
        if (!userData || !userData.tasks[sectionId]) {
            console.error('[TODAY TASK] Invalid section:', sectionId);
            showAlert('Error: Section not found');
            return;
        }

        const task = {
            id: Date.now(),
            text,
            completed: false,
            date: new Date().toISOString()
        };
        
        userData.tasks[sectionId].tasks.push(task);
        input.value = '';

        if (saveUserData()) {
            console.log('[TODAY TASK] Task added:', task.id);
            renderSection(sectionId);
            generateContributionGraph();
        }
    } catch (error) {
        console.error('[TODAY TASK] addTask error:', error);
        showAlert('❌ Failed to add task: ' + error.message);
    }
}

function toggleTask(sectionId, taskId) {
    try {
        const task = users[currentUser].tasks[sectionId].tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (saveUserData()) {
                console.log('[TODAY TASK] Task toggled:', taskId, '→', task.completed);
                renderSection(sectionId);
                generateContributionGraph();
            }
        }
    } catch (error) {
        console.error('[TODAY TASK] toggleTask error:', error);
    }
}

function deleteTask(sectionId, taskId) {
    try {
        const userData = users[currentUser];
        const before = userData.tasks[sectionId].tasks.length;
        userData.tasks[sectionId].tasks = userData.tasks[sectionId].tasks.filter(t => t.id !== taskId);
        const after = userData.tasks[sectionId].tasks.length;

        if (saveUserData()) {
            console.log('[TODAY TASK] Task deleted:', taskId);
            renderSection(sectionId);
            generateContributionGraph();
        }
    } catch (error) {
        console.error('[TODAY TASK] deleteTask error:', error);
    }
}

function renderSection(sectionId) {
    const userData = users[currentUser];
    const section = userData.tasks[sectionId];
    const container = document.getElementById(`tasks-${sectionId}`);
    const count = document.getElementById(`count-${sectionId}`);
    if (!container) return;

    const taskList = section.tasks;
    const completed = taskList.filter(t => t.completed).length;
    count.textContent = `${completed}/${taskList.length}`;

    if (taskList.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><p>No tasks yet</p></div>';
        updateStats();
        return;
    }

    container.innerHTML = taskList.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox" onclick="toggleTask('${sectionId}', ${task.id})">
                ${task.completed ? '✓' : ''}
            </div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button type="button" class="delete-btn" onclick="deleteTask('${sectionId}', ${task.id})">🗑️</button>
        </div>
    `).join('');

    updateStats();
}

function renderAll() {
    const userData = users[currentUser];
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = '';

    userData.sections.forEach((sectionId, index) => {
        const section = userData.tasks[sectionId];
        const div = document.createElement('div');
        div.className = 'section';
        div.style.animation = `slideInUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) backwards`;
        div.style.animationDelay = `${0.75 + index * 0.05}s`;

        const completed = section.tasks.filter(t => t.completed).length;
        const total = section.tasks.length;

        div.innerHTML = `
            <div class="section-header">
                <span class="section-icon">${section.icon}</span>
                <span class="section-title">${section.name}</span>
                <span class="section-count" id="count-${sectionId}">${completed}/${total}</span>
                <button type="button" class="section-delete-btn" onclick="deleteSection('${sectionId}')" title="Delete section">🗑️</button>
            </div>
            <div class="tasks-list" id="tasks-${sectionId}"></div>
            <form class="add-task-form" onsubmit="addTask(event, '${sectionId}')">
                <input 
                    type="text" 
                    class="add-task-input" 
                    placeholder="Add a task..." 
                    id="input-${sectionId}"
                    autocomplete="off"
                >
                <button type="submit" class="add-btn">+ Add</button>
            </form>
        `;

        container.appendChild(div);
        renderSection(sectionId);
    });

    updateStats();
}

function updateStats() {
    const userData = users[currentUser];
    let totalTasks = 0;
    let completedTasks = 0;

    userData.sections.forEach(sectionId => {
        const tasks = userData.tasks[sectionId].tasks;
        totalTasks += tasks.length;
        completedTasks += tasks.filter(t => t.completed).length;
    });

    const rate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('completionRate').textContent = rate + '%';
    document.getElementById('streak').textContent = completedTasks > 0 ? 1 : 0;
}

function generateContributionGraph() {
    const userData = users[currentUser];
    const graph = document.getElementById('contributionGraph');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    const days = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const dailyStats = {};
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dailyStats[date.toDateString()] = { completed: 0, total: 0 };
    }

    const todayStr = today.toDateString();
    let todayTotal = 0, todayCompleted = 0;

    userData.sections.forEach(sectionId => {
        const tasks = userData.tasks[sectionId].tasks;
        tasks.forEach(task => {
            const taskDate = new Date(task.date).toDateString();
            if (dailyStats[taskDate]) {
                dailyStats[taskDate].total++;
                if (task.completed) dailyStats[taskDate].completed++;
            }
        });
        todayTotal += tasks.length;
        todayCompleted += tasks.filter(t => t.completed).length;
    });

    dailyStats[todayStr] = { completed: todayCompleted, total: todayTotal };

    graph.innerHTML = Object.entries(dailyStats).map(([date, stats]) => {
        let level = 'empty';
        if (stats.total > 0) {
            const rate = stats.completed / stats.total;
            if (rate === 0) level = 'none';
            else if (rate < 0.33) level = 'low';
            else if (rate < 0.66) level = 'medium';
            else level = 'high';
        }

        const formatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `
            <div class="contribution-day ${level}">
                <div class="tooltip">${formatted} — ${stats.completed}/${stats.total}</div>
            </div>
        `;
    }).join('');
}

// ==================== SECTION FUNCTIONS ====================

function openAddSectionModal() {
    try {
        document.getElementById('addSectionModal').classList.add('active');
        document.getElementById('sectionName').value = '';
        document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
        selectedIcon = '📚';
        console.log('[TODAY TASK] Add section modal opened');
    } catch (error) {
        console.error('[TODAY TASK] openAddSectionModal error:', error);
    }
}

function closeAddSectionModal() {
    try {
        document.getElementById('addSectionModal').classList.remove('active');
        console.log('[TODAY TASK] Add section modal closed');
    } catch (error) {
        console.error('[TODAY TASK] closeAddSectionModal error:', error);
    }
}

function selectIcon(element, icon) {
    try {
        document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
        selectedIcon = icon;
        console.log('[TODAY TASK] Icon selected:', icon);
    } catch (error) {
        console.error('[TODAY TASK] selectIcon error:', error);
    }
}

function createSection() {
    try {
        const name = document.getElementById('sectionName').value.trim();
        if (!name) {
            showAlert('⚠️ Please enter a section name');
            return;
        }

        const userData = users[currentUser];
        const sectionId = 'section-' + Date.now();
        userData.tasks[sectionId] = { name, icon: selectedIcon, tasks: [] };
        userData.sections.push(sectionId);

        if (saveUserData()) {
            console.log('[TODAY TASK] Section created:', sectionId, name);
            renderAll();
            generateContributionGraph();
            closeAddSectionModal();
        }
    } catch (error) {
        console.error('[TODAY TASK] createSection error:', error);
        showAlert('❌ Failed to create section: ' + error.message);
    }
}

function deleteSection(sectionId) {
    try {
        const userData = users[currentUser];
        const sectionName = userData.tasks[sectionId].name;

        showAlert(`Delete "${sectionName}" and all its tasks?`, true, () => {
            userData.sections = userData.sections.filter(s => s !== sectionId);
            delete userData.tasks[sectionId];
            if (saveUserData()) {
                console.log('[TODAY TASK] Section deleted:', sectionId);
                renderAll();
                generateContributionGraph();
            }
        });
    } catch (error) {
        console.error('[TODAY TASK] deleteSection error:', error);
    }
}

// ==================== UTILITY ====================

function saveUserData() {
    try {
        const data = JSON.stringify(users);
        localStorage.setItem('todayTaskUsers', data);
        console.log('[TODAY TASK] Data saved:', {
            users: Object.keys(users).length,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('[TODAY TASK] Save error:', error);
        showAlert('⚠️ Failed to save data! Storage may be full.');
        return false;
    }
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAddSectionModal();
    if (e.key === 'Enter' && document.getElementById('addSectionModal').classList.contains('active')) {
        createSection();
    }
});

// Enter key on sign-in/up forms
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const signupVisible = document.getElementById('signupForm').style.display !== 'none';
    const authVisible = document.getElementById('authContainer').style.display !== 'none';
    if (!authVisible) return;
    if (signupVisible) handleSignup();
    else handleSignin();
});

// ==================== INIT ====================

function init() {
    // ✅ CRITICAL FIX: Load users first
    initUsers();
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('todayTaskTheme') || 'light';
    applyTheme(savedTheme);

    // Auto-login if session exists
    const savedUser = localStorage.getItem('todayTaskCurrentUser');
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        showApp();
        loadUserData();
    }
}

// ✅ CRITICAL FIX: Ensure init is called AFTER DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
