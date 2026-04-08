// ==================== DATABASE & API ====================
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let selectedIcon = '📚';
let alertCallback = null;
let users = {};

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

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        setTimeout(() => { if (el) el.textContent = ''; }, 3500);
    }
}

function clearErrors() {
    ['signupError', 'signinError'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

// ==================== FORM NAVIGATION ====================
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

// ==================== AUTH FUNCTIONS ====================
function handleSignup(e) {
    if (e) e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const username = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    clearErrors();

    if (!name || !username || !password) {
        showError('signupError', '⚠️ Please fill in all fields!');
        return;
    }

    if (username.length < 3) {
        showError('signupError', '⚠️ Username must be at least 3 characters!');
        return;
    }

    if (password.length < 4) {
        showError('signupError', '⚠️ Password must be at least 4 characters!');
        return;
    }

    if (users[username]) {
        showError('signupError', '❌ Username already taken! Try a different one.');
        return;
    }

    // Create user
    const userId = 'user_' + Date.now();
    users[username] = {
        userId,
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

    showAlert(`✅ Account created!\n\nYour User ID: ${userId}\n\nNow sign in.`, false, () => {
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        toggleForm();
    });
}

function handleSignin(e) {
    if (e) e.preventDefault();

    const username = document.getElementById('signinEmail').value.trim().toLowerCase();
    const password = document.getElementById('signinPassword').value;

    clearErrors();

    if (!username || !password) {
        showError('signinError', '⚠️ Please enter username and password!');
        return;
    }

    if (!users[username]) {
        showError('signinError', '❌ No account found. Sign up first!');
        return;
    }

    if (users[username].password !== password) {
        showError('signinError', '❌ Wrong password! Please try again.');
        return;
    }

    // Success
    currentUser = username;
    const userData = users[username];
    localStorage.setItem('todayTaskCurrentUser', username);
    
    // Show User ID
    showAlert(`✅ Welcome back!\n\nUser ID: ${userData.userId}\n\nLoading your tasks...`, false, () => {
        showApp();
        loadUserData();
    });
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

// ==================== APP DISPLAY ====================
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
        document.getElementById('userId').textContent = `ID: ${userData.userId}`;
        
        console.log('[TODAY TASK] User data loaded:', currentUser);
        renderAll();
        generateContributionGraph();
    } catch (error) {
        console.error('[TODAY TASK] loadUserData error:', error);
    }
}

// ==================== RENDERING ====================
function renderAll() {
    renderSections();
    updateStats();
}

function renderSections() {
    try {
        const userData = users[currentUser];
        if (!userData) return;

        const container = document.getElementById('sectionsContainer');
        container.innerHTML = '';

        userData.sections.forEach(sectionId => {
            const section = userData.tasks[sectionId];
            if (section) {
                container.innerHTML += renderSection(sectionId);
            }
        });
    } catch (error) {
        console.error('[TODAY TASK] renderSections error:', error);
    }
}

function renderSection(sectionId) {
    try {
        const userData = users[currentUser];
        const section = userData.tasks[sectionId];
        if (!section) return '';

        const tasksHTML = section.tasks.map((task, idx) => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask('${sectionId}', ${idx})">
                <span>${escapeHtml(task.text)}</span>
                <button type="button" class="task-delete" onclick="deleteTask('${sectionId}', ${idx})">✕</button>
            </div>
        `).join('');

        return `
            <div class="section-card">
                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">${section.icon}</span>
                        <h3>${escapeHtml(section.name)}</h3>
                    </div>
                    <button type="button" class="section-delete" onclick="deleteSection('${sectionId}')">🗑️</button>
                </div>
                <div class="section-body">
                    <form onsubmit="addTask(event, '${sectionId}')">
                        <input type="text" placeholder="Add a new task..." class="add-task-form" required>
                        <button type="submit" class="add-btn">+ Add</button>
                    </form>
                    <div class="tasks-list">
                        ${tasksHTML || '<p style="color: #999; text-align: center;">No tasks yet</p>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[TODAY TASK] renderSection error:', error);
        return '';
    }
}

function addTask(e, sectionId) {
    e.preventDefault();
    try {
        const input = e.target.querySelector('.add-task-form');
        const text = input.value.trim();
        if (!text) return;

        const userData = users[currentUser];
        if (!userData || !userData.tasks[sectionId]) {
            showAlert('Error: Section not found');
            return;
        }

        userData.tasks[sectionId].tasks.push({
            text,
            completed: false,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('todayTaskUsers', JSON.stringify(users));
        input.value = '';
        renderAll();
        generateContributionGraph();
    } catch (error) {
        console.error('[TODAY TASK] addTask error:', error);
    }
}

function toggleTask(sectionId, taskId) {
    try {
        const userData = users[currentUser];
        if (userData && userData.tasks[sectionId] && userData.tasks[sectionId].tasks[taskId]) {
            userData.tasks[sectionId].tasks[taskId].completed = !userData.tasks[sectionId].tasks[taskId].completed;
            localStorage.setItem('todayTaskUsers', JSON.stringify(users));
            renderAll();
            generateContributionGraph();
        }
    } catch (error) {
        console.error('[TODAY TASK] toggleTask error:', error);
    }
}

function deleteTask(sectionId, taskId) {
    try {
        const userData = users[currentUser];
        if (userData && userData.tasks[sectionId]) {
            userData.tasks[sectionId].tasks.splice(taskId, 1);
            localStorage.setItem('todayTaskUsers', JSON.stringify(users));
            renderAll();
            generateContributionGraph();
        }
    } catch (error) {
        console.error('[TODAY TASK] deleteTask error:', error);
    }
}

function updateStats() {
    try {
        const userData = users[currentUser];
        if (!userData) return;

        let totalTasks = 0, completedTasks = 0;

        userData.sections.forEach(sectionId => {
            const section = userData.tasks[sectionId];
            if (section && section.tasks) {
                totalTasks += section.tasks.length;
                completedTasks += section.tasks.filter(t => t.completed).length;
            }
        });

        const rate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('completionRate').textContent = rate + '%';
        document.getElementById('streak').textContent = '0';
    } catch (error) {
        console.error('[TODAY TASK] updateStats error:', error);
    }
}

function generateContributionGraph() {
    try {
        const today = new Date();
        let html = '';

        for (let i = 365; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dateStr = date.toISOString().split('T')[0];
            const color = 'rgba(134, 239, 172, 0.3)';

            html += `<div class="graph-box" style="background: ${color};" title="${dateStr}"></div>`;
        }

        document.getElementById('contributionGraph').innerHTML = html;
    } catch (error) {
        console.error('[TODAY TASK] generateContributionGraph error:', error);
    }
}

// ==================== MODAL FUNCTIONS ====================
function openAddSectionModal() {
    document.getElementById('addSectionModal').classList.add('active');
}

function closeAddSectionModal() {
    document.getElementById('addSectionModal').classList.remove('active');
    document.getElementById('sectionName').value = '';
    selectedIcon = '📚';
    document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
}

function selectIcon(element, icon) {
    document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedIcon = icon;
}

function createSection() {
    try {
        const name = document.getElementById('sectionName').value.trim();
        if (!name) {
            showAlert('⚠️ Please enter section name');
            return;
        }

        const userData = users[currentUser];
        const sectionId = 'section_' + Date.now();

        userData.tasks[sectionId] = {
            name,
            icon: selectedIcon,
            tasks: []
        };

        userData.sections.push(sectionId);
        localStorage.setItem('todayTaskUsers', JSON.stringify(users));

        console.log('[TODAY TASK] Section created:', sectionId, name);
        renderAll();
        generateContributionGraph();
        closeAddSectionModal();
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
            localStorage.setItem('todayTaskUsers', JSON.stringify(users));
            console.log('[TODAY TASK] Section deleted:', sectionId);
            renderAll();
            generateContributionGraph();
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
        showAlert('⚠️ Failed to save data!');
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

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const signupVisible = document.getElementById('signupForm').style.display !== 'none';
    const authVisible = document.getElementById('authContainer').style.display !== 'none';
    if (!authVisible) return;
    if (signupVisible) handleSignup();
    else handleSignin();
});

// ==================== INIT ====================
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

function init() {
    initUsers();
    
    const savedTheme = localStorage.getItem('todayTaskTheme') || 'light';
    applyTheme(savedTheme);

    const savedUser = localStorage.getItem('todayTaskCurrentUser');
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        showApp();
        loadUserData();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
