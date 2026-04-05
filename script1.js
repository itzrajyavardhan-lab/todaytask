// ==================== DATABASE (localStorage) ====================
// All data is stored in your browser's localStorage.
// To VIEW data: open DevTools → Application → Local Storage → your site URL
// Keys used:
//   "todayTaskUsers"       → all user accounts (name, password, tasks)
//   "todayTaskCurrentUser" → currently logged-in username
//   "todayTaskTheme"       → "light" or "dark"

let users = JSON.parse(localStorage.getItem('todayTaskUsers')) || {};
let currentUser = null;
let selectedIcon = '📚';
let alertCallback = null;

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

function handleSignup() {
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

function handleSignin() {
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
    userData.tasks[sectionId].tasks.push({
        id: Date.now(),
        text,
        completed: false,
        date: new Date().toISOString()
    });
    input.value = '';

    saveUserData();
    renderSection(sectionId);
    generateContributionGraph();
}

function toggleTask(sectionId, taskId) {
    const task = users[currentUser].tasks[sectionId].tasks.find(t => t.id === taskId);
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

// ==================== UTILITY ====================

function saveUserData() {
    localStorage.setItem('todayTaskUsers', JSON.stringify(users));
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ══════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════
function openHistory(){
  document.getElementById('histPanel').classList.add('on');
  document.getElementById('histDetail').classList.remove('on');
  document.getElementById('histList').style.display='block';
  buildHistoryList();
}
function closeHistory(){
  document.getElementById('histPanel').classList.remove('on');
}

function buildHistoryList(){
  const u=DB[CU]; const tk=todayKey();
  const dates=Object.keys(u.days).filter(k=>k!==tk).sort((a,b)=>b.localeCompare(a));
  const empty=document.getElementById('histEmpty');
  const datesEl=document.getElementById('histDates');
  if(dates.length===0){ empty.style.display='block'; datesEl.innerHTML=''; return; }
  empty.style.display='none';
  datesEl.innerHTML=dates.map(k=>{
    let tot=0,done=0;
    u.order.forEach(sid=>{ const ts=u.days[k]?.[sid]||[]; tot+=ts.length; done+=ts.filter(t=>t.done).length; });
    const pct=tot===0?0:Math.round(done/tot*100);
    const lv=tot===0?0:(pct===100?4:pct>=67?3:pct>=34?2:pct>0?2:1);
    return `<div class="hdc" onclick="openDayDetail('${k}')">
      <div class="hdot l${lv}"></div>
      <div class="hd-info">
        <div class="hd-title">${fmtLong(k)}</div>
        <div class="hd-sub">${done}/${tot} tasks complete · ${pct}%</div>
      </div>
      <div class="harrow">→</div>
    </div>`;
  }).join('');
}

function openDayDetail(k){
  document.getElementById('histList').style.display='none';
  const det=document.getElementById('histDetail');
  det.classList.add('on');
  document.getElementById('hDetTitle').textContent=fmtLong(k);
  const u=DB[CU];
  let html='';
  u.order.forEach(sid=>{
    const sec=u.sections[sid]; if(!sec) return;
    const tasks=u.days[k]?.[sid]||[];
    const done=tasks.filter(t=>t.done).length;
    html+=`<div class="hsb">
      <div class="hsb-hdr"><span>${sec.icon} ${esc(sec.name)}</span><span class="hscnt">${done}/${tasks.length}</span></div>
      ${tasks.length===0
        ?'<div class="hno-tasks">Koi task nahi tha is din</div>'
        :tasks.map(t=>`<div class="hti ${t.done?'done':''}">
            <span class="hchk">${t.done?'✓':'○'}</span>
            <span class="hti-txt">${esc(t.text)}</span>
          </div>`).join('')}
    </div>`;
  });
  document.getElementById('hDetContent').innerHTML=html||'<div class="hno-tasks">Koi data nahi</div>';
}

function backToList(){
  document.getElementById('histDetail').classList.remove('on');
  document.getElementById('histList').style.display='block';
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

init();
