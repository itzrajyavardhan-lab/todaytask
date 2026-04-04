// Database
let users = JSON.parse(localStorage.getItem('todayTaskUsers')) || {};
let currentUser = null;
let selectedIcon = '📚';
let alertCallback = null;
let alertIsConfirm = false;

// ==================== CUSTOM ALERT/CONFIRM ====================

function showAlert(message, isConfirm = false, callback = null) {
    const modal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const confirmBtn = document.getElementById('alertConfirmBtn');
    const cancelBtn = document.getElementById('alertCancelBtn');

    alertMessage.textContent = message;
    alertCallback = callback;
    alertIsConfirm = isConfirm;

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
    const modal = document.getElementById('alertModal');
    modal.classList.remove('active');
    if (alertCallback) alertCallback();
}

function closeAlert() {
    const modal = document.getElementById('alertModal');
    modal.classList.remove('active');
}

// ==================== AUTH FUNCTIONS ====================

function toggleForm() {
    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');
    
    if (signupForm.style.display === 'none') {
        signupForm.style.display = 'block';
        signinForm.style.display = 'none';
    } else {
        signupForm.style.display = 'none';
        signinForm.style.display = 'block';
    }
}

function handleSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
        showAlert('Please fill all fields!');
        return;
    }

    if (users[email]) {
        showAlert('User already exists! Please sign in instead.');
        return;
    }

    if (password.length < 4) {
        showAlert('Password must be at least 4 characters!');
        return;
    }

    users[email] = {
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
    showAlert('Account created! Now sign in.', false, () => {
        toggleForm();
        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
    });
}

function handleSignin() {
    const email = document.getElementById('signinEmail').value.trim().toLowerCase();
    const password = document.getElementById('signinPassword').value;

    if (!email || !password) {
        showAlert('Please enter email and password!');
        return;
    }

    if (!users[email] || users[email].password !== password) {
        showAlert('Invalid email or password!');
        return;
    }

    currentUser = email;
    localStorage.setItem('todayTaskCurrentUser', email);
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
    });
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').classList.add('active');
}

function loadUserData() {
    const userData = users[currentUser];
    document.getElementById('displayUserName').textContent = userData.name;
    document.getElementById('userAvatar').textContent = userData.name[0].toUpperCase();
    renderAll();
    generateContributionGraph();
}

// ==================== TASK FUNCTIONS ====================

function addTask(e, sectionId) {
    e.preventDefault();
    const input = document.getElementById(`input-${sectionId}`);
    const text = input.value.trim();

    if (!text) return;

    const userData = users[currentUser];
    const section = userData.tasks[sectionId];
    const id = Date.now();
    
    section.tasks.push({ id, text, completed: false, date: new Date().toISOString() });
    input.value = '';

    saveUserData();
    renderSection(sectionId);
    generateContributionGraph();
}

function toggleTask(sectionId, taskId) {
    const userData = users[currentUser];
    const task = userData.tasks[sectionId].tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveUserData();
        renderSection(sectionId);
        generateContributionGraph();
    }
}

function deleteTask(sectionId, taskId) {
    const userData = users[currentUser];
    userData.tasks[sectionId].tasks = userData.tasks[sectionId].tasks.filter(t => t.id !== taskId);
    saveUserData();
    renderSection(sectionId);
    generateContributionGraph();
}

function renderSection(sectionId) {
    const userData = users[currentUser];
    const section = userData.tasks[sectionId];
    const container = document.getElementById(`tasks-${sectionId}`);
    const count = document.getElementById(`count-${sectionId}`);
    const taskList = section.tasks;

    if (!container) return;

    const completed = taskList.filter(t => t.completed).length;
    count.textContent = `${completed}/${taskList.length}`;

    if (taskList.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><p>No tasks yet</p></div>';
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
        const dateStr = date.toDateString();
        dailyStats[dateStr] = { completed: 0, total: 0 };
    }

    const todayStr = today.toDateString();
    let todayTotal = 0;
    let todayCompleted = 0;

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
            if (rate === 0) {
                level = 'none';
            } else if (rate < 0.33) {
                level = 'low';
            } else if (rate < 0.66) {
                level = 'medium';
            } else {
                level = 'high';
            }
        }

        const dateObj = new Date(date);
        const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="contribution-day ${level}">
                <div class="tooltip">${formatted} - ${stats.completed}/${stats.total}</div>
            </div>
        `;
    }).join('');
}

// ==================== SECTION FUNCTIONS ====================

function openAddSectionModal() {
    document.getElementById('addSectionModal').classList.add('active');
    document.getElementById('sectionName').value = '';
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    selectedIcon = '📚';
}

function closeAddSectionModal() {
    document.getElementById('addSectionModal').classList.remove('active');
}

function selectIcon(element, icon) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    selectedIcon = icon;
}

function createSection() {
    const name = document.getElementById('sectionName').value.trim();
    if (!name) {
        showAlert('Please enter a section name');
        return;
    }

    const userData = users[currentUser];
    const sectionId = 'section-' + Date.now();
    
    userData.tasks[sectionId] = { name, icon: selectedIcon, tasks: [] };
    userData.sections.push(sectionId);

    saveUserData();
    renderAll();
    generateContributionGraph();
    closeAddSectionModal();
}

function deleteSection(sectionId) {
    const userData = users[currentUser];
    const sectionName = userData.tasks[sectionId].name;
    
    showAlert(`Delete "${sectionName}" and all its tasks?`, true, () => {
        userData.sections = userData.sections.filter(s => s !== sectionId);
        delete userData.tasks[sectionId];

        saveUserData();
        renderAll();
        generateContributionGraph();
    });
}

// ==================== UTILITY FUNCTIONS ====================

function saveUserData() {
    localStorage.setItem('todayTaskUsers', JSON.stringify(users));
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('click', (e) => {
    const modal = document.getElementById('addSectionModal');
    if (e.target === modal) {
        closeAddSectionModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddSectionModal();
    }
    if (e.key === 'Enter' && document.getElementById('addSectionModal').classList.contains('active')) {
        createSection();
    }
});

// ==================== INITIALIZATION ====================

function init() {
    const savedUser = localStorage.getItem('todayTaskCurrentUser');
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        showApp();
        loadUserData();
    }
}

// Start the app
init();
