const input      = document.getElementById('username');
const btn        = document.getElementById('blockBtn');
const revealBtn  = document.getElementById('revealBtn');
const revealBox  = document.getElementById('revealBox');
const revealedId = document.getElementById('revealedId');
const copyBtn    = document.getElementById('copyBtn');
const status     = document.getElementById('status');
const useridInput = document.getElementById('userid');
const byIdBtn    = document.getElementById('blockByIdBtn');
const statusId   = document.getElementById('statusId');

function setStatus(el, msg, cls) {
  el.textContent = msg;
  el.className = 'status ' + (cls ?? '');
}

function sendMsg(type, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...payload }, (resp) => {
      resolve(chrome.runtime.lastError ? null : resp);
    });
  });
}

function showRevealed(userId) {
  revealedId.textContent = userId;
  revealBox.classList.add('visible');
  useridInput.value = userId;
}

function hideRevealed() {
  revealBox.classList.remove('visible');
  revealedId.textContent = '';
}

// Auto-fill from active tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url ?? '';
  const m = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?(?:\?|$)/);
  const reserved = new Set(['explore', 'reels', 'stories', 'direct', 'accounts', 'p', 'tv']);
  if (m && !reserved.has(m[1])) {
    input.value = m[1];
    triggerResolve(m[1]);
  }
});

// Debounced auto-resolve on username input
let resolveTimer = null;
function triggerResolve(username) {
  clearTimeout(resolveTimer);
  hideRevealed();
  useridInput.value = '';
  setStatus(status, '');
  if (!username) return;
  setStatus(status, 'Resolving ID…');
  resolveTimer = setTimeout(async () => {
    const resp = await sendMsg('POPUP_RESOLVE_USERNAME', { username });
    if (!resp) { setStatus(status, 'No Instagram tab open', 'err'); return; }
    if (resp.ok && resp.userId) {
      showRevealed(resp.userId);
      setStatus(status, '');
    } else {
      setStatus(status, 'Could not resolve — enter ID manually', 'err');
    }
  }, 600);
}

input.addEventListener('input', () => {
  triggerResolve(input.value.trim().replace(/^@/, ''));
});

// Reveal ID button — explicit trigger (same resolve, just more prominent)
revealBtn.addEventListener('click', async () => {
  const username = input.value.trim().replace(/^@/, '');
  if (!username) { setStatus(status, 'Enter a username first', 'err'); return; }
  revealBtn.disabled = true;
  setStatus(status, 'Resolving…');
  const resp = await sendMsg('POPUP_RESOLVE_USERNAME', { username });
  revealBtn.disabled = false;
  if (!resp) { setStatus(status, 'No Instagram tab open', 'err'); return; }
  if (resp.ok && resp.userId) {
    showRevealed(resp.userId);
    setStatus(status, '');
  } else {
    setStatus(status, 'Could not resolve user ID', 'err');
  }
});

// Copy resolved ID to clipboard
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(revealedId.textContent).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });
});

// Block by username
btn.addEventListener('click', async () => {
  const username = input.value.trim().replace(/^@/, '');
  if (!username) return;
  btn.disabled = true;
  setStatus(status, 'Blocking…');
  const resp = await sendMsg('POPUP_BLOCK_USERNAME', { username });
  btn.disabled = false;
  if (!resp) { setStatus(status, 'Error: no Instagram tab found', 'err'); return; }
  if (resp.ok) {
    setStatus(status, `✓ @${username} blocked`, 'ok');
    input.value = '';
    useridInput.value = '';
    hideRevealed();
  } else {
    setStatus(status, `✗ ${resp.error}`, 'err');
  }
});

// Block by user ID
byIdBtn.addEventListener('click', async () => {
  const id = useridInput.value.trim();
  if (!id || !/^\d+$/.test(id)) { setStatus(statusId, '✗ Enter a valid numeric ID', 'err'); return; }
  byIdBtn.disabled = true;
  setStatus(statusId, 'Blocking…');
  const resp = await sendMsg('POPUP_BLOCK_ID', { userId: id });
  byIdBtn.disabled = false;
  if (!resp) { setStatus(statusId, 'Error: no Instagram tab found', 'err'); return; }
  if (resp.ok) {
    setStatus(statusId, `✓ User ${id} blocked`, 'ok');
    useridInput.value = '';
    hideRevealed();
  } else {
    setStatus(statusId, `✗ ${resp.error}`, 'err');
  }
});

input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
useridInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') byIdBtn.click(); });
