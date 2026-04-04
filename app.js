const API = 'https://disposable-sraz.onrender.com';

let currentEmail   = '';
let pollInterval   = null;
let timerInterval  = null;
let expiresAt      = 0;
let seenTimestamp  = null;

// ─── Page routing ───────────────────────────────────────────

function showHome() {
  clearAll();
  document.getElementById('home').classList.add('active');
  document.getElementById('inbox').classList.remove('active');
  document.getElementById('home').style.display = 'flex';
  document.getElementById('inbox').style.display = 'none';
  const inp = document.getElementById('username-input');
  inp.value = '';
  inp.focus();
}

function showInbox() {
  document.getElementById('home').classList.remove('active');
  document.getElementById('inbox').classList.add('active');
  document.getElementById('home').style.display = 'none';
  document.getElementById('inbox').style.display = 'flex';
}

function clearAll() {
  if (pollInterval)  clearInterval(pollInterval);
  if (timerInterval) clearInterval(timerInterval);
  pollInterval = timerInterval = null;
}

// ─── Create email ────────────────────────────────────────────

function createEmail() {
  const raw = document.getElementById('username-input').value.trim().toLowerCase();
  const errEl = document.getElementById('err-msg');

  if (!raw) {
    errEl.textContent = '↑ Enter a username first';
    return;
  }
  if (!/^[a-z0-9._-]+$/.test(raw)) {
    errEl.textContent = 'Only letters, numbers, dots and hyphens — no spaces';
    return;
  }

  currentEmail  = raw + '@snipertoolx.com';
  seenTimestamp = null;

  document.getElementById('email-chip-address').textContent = currentEmail;
  document.getElementById('err-msg').textContent = '';

  showInbox();
  renderEmpty();
  startTimer();
  startPolling();
}

function clearError() {
  document.getElementById('err-msg').textContent = '';
}

// ─── Timer ───────────────────────────────────────────────────

const DURATION = 15 * 60 * 1000;

function startTimer() {
  expiresAt = Date.now() + DURATION;
  tick();
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  const left = Math.max(0, expiresAt - Date.now());
  const pct  = (left / DURATION) * 100;
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);

  document.getElementById('timer-fill').style.width = pct + '%';
  document.getElementById('timer-time').textContent =
    String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  const fill = document.getElementById('timer-fill');
  if (pct < 20)      fill.style.background = '#ff4d6d';
  else if (pct < 50) fill.style.background = '#f59e0b';
  else               fill.style.background = 'var(--blue)';

  const timeEl = document.getElementById('timer-time');
  timeEl.style.color = pct < 20 ? '#ff4d6d' : pct < 50 ? '#f59e0b' : 'var(--blue)';

  if (left <= 0) {
    clearAll();
    renderExpired();
  }
}

// ─── Polling ─────────────────────────────────────────────────

function startPolling() {
  fetchMail();
  pollInterval = setInterval(fetchMail, 5000);
}

async function fetchMail() {
  try {
    const res = await fetch(API + '/check/' + encodeURIComponent(currentEmail));
    if (res.status === 404) return; // nothing yet
    const json = await res.json();
    if (json.status === 'success' && json.data) renderMail(json.data);
  } catch (e) {
    console.warn('Poll error:', e);
  }
}

async function refreshInbox() {
  const btn = document.getElementById('refresh-btn');
  btn.classList.add('spinning');
  await fetchMail();
  setTimeout(() => btn.classList.remove('spinning'), 700);
}

// ─── Render ───────────────────────────────────────────────────

function renderEmpty() {
  document.getElementById('mail-list').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <rect x="2" y="5" width="20" height="15" rx="2"/>
          <path d="M2 9l10 7 10-7"/>
        </svg>
      </div>
      <div class="empty-title">Inbox is empty</div>
      <div class="empty-sub">
        Send an email to <span class="highlight">${currentEmail}</span><br>
        and it will appear here automatically.
      </div>
    </div>`;
}

function renderExpired() {
  document.getElementById('mail-list').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <div class="empty-title">Email expired</div>
      <div class="empty-sub">Go back and create a fresh one.</div>
    </div>`;
}

function renderMail(data) {
  const isNew = seenTimestamp !== data.timestamp;
  seenTimestamp = data.timestamp;
  window._mailData = data;

  const preview = (data.text || '').replace(/\s+/g, ' ').trim().slice(0, 90);
  const time    = fmtTime(data.date || data.timestamp);
  const initial = (data.from || '?').replace(/^.*</, '').replace(/>.*$/, '').trim()[0] || '?';

  document.getElementById('mail-list').innerHTML = `
    <div class="mail-card" onclick="openModal()">
      <div class="mail-avatar">${escHtml(initial.toUpperCase())}</div>
      <div class="mail-content">
        <div class="mail-top-row">
          <div class="mail-from">${escHtml(data.from || 'Unknown')}</div>
          <div class="mail-time">${time}</div>
        </div>
        <div class="mail-subject">
          ${isNew ? '<span class="new-badge">New</span>' : ''}
          ${escHtml(data.subject || '(No Subject)')}
        </div>
        <div class="mail-preview">${escHtml(preview || '(no preview)')}</div>
      </div>
      <div class="mail-arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 4l4 4-4 4"/>
        </svg>
      </div>
    </div>`;
}

function fmtTime(val) {
  const d = new Date(val);
  if (isNaN(d)) return '';
  const diff = Date.now() - d;
  if (diff < 60000)    return 'Just now';
  if (diff < 3600000)  return Math.floor(diff / 60000) + 'm ago';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Copy ─────────────────────────────────────────────────────

function copyEmail() {
  navigator.clipboard.writeText(currentEmail).then(() => {
    const btn = document.getElementById('copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 7l3 3 6-6"/></svg> Copied!`;
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  });
}

// ─── Modal ─────────────────────────────────────────────────────

function openModal() {
  const d = window._mailData;
  if (!d) return;

  document.getElementById('modal-subject').textContent = d.subject || '(No Subject)';
  document.getElementById('modal-from').textContent    = d.from    || 'Unknown';
  document.getElementById('modal-to').textContent      = d.to      || currentEmail;
  document.getElementById('modal-date').textContent    = d.date ? new Date(d.date).toLocaleString() : '—';

  const body = document.getElementById('modal-body');
  if (d.html) {
    body.innerHTML = `<div class="email-html-frame"><iframe id="mail-frame" sandbox="allow-same-origin" scrolling="yes"></iframe></div>`;
    const frame = document.getElementById('mail-frame');
    frame.srcdoc = d.html;
    frame.onload = () => {
      try {
        const h = frame.contentDocument.body.scrollHeight;
        frame.style.height = Math.min(Math.max(h + 24, 200), 600) + 'px';
      } catch(e) {}
    };
  } else {
    body.innerHTML = `<div class="email-plain">${escHtml(d.text || '(empty)')}</div>`;
  }

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Utils ────────────────────────────────────────────────────

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Init ─────────────────────────────────────────────────────

document.getElementById('home').style.display  = 'flex';
document.getElementById('inbox').style.display = 'none';
document.getElementById('username-input').focus();