// ══════════════════════════════════════════
//  REVIEW FITNESS TRACKER — app.js
// ══════════════════════════════════════════

// ── USERS ──
const USERS = {
  admin: { password: 'admin123', role: 'admin', name: 'Admin' },
  user:  { password: 'user123',  role: 'member', name: 'Alex' }
};

let currentUser = null;
let weightChartInstance = null;

// ── STATE ──
function getState() {
  const raw = localStorage.getItem('review_state');
  return raw ? JSON.parse(raw) : {
    workouts: [],
    meals: [],
    weights: [],
    sleepLogs: [],
    records: [],
    plans: [],
    goals: { calories: 2000, protein: 150, carbs: 200, fat: 65, weight: null },
    settings: { appName: 'Review', calGoal: 2000, wtGoal: 75 },
    activityLog: []
  };
}

function saveState(s) { localStorage.setItem('review_state', JSON.stringify(s)); }

// ── AUTH ──
function handleLogin() {
  const u = document.getElementById('loginUser').value.trim().toLowerCase();
  const p = document.getElementById('loginPass').value;
  if (USERS[u] && USERS[u].password === p) {
    currentUser = { username: u, ...USERS[u] };
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    initApp();
  } else {
    showToast('Invalid credentials', 'error');
  }
}

function logout() {
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

// ── INIT ──
function initApp() {
  const u = currentUser;
  document.getElementById('userBadge').textContent = u.name[0].toUpperCase();
  document.getElementById('userNameDisplay').textContent = u.name;
  document.getElementById('userRoleDisplay').textContent = u.role;
  document.getElementById('dashGreetName').textContent = `, ${u.name}`;

  // Show admin nav if admin
  if (u.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }

  // Set today's date on inputs
  const today = new Date().toISOString().split('T')[0];
  ['wDate','wgDate','slDate','prDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  // Update date display
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('en-US', opts);

  // Load nutrition goals
  const s = getState();
  if (s.goals) {
    ['goalCal','goalPro','goalCarb','goalFat'].forEach(id => {
      const key = { goalCal:'calories', goalPro:'protein', goalCarb:'carbs', goalFat:'fat' }[id];
      const el = document.getElementById(id);
      if (el && s.goals[key]) el.value = s.goals[key];
    });
    if (s.goals.weight) {
      document.getElementById('wGoal').value = s.goals.weight;
    }
  }
  if (s.settings?.calGoal) document.getElementById('calGoal').textContent = s.settings.calGoal;

  refreshAll();
  initWeightChart();
  initNav();
}

function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sec = item.dataset.section;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(sec)?.classList.add('active');
      if (sec === 'admin') refreshAdmin();
      if (sec === 'weight') updateWeightChart();
    });
  });
}

// ── REFRESH ALL ──
function refreshAll() {
  refreshDashboard();
  refreshWorkoutHistory();
  refreshMealLog();
  refreshWeightLog();
  refreshSleepLog();
  refreshRecords();
  refreshMacroBar();
  updateWeightStats();
  updateSleepStats();
}

// ── DASHBOARD ──
function refreshDashboard() {
  const s = getState();
  const today = new Date().toISOString().split('T')[0];

  // Calories today
  const todayMeals = s.meals.filter(m => m.date === today);
  const totalCal = todayMeals.reduce((a, m) => a + (m.calories || 0), 0);
  document.getElementById('dashCalories').textContent = totalCal;

  // Workouts this week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekWorkouts = s.workouts.filter(w => new Date(w.date) >= weekAgo);
  document.getElementById('dashWorkouts').textContent = weekWorkouts.length;

  // Weight
  const lastW = s.weights[s.weights.length - 1];
  document.getElementById('dashWeight').textContent = lastW ? lastW.value : '--';

  // Sleep
  const lastSl = s.sleepLogs[s.sleepLogs.length - 1];
  document.getElementById('dashSleep').textContent = lastSl ? lastSl.hours.toFixed(1) : '--';

  // Recent workouts
  const rwEl = document.getElementById('recentWorkouts');
  const recent3W = [...s.workouts].reverse().slice(0, 3);
  rwEl.innerHTML = recent3W.length
    ? recent3W.map(w => `<div class="history-item"><div class="hi-left"><div class="hi-name">${w.name}</div><div class="hi-meta">${w.date} · ${w.duration} min</div></div></div>`).join('')
    : '<p class="empty">No workouts yet.</p>';

  // Today meals
  const rmEl = document.getElementById('recentMeals');
  rmEl.innerHTML = todayMeals.length
    ? todayMeals.map(m => `<div class="history-item"><div class="hi-left"><div class="hi-name">${m.name}</div><div class="hi-meta">${m.type} · ${m.calories} kcal</div></div></div>`).join('')
    : '<p class="empty">No meals logged today.</p>';
}

// ── WORKOUTS ──
function logWorkout() {
  const name = document.getElementById('wName').value.trim();
  const date = document.getElementById('wDate').value;
  const duration = parseInt(document.getElementById('wDuration').value) || 0;
  const exercises = document.getElementById('wExercises').value.trim();
  const notes = document.getElementById('wNotes').value.trim();
  if (!name || !date) return showToast('Please fill in name and date', 'error');

  const s = getState();
  s.workouts.push({ id: Date.now(), name, date, duration, exercises, notes });
  logActivity(s, `Logged workout: ${name}`);
  saveState(s);
  showToast('Workout logged! 💪', 'success');
  ['wName','wDuration','wExercises','wNotes'].forEach(id => document.getElementById(id).value = '');
  refreshAll();
}

function savePlan() {
  const name = document.getElementById('planName').value.trim();
  const days = [...document.querySelectorAll('.day-inp')].map(inp => inp.value);
  if (!name) return showToast('Give your plan a name', 'error');
  const s = getState();
  s.plans.push({ id: Date.now(), name, days, created: new Date().toISOString() });
  logActivity(s, `Created plan: ${name}`);
  saveState(s);
  showToast(`Plan "${name}" saved!`, 'success');
}

function refreshWorkoutHistory() {
  const s = getState();
  const el = document.getElementById('workoutHistory');
  if (!s.workouts.length) { el.innerHTML = '<p class="empty">No workouts logged yet.</p>'; return; }
  el.innerHTML = [...s.workouts].reverse().map(w => `
    <div class="history-item">
      <div class="hi-left">
        <div class="hi-name">${w.name}</div>
        <div class="hi-meta">${w.date} · ${w.duration} min${w.notes ? ' · ' + w.notes : ''}</div>
        ${w.exercises ? `<div class="hi-meta" style="color:var(--text-dim)">${w.exercises.split('\n').join(' | ')}</div>` : ''}
      </div>
      <div class="hi-right">
        <span class="hi-val">${w.duration}m</span>
        <button class="hi-del" onclick="deleteEntry('workouts',${w.id})">✕</button>
      </div>
    </div>`).join('');
}

// ── MEALS ──
function logMeal() {
  const name = document.getElementById('mName').value.trim();
  const type = document.getElementById('mType').value;
  const calories = parseInt(document.getElementById('mCal').value) || 0;
  const protein = parseInt(document.getElementById('mPro').value) || 0;
  const carbs = parseInt(document.getElementById('mCarb').value) || 0;
  const fat = parseInt(document.getElementById('mFat').value) || 0;
  if (!name) return showToast('Please enter a meal name', 'error');

  const s = getState();
  const today = new Date().toISOString().split('T')[0];
  s.meals.push({ id: Date.now(), name, type, calories, protein, carbs, fat, date: today });
  logActivity(s, `Logged meal: ${name} (${calories} kcal)`);
  saveState(s);
  showToast('Meal logged! 🍽️', 'success');
  ['mName','mCal','mPro','mCarb','mFat'].forEach(id => document.getElementById(id).value = '');
  refreshAll();
}

function saveNutGoals() {
  const s = getState();
  s.goals.calories = parseInt(document.getElementById('goalCal').value) || 2000;
  s.goals.protein = parseInt(document.getElementById('goalPro').value) || 150;
  s.goals.carbs = parseInt(document.getElementById('goalCarb').value) || 200;
  s.goals.fat = parseInt(document.getElementById('goalFat').value) || 65;
  document.getElementById('calGoal').textContent = s.goals.calories;
  saveState(s);
  showToast('Goals saved!', 'success');
  refreshMacroBar();
}

function refreshMacroBar() {
  const s = getState();
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = s.meals.filter(m => m.date === today);
  const tot = { cal: 0, pro: 0, carbs: 0, fat: 0 };
  todayMeals.forEach(m => { tot.cal += m.calories || 0; tot.pro += m.protein || 0; tot.carbs += m.carbs || 0; tot.fat += m.fat || 0; });

  document.getElementById('pVal').textContent = tot.pro + 'g';
  document.getElementById('cVal').textContent = tot.carbs + 'g';
  document.getElementById('fVal').textContent = tot.fat + 'g';
  document.getElementById('calVal').textContent = tot.cal + ' kcal';

  const g = s.goals;
  document.getElementById('barProtein').style.width = Math.min(100, (tot.pro / (g.protein || 150)) * 100) + '%';
  document.getElementById('barCarbs').style.width = Math.min(100, (tot.carbs / (g.carbs || 200)) * 100) + '%';
  document.getElementById('barFat').style.width = Math.min(100, (tot.fat / (g.fat || 65)) * 100) + '%';
}

function refreshMealLog() {
  const s = getState();
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = s.meals.filter(m => m.date === today);
  const el = document.getElementById('mealLog');
  if (!todayMeals.length) { el.innerHTML = '<p class="empty">No meals logged today.</p>'; return; }
  el.innerHTML = todayMeals.reverse().map(m => `
    <div class="history-item">
      <div class="hi-left">
        <div class="hi-name">${m.name} <span class="tag tag-${m.type.toLowerCase()}">${m.type}</span></div>
        <div class="hi-meta">P: ${m.protein}g · C: ${m.carbs}g · F: ${m.fat}g</div>
      </div>
      <div class="hi-right">
        <span class="hi-val">${m.calories} kcal</span>
        <button class="hi-del" onclick="deleteEntry('meals',${m.id})">✕</button>
      </div>
    </div>`).join('');
}

// ── WEIGHT ──
function logWeight() {
  const val = parseFloat(document.getElementById('wgVal').value);
  const date = document.getElementById('wgDate').value;
  const note = document.getElementById('wgNote').value.trim();
  if (!val || !date) return showToast('Please enter weight and date', 'error');

  const s = getState();
  s.weights.push({ id: Date.now(), value: val, date, note });
  s.weights.sort((a, b) => a.date.localeCompare(b.date));
  logActivity(s, `Logged weight: ${val} kg`);
  saveState(s);
  showToast('Weight logged! ⚖️', 'success');
  document.getElementById('wgVal').value = '';
  document.getElementById('wgNote').value = '';
  refreshAll();
  updateWeightChart();
}

function saveWeightGoal() {
  const goal = parseFloat(document.getElementById('wGoal').value);
  if (!goal) return;
  const s = getState();
  s.goals.weight = goal;
  saveState(s);
  showToast('Weight goal set!', 'success');
  updateWeightStats();
}

function updateWeightStats() {
  const s = getState();
  const ws = s.weights;
  if (!ws.length) return;
  const cur = ws[ws.length - 1].value;
  const start = ws[0].value;
  const change = (cur - start).toFixed(1);
  document.getElementById('wCurrent').textContent = cur + ' kg';
  document.getElementById('wStart').textContent = start + ' kg';
  document.getElementById('wChange').textContent = (change > 0 ? '+' : '') + change + ' kg';
  document.getElementById('wChange').style.color = change < 0 ? 'var(--accent-green)' : change > 0 ? 'var(--accent-red)' : 'var(--text)';
  document.getElementById('wGoalDisp').textContent = s.goals.weight ? s.goals.weight + ' kg' : '--';
}

function refreshWeightLog() {
  const s = getState();
  const el = document.getElementById('weightLog');
  if (!s.weights.length) { el.innerHTML = '<p class="empty">No entries yet.</p>'; return; }
  el.innerHTML = [...s.weights].reverse().map(w => `
    <div class="history-item">
      <div class="hi-left">
        <div class="hi-name">${w.date}</div>
        ${w.note ? `<div class="hi-meta">${w.note}</div>` : ''}
      </div>
      <div class="hi-right">
        <span class="hi-val">${w.value} kg</span>
        <button class="hi-del" onclick="deleteEntry('weights',${w.id})">✕</button>
      </div>
    </div>`).join('');
}

function initWeightChart() {
  const ctx = document.getElementById('weightChart');
  if (!ctx) return;
  const s = getState();
  const labels = s.weights.map(w => w.date);
  const data = s.weights.map(w => w.value);

  if (weightChartInstance) weightChartInstance.destroy();
  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data,
        borderColor: '#c8ff00',
        backgroundColor: 'rgba(200,255,0,0.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#c8ff00',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#7a7a9a', font: { family: 'DM Mono', size: 10 } }, grid: { color: '#2a2a35' } },
        y: { ticks: { color: '#7a7a9a', font: { family: 'DM Mono', size: 10 } }, grid: { color: '#2a2a35' } }
      }
    }
  });
}

function updateWeightChart() {
  if (!weightChartInstance) { initWeightChart(); return; }
  const s = getState();
  weightChartInstance.data.labels = s.weights.map(w => w.date);
  weightChartInstance.data.datasets[0].data = s.weights.map(w => w.value);
  weightChartInstance.update();
}

// ── SLEEP ──
function logSleep() {
  const date = document.getElementById('slDate').value;
  const bed = document.getElementById('slBed').value;
  const wake = document.getElementById('slWake').value;
  const quality = parseInt(document.getElementById('slQuality').value);
  const note = document.getElementById('slNote').value.trim();
  if (!date || !bed || !wake) return showToast('Fill in date, bedtime & wake time', 'error');

  const bedMins = timeToMins(bed);
  let wakeMins = timeToMins(wake);
  if (wakeMins < bedMins) wakeMins += 24 * 60; // next day
  const hours = (wakeMins - bedMins) / 60;

  const s = getState();
  s.sleepLogs.push({ id: Date.now(), date, bed, wake, hours, quality, note });
  s.sleepLogs.sort((a, b) => a.date.localeCompare(b.date));
  logActivity(s, `Logged sleep: ${hours.toFixed(1)}h`);
  saveState(s);
  showToast(`Sleep logged: ${hours.toFixed(1)} hours 😴`, 'success');
  ['slBed','slWake','slNote'].forEach(id => document.getElementById(id).value = '');
  refreshAll();
}

function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function updateSleepStats() {
  const s = getState();
  const logs = s.sleepLogs;
  if (!logs.length) return;

  const last = logs[logs.length - 1];
  document.getElementById('lastSleep').textContent = last.hours.toFixed(1) + 'h';
  document.getElementById('dashSleep').textContent = last.hours.toFixed(1);

  const recent7 = logs.slice(-7);
  const avg = recent7.reduce((a, l) => a + l.hours, 0) / recent7.length;
  const avgQ = recent7.reduce((a, l) => a + l.quality, 0) / recent7.length;
  const best = Math.max(...logs.map(l => l.hours));

  document.getElementById('avgSleep').textContent = avg.toFixed(1) + 'h';
  document.getElementById('bestSleep').textContent = best.toFixed(1) + 'h';
  document.getElementById('avgQuality').textContent = avgQ.toFixed(1) + '/10';
  document.getElementById('ringHrs').textContent = avg.toFixed(1) + 'h';

  // Sleep ring — 8h target
  const pct = Math.min(1, avg / 8);
  const arc = 314 * (1 - pct);
  document.getElementById('sleepRingArc').style.strokeDashoffset = arc;
}

function refreshSleepLog() {
  const s = getState();
  const el = document.getElementById('sleepLog');
  if (!s.sleepLogs.length) { el.innerHTML = '<p class="empty">No sleep logs yet.</p>'; return; }
  el.innerHTML = [...s.sleepLogs].reverse().map(sl => `
    <div class="history-item">
      <div class="hi-left">
        <div class="hi-name">${sl.date}</div>
        <div class="hi-meta">${sl.bed} → ${sl.wake} · Quality: ${sl.quality}/10${sl.note ? ' · ' + sl.note : ''}</div>
      </div>
      <div class="hi-right">
        <span class="hi-val">${sl.hours.toFixed(1)}h</span>
        <button class="hi-del" onclick="deleteEntry('sleepLogs',${sl.id})">✕</button>
      </div>
    </div>`).join('');
}

// ── RECORDS ──
function addRecord() {
  const exercise = document.getElementById('prExercise').value.trim();
  const val = parseFloat(document.getElementById('prVal').value);
  const unit = document.getElementById('prUnit').value;
  const date = document.getElementById('prDate').value;
  if (!exercise || !val) return showToast('Fill in exercise and value', 'error');

  const s = getState();
  // Remove old PR for same exercise
  s.records = s.records.filter(r => r.exercise.toLowerCase() !== exercise.toLowerCase());
  s.records.push({ id: Date.now(), exercise, value: val, unit, date });
  logActivity(s, `New PR: ${exercise} — ${val} ${unit}`);
  saveState(s);
  showToast(`New PR: ${exercise} ${val} ${unit} 🏆`, 'success');
  ['prExercise','prVal'].forEach(id => document.getElementById(id).value = '');
  refreshRecords();
}

function refreshRecords() {
  const s = getState();
  const el = document.getElementById('prList');
  if (!s.records.length) { el.innerHTML = '<p class="empty">No personal records yet. Add your first PR!</p>'; return; }
  el.innerHTML = [...s.records].reverse().map(r => `
    <div class="history-item">
      <div class="hi-left">
        <div class="hi-name">${r.exercise}</div>
        <div class="hi-meta">${r.date}</div>
      </div>
      <div class="hi-right">
        <span class="hi-val">${r.value} ${r.unit}</span>
        <button class="hi-del" onclick="deleteEntry('records',${r.id})">✕</button>
      </div>
    </div>`).join('');

  // Quick PR panel
  const keyMap = { 'Bench Press': 'pr-bench', 'Squat': 'pr-squat', 'Deadlift': 'pr-deadlift', 'Pull-ups': 'pr-pullups', '5K Run': 'pr-5k' };
  Object.entries(keyMap).forEach(([ex, elId]) => {
    const found = s.records.find(r => r.exercise === ex);
    const elem = document.getElementById(elId);
    if (elem) elem.textContent = found ? `${found.value} ${found.unit}` : '-- ';
  });
}

// ── DELETE ──
function deleteEntry(collection, id) {
  const s = getState();
  s[collection] = s[collection].filter(e => e.id !== id);
  saveState(s);
  refreshAll();
  updateWeightChart();
  showToast('Entry removed', 'success');
}

// ── ADMIN ──
function refreshAdmin() {
  const s = getState();
  document.getElementById('adminWorkouts').textContent = s.workouts.length;
  document.getElementById('adminMeals').textContent = s.meals.length;
  document.getElementById('adminSleepLogs').textContent = s.sleepLogs.length;
  document.getElementById('adminWkCount').textContent = s.workouts.length;

  const al = document.getElementById('activityLog');
  if (!s.activityLog?.length) { al.innerHTML = '<p class="empty">No activity yet.</p>'; return; }
  al.innerHTML = [...s.activityLog].reverse().slice(0, 20).map(a => `
    <div class="history-item">
      <div class="hi-left">
        <div class="hi-name">${a.msg}</div>
        <div class="hi-meta">${a.time}</div>
      </div>
    </div>`).join('');
}

function addUser() {
  const name = document.getElementById('newUserName').value.trim();
  if (!name) return showToast('Enter a username', 'error');
  showToast(`Demo user "${name}" noted (server-side auth needed for persistence)`, 'success');
  document.getElementById('newUserName').value = '';
}

function adminReset() {
  if (confirm('Reset user data?')) {
    const s = getState();
    s.workouts = []; s.meals = []; s.weights = []; s.sleepLogs = []; s.records = [];
    saveState(s);
    refreshAdmin();
    refreshAll();
    showToast('User data cleared', 'success');
  }
}

function saveSettings() {
  const s = getState();
  s.settings.appName = document.getElementById('settingAppName').value || 'Review';
  s.settings.calGoal = parseInt(document.getElementById('settingCalGoal').value) || 2000;
  s.settings.wtGoal = parseFloat(document.getElementById('settingWtGoal').value) || 75;
  s.goals.calories = s.settings.calGoal;
  document.getElementById('calGoal').textContent = s.settings.calGoal;
  saveState(s);
  showToast('Settings saved!', 'success');
}

function clearAllData() {
  if (confirm('Clear ALL data? This cannot be undone.')) {
    localStorage.removeItem('review_state');
    refreshAll();
    refreshAdmin();
    showToast('All data cleared', 'error');
  }
}

function logActivity(s, msg) {
  if (!s.activityLog) s.activityLog = [];
  s.activityLog.push({ msg, time: new Date().toLocaleString() });
  if (s.activityLog.length > 100) s.activityLog.shift();
}

// ── CLAUDE MODAL ──
const CLAUDE_PROMPTS = {
  log_workout: {
    prompt: "Tell me about your workout and I'll help you log it!",
    context: "You're a fitness assistant. Help the user log a workout. Ask about: workout name, exercises, sets/reps, duration, and how it felt. After gathering info, summarize it and tell them the fields to fill in the workout log form. Be concise and encouraging."
  },
  log_meal: {
    prompt: "Tell me what you ate and I'll help estimate the macros!",
    context: "You're a nutrition assistant. Help the user log a meal. Ask about the meal and estimate calories, protein, carbs, and fat. After gathering info, tell them the values to enter. Be practical and concise."
  },
  log_weight: {
    prompt: "Let's log your weight! What's your current weight?",
    context: "You're a fitness coach. Help the user log their weight. Ask for their weight and any notes. Be encouraging about their progress. After gathering info, confirm what they should enter."
  },
  log_sleep: {
    prompt: "Let's track your sleep! When did you go to bed and wake up?",
    context: "You're a wellness coach. Help the user log their sleep. Ask about bedtime, wake time, sleep quality, and how they feel. Calculate hours and be supportive. Be concise."
  },
  generate_plan: {
    prompt: "Let me help you build a custom workout plan! What are your fitness goals?",
    context: "You're an expert personal trainer. Help the user create a weekly workout plan. Ask about: fitness goals (muscle gain, fat loss, endurance), available days per week, equipment access, fitness level, and any injuries. Then suggest a structured 7-day plan with workout types for each day. Be specific and practical."
  }
};

let currentActionType = null;
let chatHistory = [];

function claudeAction(type) {
  currentActionType = type;
  chatHistory = [];
  const config = CLAUDE_PROMPTS[type] || { prompt: "How can I help you?", context: "You are a helpful fitness assistant." };

  document.getElementById('modalPrompt').textContent = config.prompt;
  document.getElementById('claudeChat').innerHTML = '';
  document.getElementById('claudeInput').value = '';
  document.getElementById('claudeModal').classList.remove('hidden');

  // Opening message
  appendChatMsg('claude', config.prompt);
  chatHistory.push({ role: 'assistant', content: config.prompt });
}

function closeModal() {
  document.getElementById('claudeModal').classList.add('hidden');
  currentActionType = null;
  chatHistory = [];
}

async function sendClaudeMessage() {
  const input = document.getElementById('claudeInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendChatMsg('user', text);
  chatHistory.push({ role: 'user', content: text });

  const typing = showTyping();

  try {
    const config = CLAUDE_PROMPTS[currentActionType] || {};
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: config.context || 'You are a helpful fitness assistant. Be concise and practical.',
        messages: chatHistory
      })
    });

    const data = await response.json();
    typing.remove();

    const reply = data.content?.[0]?.text || "I'm having trouble responding right now. Please try again!";
    appendChatMsg('claude', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    typing.remove();
    appendChatMsg('claude', "Connection issue — but I can still help! Tell me what you'd like to track and fill it in the form manually.");
  }
}

function appendChatMsg(role, text) {
  const chat = document.getElementById('claudeChat');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const chat = document.getElementById('claudeChat');
  const div = document.createElement('div');
  div.className = 'chat-msg claude typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

// ── TOAST ──
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.add('hidden'); }, 3000);
}

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('loginScreen') && !document.getElementById('loginScreen').classList.contains('hidden')) {
    handleLogin();
  }
});

// Auto-set today's date on load
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  ['wDate','wgDate','slDate','prDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });
});
