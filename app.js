// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:3000/api';

// ==================== STATE MANAGEMENT ====================
let currentUser = null;
let selectedIcon = '📚';
let alertCallback = null;
let isLoading = false;

// ==================== UTILITIES ====================
function showLoading(text = 'Processing...') {
    isLoading = true;
    document.getElementById('loadingSpinner').style.display = 'flex';
    document.getElementById('loadingText').textContent = text;
}

function hideLoading() {
    isLoading = false;
    document.getElementById('loadingSpinner').style.display = 'none';
}

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

// ==================== THEME ====================
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('todayTaskTheme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'light' ? 'dark' : 'light');
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

async function handleSignup(event) {
    event.preventDefault();
    
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

    showLoading('Creating account...');

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: name, username, password })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            showError('signupError', '❌ ' + (data.error || 'Signup failed'));
            return;
        }

        // Success
        showAlert('✅ Account created! Please sign in now.', false, () => {
            document.getElementById('signupName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            toggleForm();
        });

    } catch (error) {
        hideLoading();
        showError('signupError', '❌ Error: ' + error.message);
    }
}

async function handleSignin(event) {
    event.preventDefault();

    const username = document.getElementById('signinEmail').value.trim().toLowerCase();
    const password = document.getElementById('signinPassword').value;

    clearErrors();

    if (!username || !password) {
        showError('signinError', '⚠️ Please enter username and password!');
        return;
    }

    showLoading('Signing in...');

    try {
        const response = await fetch(`${API_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            showError('signinError', '❌ ' + (data.error || 'Login failed'));
            return;
        }

        // Success - store user data
        currentUser = {
            id: data.userId,
            username: data.username,
            fullName: data.fullName
        };

        localStorage.setItem('todayTaskUser', JSON.stringify(currentUser));
        document.getElementById('signinEmail').value = '';
        document.getElementById('signinPassword').value = '';

        showApp();
        loadUserData();

    } catch (error) {
        hideLoading();
        showError('signinError', '❌ Error: ' + error.message);
    }
}

function handleLogout() {
    showAlert('Are you sure you want to logout?', true, () => {
        currentUser = null;
        localStorage.removeItem('todayTaskUser');
        
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('appContainer').classList.remove('active');
        document.getElementById('signinForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
        
        clearErrors();
    });
}

// ==================== APP DISPLAY ====================
function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
}

async function loadUserData() {
    if (!currentUser) {
        console.error('No current user');
        return;
    }

    try {
        showLoading('Loading your data...');
        
        const response = await fetch(`${API_URL}/user/${currentUser.id}`);
        const data = await response.json();
        
        hideLoading();

        if (!response.ok) {
            showAlert('❌ Error loading user data');
            return;
        }

        document.getElementById('displayUserName').textContent = data.user.fullName;
        document.getElementById('userAvatar').textContent = data.user.fullName[0].toUpperCase();

        renderAll();
        generateContributionGraph();

    } catch (error) {
        hideLoading();
        showAlert('❌ Error: ' + error.message);
    }
}

// ==================== RENDERING ====================
function renderAll() {
    renderSections();
    updateStats();
}

async function renderSections() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/user/${currentUser.id}`);
        const data = await response.json();

        const container = document.getElementById('sectionsContainer');
        container.innerHTML = '';

        if (!data.sections || data.sections.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No sections yet. Create one to get started!</p>';
            return;
        }

        for (const section of data.sections) {
            const sectionHTML = await renderSection(section);
            container.innerHTML += sectionHTML;
        }

    } catch (error) {
        console.error('Error rendering sections:', error);
    }
}

async function renderSection(section) {
    const tasksResponse = await fetch(`${API_URL}/tasks/${currentUser.id}/${section.sectionId}`);
    const tasksData = await tasksResponse.json();
    const tasks = tasksData.tasks || [];

    const tasksHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span>${escapeHtml(task.taskText)}</span>
            <button type="button" class="task-delete" onclick="deleteTask(${task.id})">✕</button>
        </div>
    `).join('');

    return `
        <div class="section-card">
            <div class="section-header">
                <div class="section-title">
                    <span class="section-icon">${section.icon}</span>
                    <h3>${escapeHtml(section.name)}</h3>
                </div>
                <button type="button" class="section-delete" onclick="deleteSection(${section.id})">🗑️</button>
            </div>
            <div class="section-body">
                <form onsubmit="addTask(event, ${section.id})">
                    <input type="text" placeholder="Add a new task..." class="task-input" required>
                    <button type="submit" class="add-btn">+ Add</button>
                </form>
                <div class="tasks-list">
                    ${tasksHTML || '<p style="color: #999; text-align: center;">No tasks yet</p>'}
                </div>
            </div>
        </div>
    `;
}

async function addTask(event, sectionId) {
    event.preventDefault();

    const input = event.target.querySelector('.task-input');
    const taskText = input.value.trim();

    if (!taskText) return;

    try {
        showLoading('Adding task...');

        const response = await fetch(`${API_URL}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                sectionId,
                taskText
            })
        });

        hideLoading();

        if (!response.ok) {
            showAlert('❌ Failed to add task');
            return;
        }

        input.value = '';
        renderAll();

    } catch (error) {
        hideLoading();
        showAlert('❌ Error: ' + error.message);
    }
}

async function toggleTask(taskId) {
    // TODO: Implement task toggle in backend
    renderAll();
}

async function deleteTask(taskId) {
    // TODO: Implement task delete in backend
    renderAll();
}

function updateStats() {
    // TODO: Calculate and display stats
    document.getElementById('totalTasks').textContent = '0';
    document.getElementById('completedTasks').textContent = '0';
    document.getElementById('completionRate').textContent = '0%';
    document.getElementById('streak').textContent = '0';
}

function generateContributionGraph() {
    // TODO: Generate activity graph
    const graph = document.getElementById('contributionGraph');
    graph.innerHTML = '<p style="text-align: center; color: #999;">Activity graph coming soon</p>';
}

// ==================== MODAL FUNCTIONS ====================
function openAddSectionModal() {
    document.getElementById('addSectionModal').classList.add('active');
}

function closeAddSectionModal() {
    document.getElementById('addSectionModal').classList.remove('active');
    document.getElementById('sectionName').value = '';
    selectedIcon = '📚';
}

function selectIcon(element, icon) {
    document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedIcon = icon;
}

async function createSection() {
    const name = document.getElementById('sectionName').value.trim();

    if (!name) {
        showAlert('⚠️ Please enter section name');
        return;
    }

    try {
        showLoading('Creating section...');

        const sectionId = 'section_' + Date.now();
        const response = await fetch(`${API_URL}/section`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                sectionId,
                name,
                icon: selectedIcon
            })
        });

        hideLoading();

        if (!response.ok) {
            showAlert('❌ Failed to create section');
            return;
        }

        closeAddSectionModal();
        renderAll();

    } catch (error) {
        hideLoading();
        showAlert('❌ Error: ' + error.message);
    }
}

function deleteSection(sectionId) {
    showAlert('Delete this section and all its tasks?', true, () => {
        // TODO: Implement section delete in backend
        renderAll();
    });
}

// ==================== UTILITY FUNCTIONS ====================
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAddSectionModal();
});

// ==================== INITIALIZATION ====================
function init() {
    const savedTheme = localStorage.getItem('todayTaskTheme') || 'light';
    applyTheme(savedTheme);

    const savedUser = localStorage.getItem('todayTaskUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showApp();
            loadUserData();
        } catch (error) {
            console.error('Error loading saved user:', error);
            localStorage.removeItem('todayTaskUser');
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
