const input    = document.getElementById('username');
const blockBtn = document.getElementById('blockBtn');
const infoBtn  = document.getElementById('infoBtn');
const infoBox  = document.getElementById('infoBox');
const iUsername  = document.getElementById('iUsername');
const iId        = document.getElementById('iId');
const iFollowers = document.getElementById('iFollowers');
const iFollowing = document.getElementById('iFollowing');
const status   = document.getElementById('status');

function setStatus(msg, cls) {
  status.textContent = msg;
  status.className = cls ?? '';
}

function fmt(n) {
  if (n == null) return '—';
  return n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
       : n >= 1_000     ? (n / 1_000).toFixed(1) + 'K'
       : String(n);
}

function sendMsg(type, payload) {
  return new Promise(resolve =>
    chrome.runtime.sendMessage({ type, ...payload }, resp =>
      resolve(chrome.runtime.lastError ? null : resp)
    )
  );
}

// Auto-fill username from active tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url ?? '';
  const m = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?(?:\?|$)/);
  const reserved = new Set(['explore', 'reels', 'stories', 'direct', 'accounts', 'p', 'tv']);
  if (m && !reserved.has(m[1])) input.value = m[1];
});

infoBtn.addEventListener('click', async () => {
  const username = input.value.trim().replace(/^@/, '');
  if (!username) { setStatus('Enter a username first', 'err'); return; }

  infoBtn.disabled = true;
  setStatus('Fetching…');
  infoBox.classList.remove('visible');

  const resp = await sendMsg('POPUP_FETCH_PROFILE', { username });
  infoBtn.disabled = false;

  if (!resp || !resp.ok) {
    setStatus('Could not fetch profile', 'err');
    return;
  }

  const p = resp.profile;
  iUsername.textContent  = '@' + p.username;
  iId.textContent        = p.userId;
  iFollowers.textContent = fmt(p.followers);
  iFollowing.textContent = fmt(p.following);
  infoBox.classList.add('visible');
  setStatus('');
});

blockBtn.addEventListener('click', async () => {
  const username = input.value.trim().replace(/^@/, '');
  if (!username) return;

  blockBtn.disabled = true;
  setStatus('Blocking…');

  const resp = await sendMsg('POPUP_BLOCK_USERNAME', { username });
  blockBtn.disabled = false;

  if (!resp) { setStatus('Error: no Instagram tab found', 'err'); return; }
  if (resp.ok) {
    setStatus(`✓ @${username} blocked`, 'ok');
    input.value = '';
    infoBox.classList.remove('visible');
  } else {
    setStatus(`✗ ${resp.error}`, 'err');
  }
});

input.addEventListener('keydown', (e) => { if (e.key === 'Enter') blockBtn.click(); });
input.addEventListener('input', () => infoBox.classList.remove('visible'));
