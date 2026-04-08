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
    
    // Trigger animation on all toggle buttons
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.style.animation = 'none';
        setTimeout(() => {
            btn.style.animation = 'toggleSpin 0.6s ease';
        }, 10);
    });
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
        taskStats: {}, // Track tasks by date
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
    renderWeeklyStats();
    renderMiniWeekly();
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
    } catch (error) {
        console.error('[TODAY TASK] addTask error:', error);
    }
}

function toggleTask(sectionId, taskId) {
    try {
        const userData = users[currentUser];
        if (userData && userData.tasks[sectionId] && userData.tasks[sectionId].tasks[taskId]) {
            const task = userData.tasks[sectionId].tasks[taskId];
            task.completed = !task.completed;

            const today = new Date().toISOString().split('T')[0];
            userData.taskStats = userData.taskStats || {};
            userData.completedStats = userData.completedStats || {};
            
            if (task.completed) {
                // Track completion only on COMPLETE
                userData.completedStats[today] = (userData.completedStats[today] || 0) + 1;
                
                // Add to history
                userData.history = userData.history || [];
                userData.history.push({
                    date: new Date().toISOString(),
                    text: task.text,
                    section: userData.tasks[sectionId].name,
                    status: 'completed'
                });
            } else if (userData.completedStats[today]) {
                userData.completedStats[today] = Math.max(0, userData.completedStats[today] - 1);
            }

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
        const userData = users[currentUser];
        if (!userData) return;

        const today = new Date();
        const completedStats = userData.completedStats || {};
        let html = '';

        for (let i = 365; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            const dateStr = date.toISOString().split('T')[0];
            const count = completedStats[dateStr] || 0;
            
            // Only show color if tasks are COMPLETED
            let level = 'level-0';
            if (count > 0) level = 'level-1';
            if (count > 2) level = 'level-2';
            if (count > 4) level = 'level-3';
            if (count > 6) level = 'level-4';

            html += `<div class="graph-box ${level}" title="${dateStr}: ${count} completed"></div>`;
        }

        document.getElementById('contributionGraph').innerHTML = html;
    } catch (error) {
        console.error('[TODAY TASK] generateContributionGraph error:', error);
    }
}

// ==================== WEEKLY STATS & HISTORY ====================
function getWeeklyStats() {
    try {
        const userData = users[currentUser];
        if (!userData) return [];

        const completedStats = userData.completedStats || {};
        const weeklyData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const day = date.toLocaleString('en-US', { weekday: 'short' });
            const count = completedStats[dateStr] || 0;
            
            weeklyData.push({
                date: dateStr,
                day: day,
                completed: count
            });
        }
        
        return weeklyData;
    } catch (error) {
        console.error('[TODAY TASK] getWeeklyStats error:', error);
        return [];
    }
}

function renderWeeklyStats() {
    try {
        const weeklyData = getWeeklyStats();
        let html = '<div class="weekly-stats">';
        
        weeklyData.forEach(day => {
            const barHeight = Math.min(day.completed * 15, 80);
            html += `
                <div class="weekly-bar">
                    <div class="bar-fill" style="height: ${barHeight}px; background: #22c55e;"></div>
                    <div class="bar-label">${day.day}</div>
                    <div class="bar-count">${day.completed}</div>
                </div>
            `;
        });
        
        html += '</div>';
        const container = document.getElementById('weeklyStatsContainer');
        if (container) container.innerHTML = html;
    } catch (error) {
        console.error('[TODAY TASK] renderWeeklyStats error:', error);
    }
}

function renderMiniWeekly() {
    try {
        const weeklyData = getWeeklyStats();
        const miniBars = document.getElementById('miniBars');
        if (!miniBars) return;
        miniBars.innerHTML = '';
        weeklyData.forEach(d => {
            const h = Math.max(6, Math.min(d.completed * 6 + 6, 28));
            const div = document.createElement('div');
            div.className = 'mini-bar';
            div.style.height = h + 'px';
            div.title = `${d.day} ${d.date}: ${d.completed} completed`;
            miniBars.appendChild(div);
        });
    } catch (error) {
        console.error('[TODAY TASK] renderMiniWeekly error:', error);
    }
}

function openWeekModal() {
    try {
        const modalId = 'historyModal'; // reuse history modal for week view
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // build week overview
        const weeklyData = getWeeklyStats();
        let html = '<div style="padding:12px;">';
        html += '<h3>Week Overview</h3>';

        // progress: completed / tasks created in week
        let completedSum = weeklyData.reduce((s, x) => s + x.completed, 0);
        // count tasks created in week
        let createdSum = 0;
        weeklyData.forEach(d => {
            // count tasks created that day
            users[currentUser].sections.forEach(secId => {
                const sec = users[currentUser].tasks[secId];
                if (!sec) return;
                sec.tasks.forEach(t => {
                    const createdDate = (t.createdAt || '').split('T')[0];
                    if (createdDate === d.date) createdSum++;
                });
            });
        });

        const progress = createdSum === 0 ? 0 : Math.round((completedSum / createdSum) * 100);
        html += `<div style="margin:8px 0;">Week Progress: <b>${progress}%</b></div>`;
        html += `<div style="height:12px;background:rgba(0,0,0,0.06);border-radius:8px;overflow:hidden;margin-bottom:12px;">
                    <div style="width:${progress}%;height:100%;background:#22c55e"></div></div>`;

        // daily bars
        html += '<div style="display:flex;gap:8px;align-items:end;height:160px;">
        ';
        weeklyData.forEach(d => {
            const h = Math.min(d.completed * 18, 140);
            html += `<div style="flex:1;text-align:center;">
                        <div style="height:${h}px;margin:6px auto;width:40px;background:#22c55e;border-radius:6px;box-shadow:0 4px 10px rgba(34,197,94,0.15);"></div>
                        <div style="margin-top:6px;font-size:0.85rem">${d.day}</div>
                        <div style="font-weight:700">${d.completed}</div>
                    </div>`;
        });
        html += '</div>';

        html += '</div>';

        document.getElementById('historyContent').innerHTML = html;
        modal.classList.add('active');
    } catch (error) {
        console.error('[TODAY TASK] openWeekModal error:', error);
    }
}

function closeWeekModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('active');
}

function openHistory(dateStr = null) {
    try {
        const userData = users[currentUser];
        const history = userData.history || [];

        // Build header with date picker
        const today = new Date();
        const isoToday = today.toISOString().split('T')[0];
        const selected = dateStr || isoToday;

        const headerHtml = `
            <div style="display:flex;gap:8px;align-items:center;padding:12px;">
                <label style="font-weight:600;">Select date:</label>
                <input type="date" id="historyDatePicker" value="${selected}" style="padding:6px;border-radius:6px;border:1px solid var(--border-primary);">
                <button type="button" class="history-btn" id="historyDateBtn" style="margin-left:8px;">Show</button>
            </div>
            <div id="historyBody"></div>
        `;

        const modal = document.getElementById('historyModal');
        if (!modal) return;
        document.getElementById('historyContent').innerHTML = headerHtml;
        modal.classList.add('active');

        // Attach listeners
        document.getElementById('historyDateBtn').addEventListener('click', () => {
            const val = document.getElementById('historyDatePicker').value;
            renderHistoryForDate(val);
        });

        // initial render
        renderHistoryForDate(selected);

    } catch (error) {
        console.error('[TODAY TASK] openHistory error:', error);
        showAlert('Error loading history');
    }
}

function renderHistoryForDate(dateStr) {
    try {
        const userData = users[currentUser];
        if (!userData) return;

        // Completed on that date
        const completed = (userData.history || []).filter(h => h.date.startsWith(dateStr));

        // Tasks created on that date
        const tasksOnDate = [];
        userData.sections.forEach(secId => {
            const sec = userData.tasks[secId];
            if (!sec) return;
            sec.tasks.forEach(t => {
                const createdDate = (t.createdAt || '').split('T')[0];
                if (createdDate === dateStr) {
                    tasksOnDate.push({ text: t.text, completed: !!t.completed, section: sec.name });
                }
            });
        });

        const completedCount = completed.length;
        const createdCount = tasksOnDate.length;
        const incompleteCount = tasksOnDate.filter(t => !t.completed).length;

        // Build body HTML: summary + mini bar graph + list
        let body = `
            <div style="padding:12px;display:flex;gap:16px;flex-direction:column;">
                <div style="display:flex;gap:12px;align-items:center;">
                    <div style="font-weight:700;font-size:1rem;">${dateStr}</div>
                    <div style="background:#eef6ed;padding:8px;border-radius:8px;">Completed: <b style="color:#116530">${completedCount}</b></div>
                    <div style="background:#fff4f4;padding:8px;border-radius:8px;">Incomplete: <b style="color:#b91c1c">${incompleteCount}</b></div>
                </div>

                <div style="display:flex;gap:12px;align-items:end;height:120px;padding-top:8px;">
                    <div style="flex:1;text-align:center;">Completed<br><div style="height: ${Math.min(completedCount*18,120)}px; background:#22c55e; width:40px; margin:6px auto;border-radius:6px; box-shadow:0 4px 10px rgba(34,197,94,0.2);"></div><div>${completedCount}</div></div>
                    <div style="flex:1;text-align:center;">Incomplete<br><div style="height: ${Math.min(incompleteCount*18,120)}px; background:#ef4444; width:40px; margin:6px auto;border-radius:6px; box-shadow:0 4px 10px rgba(239,68,68,0.15);"></div><div>${incompleteCount}</div></div>
                </div>

                <div style="margin-top:8px;">
                    <h3 style="margin:8px 0;">Completed Tasks</h3>
                    <div>
        `;

        if (completedCount === 0) body += '<p style="opacity:0.7;">No completed tasks on this date.</p>';
        else {
            const recentComp = completed.slice().reverse();
            recentComp.forEach(entry => {
                const timeStr = new Date(entry.date).toLocaleTimeString();
                body += `<div style="padding:8px;border-bottom:1px solid var(--border-primary);">${escapeHtml(entry.text)} <span style="float:right;opacity:0.7">${escapeHtml(entry.section)} • ${timeStr}</span></div>`;
            });
        }

        body += '</div>';

        body += '<h3 style="margin:8px 0;">Tasks Created That Day</h3>';
        if (tasksOnDate.length === 0) body += '<p style="opacity:0.7;">No tasks created on this date.</p>';
        else {
            tasksOnDate.forEach(t => {
                body += `<div style="padding:8px;border-bottom:1px solid var(--border-primary);">${escapeHtml(t.text)} <span style="float:right;opacity:0.7">${escapeHtml(t.section)} • ${t.completed ? '<b style="color:#116530">Completed</b>' : '<b style="color:#b91c1c">Incomplete</b>'}</span></div>`;
            });
        }

        body += '</div>';

        document.getElementById('historyBody').innerHTML = body;

    } catch (error) {
        console.error('[TODAY TASK] renderHistoryForDate error:', error);
    }
}

function closeHistory() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('active');
}
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
