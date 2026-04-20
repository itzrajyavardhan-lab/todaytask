const SUBJECTS=['math','phy','chem'];
const CLRS={math:'#60c8ff',phy:'#c8e8ff',chem:'#38e8d8'};
const LBLS={math:'Mathematics',phy:'Physics',chem:'Chemistry'};
const QUOTES=["The only way to learn mathematics is to do mathematics. — Paul Halmos","Science is a way of thinking much more than it is a body of knowledge. — Carl Sagan","In science, there are no shortcuts to truth. — Karl Popper","Mathematics is the queen of sciences. — Gauss","An investment in knowledge pays the best interest. — Benjamin Franklin","Success is the sum of small efforts repeated day in and day out.","Push yourself — no one else is going to do it for you.","The secret of getting ahead is getting started."];

function loadState(){try{const s=JSON.parse(localStorage.getItem('sl_v4')||'null');if(s)return s;}catch(e){}return{username:'Student',transparency:13,blur:22,theme:'dark',tasks:{math:[],phy:[],chem:[]},log:[],notes:'',sessions:0,lastSessDate:''};}
let state=loadState();
let editTarget=null;

function saveState(){localStorage.setItem('sl_v4',JSON.stringify(state));}

function setTheme(t){
  state.theme=t;
  document.documentElement.setAttribute('data-theme',t);
  document.getElementById('themeLabel').textContent=t==='dark'?'Dark':'Light';
  document.getElementById('themeIcon').textContent=t==='dark'?'🌙':'☀';
  renderPie();saveState();
}
function toggleTheme(){setTheme(state.theme==='dark'?'light':'dark');}

function applySettings(){
  document.documentElement.style.setProperty('--transparency',state.transparency/100);
  document.documentElement.style.setProperty('--blur',state.blur+'px');
  document.getElementById('usernameDisplay').textContent=state.username;
  setTheme(state.theme);
  document.getElementById('notesArea').value=state.notes||'';
}
applySettings();

function todayStr(){return new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function todayKey(){return new Date().toISOString().slice(0,10);}
document.getElementById('todayDate').textContent=todayStr();
document.getElementById('quoteBox').textContent='"'+QUOTES[new Date().getDay()%QUOTES.length]+'"';

function switchTab(s){SUBJECTS.forEach(x=>{document.getElementById('panel-'+x).classList.toggle('active',x===s);document.getElementById('tab-'+x).classList.toggle('active',x===s);});}
function switchRTab(t){
  document.querySelectorAll('.r-tab').forEach((el,i)=>{el.classList.toggle('active',['pie','timer','heatmap','log'][i]===t);});
  document.querySelectorAll('.r-panel').forEach(el=>el.classList.remove('active'));
  document.getElementById('rpanel-'+t).classList.add('active');
  if(t==='heatmap')renderHeatmap();
}

function addTask(s){
  const inp=document.getElementById('input-'+s);
  const text=inp.value.trim();if(!text){inp.focus();return;}
  const pri=document.getElementById('pri-'+s).value;
  const due=document.getElementById('due-'+s).value;
  state.tasks[s].push({id:Date.now(),text,done:false,priority:pri,due:due||null,createdAt:todayKey()});
  inp.value='';document.getElementById('due-'+s).value='';
  saveState();renderAll();showToast('Task added to '+LBLS[s]+' ✓');
}

function toggleTask(s,id){const t=state.tasks[s].find(x=>x.id===id);if(!t)return;t.done=!t.done;saveState();renderAll();}
function deleteTask(s,id){state.tasks[s]=state.tasks[s].filter(x=>x.id!==id);saveState();renderAll();}

function openEdit(s,id){
  const t=state.tasks[s].find(x=>x.id===id);if(!t)return;
  editTarget={s,id};
  document.getElementById('editText').value=t.text;
  document.getElementById('editPriority').value=t.priority||'none';
  document.getElementById('editDue').value=t.due||'';
  document.getElementById('editModal').classList.add('open');
}
function closeEdit(){document.getElementById('editModal').classList.remove('open');editTarget=null;}
function saveEdit(){
  if(!editTarget)return;
  const t=state.tasks[editTarget.s].find(x=>x.id===editTarget.id);if(!t)return;
  t.text=document.getElementById('editText').value.trim()||t.text;
  t.priority=document.getElementById('editPriority').value;
  t.due=document.getElementById('editDue').value||null;
  saveState();renderAll();closeEdit();showToast('Task updated!');
}

function renderAll(){SUBJECTS.forEach(s=>renderSubject(s));renderPie();renderBarChart();renderScore();renderStreak();renderLog();}

function renderSubject(s){
  const tasks=state.tasks[s];
  const total=tasks.length,done=tasks.filter(x=>x.done).length,pct=total?Math.round(done/total*100):0;
  const urgent=tasks.filter(x=>!x.done&&x.priority==='high').length;
  document.getElementById('stats-'+s).innerHTML=`
    <div class="stat-chip"><div class="n mc" style="color:var(--${s==='math'?'math':s==='phy'?'phy':'chem'})">${total}</div><div class="l">Total</div></div>
    <div class="stat-chip"><div class="n" style="color:var(--${s==='math'?'math':s==='phy'?'phy':'chem'})">${done}</div><div class="l">Done</div></div>
    <div class="stat-chip"><div class="n wc" style="color:${urgent?'#f87171':'var(--text-main)'}">${urgent}</div><div class="l">Urgent</div></div>
    <div class="stat-chip"><div class="n wc">${pct}%</div><div class="l">Progress</div></div>
  `;
  const q=(document.getElementById('search-'+s)||{}).value?.toLowerCase()||'';
  const f=(document.getElementById('filter-'+s)||{}).value||'all';
  let vis=tasks.filter(t=>{
    if(q&&!t.text.toLowerCase().includes(q))return false;
    if(f==='pending')return !t.done;
    if(f==='done')return t.done;
    if(f==='high')return t.priority==='high';
    return true;
  });
  const ul=document.getElementById('list-'+s);
  if(!vis.length){ul.innerHTML=`<div class="empty-state">${q?'No matching tasks.':'No tasks yet! Add one above.'}</div>`;return;}
  const today=todayKey();
  ul.innerHTML=vis.map(t=>{
    const pc=t.priority&&t.priority!=='none'?'p-'+t.priority:'';
    const pb=t.priority&&t.priority!=='none'?`<span class="pbadge">${t.priority.toUpperCase()}</span>`:'';
    const dh=t.due?`<span class="task-due ${t.due<today&&!t.done?'overdue':''}">📅 ${t.due}</span>`:'';
    const subColor=s==='math'?'var(--math)':s==='phy'?'var(--phy)':'var(--chem)';
    return `<li class="task-item ${t.done?'done':''} ${pc}" onclick="toggleTask('${s}',${t.id})">
      <div class="task-check" style="background:${t.done?subColor:'transparent'}">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="task-body">
        <span class="task-text">${escHtml(t.text)}</span>
        <div class="task-meta">${pb}${dh}</div>
      </div>
      <div class="task-actions" onclick="event.stopPropagation()">
        <button class="tedit" onclick="openEdit('${s}',${t.id})">✏</button>
        <button class="tdel" onclick="deleteTask('${s}',${t.id})">×</button>
      </div>
    </li>`;
  }).join('');
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function renderPie(){
  const canvas=document.getElementById('pieChart');
  const ctx=canvas.getContext('2d');
  const size=155,cx=size/2,cy=size/2,r=57,innerR=30;
  ctx.clearRect(0,0,size,size);
  const data=SUBJECTS.map(s=>{const tasks=state.tasks[s],total=tasks.length,done=tasks.filter(x=>x.done).length;return{label:LBLS[s],color:CLRS[s],done,total,pct:total?Math.round(done/total*100):0};});
  const vals=data.map(d=>Math.max(d.done,0.001));
  const sum=vals.reduce((a,b)=>a+b,0)||1;
  let angle=-Math.PI/2;
  vals.forEach((v,i)=>{
    const slice=(v/sum)*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,angle,angle+slice);ctx.closePath();
    ctx.fillStyle=data[i].color;ctx.shadowColor=data[i].color;ctx.shadowBlur=11;ctx.fill();ctx.shadowBlur=0;
    angle+=slice;
  });
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  ctx.beginPath();ctx.arc(cx,cy,innerR,0,Math.PI*2);
  ctx.fillStyle=isDark?'rgba(2,12,27,0.92)':'rgba(200,228,255,0.95)';ctx.fill();
  const allT=SUBJECTS.reduce((a,s)=>a+state.tasks[s].length,0);
  const allD=SUBJECTS.reduce((a,s)=>a+state.tasks[s].filter(x=>x.done).length,0);
  const ov=allT?Math.round(allD/allT*100):0;
  ctx.fillStyle=isDark?'#fff':'#07213f';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 13px Syne,sans-serif';ctx.fillText(ov+'%',cx,cy-4);
  ctx.font='9px DM Sans,sans-serif';ctx.fillStyle=isDark?'rgba(255,255,255,0.5)':'rgba(10,32,72,0.55)';ctx.fillText('done',cx,cy+9);
  document.getElementById('legend').innerHTML=data.map(d=>`
    <div class="legend-item">
      <div class="legend-left"><span class="dot" style="background:${d.color};color:${d.color};"></span>${d.label}</div>
      <div class="legend-bar-wrap"><div class="legend-bar" style="width:${d.pct}%;background:${d.color};"></div></div>
      <div class="legend-pct" style="color:${d.color}">${d.pct}%</div>
    </div>`).join('');
}

function renderScore(){
  const allT=SUBJECTS.reduce((a,s)=>a+state.tasks[s].length,0);
  const allD=SUBJECTS.reduce((a,s)=>a+state.tasks[s].filter(x=>x.done).length,0);
  const ov=allT?Math.round(allD/allT*100):0;
  document.getElementById('overallScore').textContent=ov+'%';
  const circ=2*Math.PI*43;
  document.getElementById('ringCircle').style.strokeDashoffset=circ-(ov/100*circ);
}

function renderBarChart(){
  document.getElementById('barChart').innerHTML=SUBJECTS.map(s=>{
    const tasks=state.tasks[s],total=tasks.length,done=tasks.filter(x=>x.done).length,pct=total?Math.round(done/total*100):0;
    const c=CLRS[s];
    return `<div class="bar-row">
      <div class="bar-label" style="color:${c}">${LBLS[s].slice(0,5)}.</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${c};box-shadow:0 0 6px ${c}60;"></div></div>
      <div class="bar-pct" style="color:${c}">${pct}%</div>
    </div>`;
  }).join('');
}

function renderStreak(){
  let streak=0;const d=new Date();
  for(let i=0;i<365;i++){const k=new Date(d);k.setDate(k.getDate()-i);const ks=k.toISOString().slice(0,10);if(state.log.some(l=>l.date===ks&&l.pct>0))streak++;else if(i>0)break;}
  document.getElementById('streakNum').textContent=streak;
}

function renderHeatmap(){
  const el=document.getElementById('heatmap');
  const today=new Date();let html='';
  for(let i=29;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i);
    const k=d.toISOString().slice(0,10);
    const entry=state.log.find(l=>l.date===k);
    let lvl='';if(entry){if(entry.pct>=70)lvl='l3';else if(entry.pct>=30)lvl='l2';else if(entry.pct>0)lvl='l1';}
    html+=`<div class="hm-cell ${lvl}" title="${k}: ${entry?entry.pct+'%':'No data'}"></div>`;
  }
  el.innerHTML=html;
}

function saveProgress(){
  const allT=SUBJECTS.reduce((a,s)=>a+state.tasks[s].length,0);
  const allD=SUBJECTS.reduce((a,s)=>a+state.tasks[s].filter(x=>x.done).length,0);
  const pct=allT?Math.round(allD/allT*100):0;
  const date=todayKey();
  const entry={date,pct,math:{done:state.tasks.math.filter(x=>x.done).length,total:state.tasks.math.length},phy:{done:state.tasks.phy.filter(x=>x.done).length,total:state.tasks.phy.length},chem:{done:state.tasks.chem.filter(x=>x.done).length,total:state.tasks.chem.length}};
  state.log=state.log.filter(l=>l.date!==date);state.log.unshift(entry);
  if(state.log.length>60)state.log=state.log.slice(0,60);
  saveState();renderLog();renderHeatmap();renderStreak();showToast('Progress saved! 🎉');
}

function renderLog(){
  const el=document.getElementById('dailyLog');
  if(!state.log.length){el.innerHTML='<div class="empty-state">No entries yet. Hit Save Today!</div>';return;}
  el.innerHTML=state.log.map(l=>{
    const d=new Date(l.date+'T00:00:00');
    return `<div class="log-item">
      <div class="log-date">${d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
      <div class="log-text"><b>${l.pct}%</b> — M:${l.math.done}/${l.math.total} · P:${l.phy.done}/${l.phy.total} · C:${l.chem.done}/${l.chem.total}</div>
    </div>`;
  }).join('');
}

function saveNotes(){state.notes=document.getElementById('notesArea').value;saveState();showToast('Note saved!');}

function exportTasks(){
  let out='StudyLens Export — '+todayStr()+'\n\n';
  SUBJECTS.forEach(s=>{
    out+=`== ${LBLS[s]} ==\n`;
    if(!state.tasks[s].length){out+='  (no tasks)\n\n';return;}
    state.tasks[s].forEach(t=>{out+=`  [${t.done?'x':' '}] ${t.text}${t.priority&&t.priority!=='none'?' ['+t.priority.toUpperCase()+']':''}${t.due?' due:'+t.due:''}\n`;});
    out+='\n';
  });
  const blob=new Blob([out],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='studylens-tasks.txt';a.click();
  showToast('Tasks exported!');
}

function clearDone(){SUBJECTS.forEach(s=>{state.tasks[s]=state.tasks[s].filter(x=>!x.done);});saveState();renderAll();showToast('Completed tasks cleared!');}

// ── Pomodoro ──
let timerSecs=25*60,timerRunning=false,timerInterval=null,timerMode='Work';
function setTimerMode(mins,label){pauseTimer();timerSecs=mins*60;timerMode=label;updateTimerDisplay();document.getElementById('timerModeLabel').textContent=label+' Session';}
function updateTimerDisplay(){const m=Math.floor(timerSecs/60),s=timerSecs%60;document.getElementById('timerDisplay').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}
function startTimer(){
  if(timerRunning)return;timerRunning=true;
  document.getElementById('btnStart').style.display='none';document.getElementById('btnPause').style.display='';
  timerInterval=setInterval(()=>{
    timerSecs--;updateTimerDisplay();
    if(timerSecs<=0){
      clearInterval(timerInterval);timerRunning=false;
      document.getElementById('btnStart').style.display='';document.getElementById('btnPause').style.display='none';
      if(timerMode==='Work'){const today=todayKey();if(state.lastSessDate!==today){state.sessions=0;state.lastSessDate=today;}state.sessions++;saveState();document.getElementById('sessionCount').textContent=state.sessions;}
      showToast(timerMode==='Work'?'Focus session done! Take a break 🎉':'Break over! Back to work 💪');
    }
  },1000);
}
function pauseTimer(){clearInterval(timerInterval);timerRunning=false;document.getElementById('btnStart').style.display='';document.getElementById('btnPause').style.display='none';}
function resetTimer(){pauseTimer();timerSecs=25*60;timerMode='Work';updateTimerDisplay();document.getElementById('timerModeLabel').textContent='Work Session';}
updateTimerDisplay();
if(state.lastSessDate===todayKey())document.getElementById('sessionCount').textContent=state.sessions;

// ── Settings ──
function openSettings(){
  document.getElementById('usernameInput').value=state.username;
  document.getElementById('transSlider').value=state.transparency;
  document.getElementById('blurSlider').value=state.blur;
  document.getElementById('transVal').textContent=state.transparency+'%';
  document.getElementById('blurVal').textContent=state.blur+'px';
  document.getElementById('settingsModal').classList.add('open');
}
function closeSettings(){document.getElementById('settingsModal').classList.remove('open');}
function previewTrans(v){document.getElementById('transVal').textContent=v+'%';document.documentElement.style.setProperty('--transparency',v/100);}
function previewBlur(v){document.getElementById('blurVal').textContent=v+'px';document.documentElement.style.setProperty('--blur',v+'px');}
function saveSettings(){
  state.username=document.getElementById('usernameInput').value.trim()||'Student';
  state.transparency=parseInt(document.getElementById('transSlider').value);
  state.blur=parseInt(document.getElementById('blurSlider').value);
  saveState();applySettings();closeSettings();showToast('Settings saved!');
}
document.getElementById('settingsModal').addEventListener('click',function(e){if(e.target===this)closeSettings();});
document.getElementById('editModal').addEventListener('click',function(e){if(e.target===this)closeEdit();});

let toastTimer;
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}

renderAll();