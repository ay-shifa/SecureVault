/**
 * SecureVault Web Application
 * Client-side Controller & State Management
 */

// Application State
let appState = {
  initialized: false,
  isUnlocked: false,
  sessionKey: null,
  salt: null,
  masterPasswordHash: null,
  credentials: [],        // { id, website, username, password, encryptedPassword, createdAt, strength }
  filteredCredentials: [],
  revealedSet: new Set(), // Set of credential IDs with visible passwords
  editingId: null,
  deleteTargetId: null,
  clipboardCountdown: null,
  inactivityTimer: null,
  isOfflineMode: false
};

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes auto-lock

// ----------------------------------------------------------
// Initialization
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupEventListeners();
  await checkServerStatus();
  resetInactivityTimer();
});

// Detect dark/light theme preference
function initTheme() {
  const savedTheme = localStorage.getItem('securevault_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('securevault_theme', newTheme);
}

// ----------------------------------------------------------
// Server Status & Mode Detection
// ----------------------------------------------------------
async function checkServerStatus() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status endpoint failed');
    const data = await res.json();

    appState.isOfflineMode = false;
    const badge = document.getElementById('backendBadge');
    if (data.dbType === 'mongodb') {
      badge.textContent = '☁️ MongoDB Cloud Connected';
      badge.style.backgroundColor = 'rgba(46, 160, 67, 0.15)';
      badge.style.color = 'var(--success)';
      badge.style.borderColor = 'rgba(46, 160, 67, 0.3)';
    } else {
      badge.textContent = '💾 SQLite Database Connected';
      badge.style.backgroundColor = 'rgba(52, 152, 219, 0.15)';
      badge.style.color = 'var(--secondary)';
      badge.style.borderColor = 'rgba(52, 152, 219, 0.3)';
    }

    if (data.initialized) {
      appState.initialized = true;
      appState.salt = data.salt;
      showUnlockScreen();
    } else {
      appState.initialized = false;
      showSetupScreen();
    }
  } catch (err) {
    console.warn('Backend server not reachable, switching to Local Browser Storage mode:', err);
    appState.isOfflineMode = true;
    document.getElementById('backendBadge').textContent = 'Offline Browser Mode';
    document.getElementById('backendBadge').style.color = 'var(--warning)';

    // Check localStorage
    const localVault = localStorage.getItem('securevault_offline_vault');
    if (localVault) {
      const parsed = JSON.parse(localVault);
      appState.initialized = true;
      appState.salt = parsed.salt;
      showUnlockScreen();
    } else {
      appState.initialized = false;
      showSetupScreen();
    }
  }
}

// ----------------------------------------------------------
// Screen Navigation
// ----------------------------------------------------------
function showSetupScreen() {
  document.getElementById('authView').style.display = 'flex';
  document.getElementById('setupCard').style.display = 'block';
  document.getElementById('unlockCard').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'none';
}

function showUnlockScreen() {
  document.getElementById('authView').style.display = 'flex';
  document.getElementById('setupCard').style.display = 'none';
  document.getElementById('unlockCard').style.display = 'block';
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('unlockPassword').focus();
}

function showDashboardScreen() {
  document.getElementById('authView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'flex';
  renderCredentials();
  updateStats();
  document.getElementById('searchInput').value = '';
}

// ----------------------------------------------------------
// Event Listeners Setup
// ----------------------------------------------------------
function setupEventListeners() {
  // Setup Form
  const setupForm = document.getElementById('setupForm');
  const setupPw = document.getElementById('setupPassword');
  setupPw.addEventListener('input', () => {
    const val = setupPw.value;
    document.getElementById('setupCharCount').textContent = `${val.length} chars`;
    const check = VaultCrypto.checkPasswordStrength(val);
    const bar = document.getElementById('setupStrengthBar');
    const label = document.getElementById('setupStrengthLabel');

    bar.className = 'strength-bar-fill ' + (check.strength ? check.strength.toLowerCase() : '');
    label.textContent = check.strength || '—';
    label.className = check.strength ? check.strength.toLowerCase() : '';
  });

  setupForm.addEventListener('submit', handleSetupSubmit);

  // Unlock Form
  const unlockForm = document.getElementById('unlockForm');
  unlockForm.addEventListener('submit', handleUnlockSubmit);

  // Credential Form
  const credForm = document.getElementById('credentialForm');
  const credPw = document.getElementById('credPassword');
  credPw.addEventListener('input', () => {
    const val = credPw.value;
    const check = VaultCrypto.checkPasswordStrength(val);
    const bar = document.getElementById('credStrengthBar');
    const label = document.getElementById('credStrengthLabel');

    bar.className = 'strength-bar-fill ' + (check.strength ? check.strength.toLowerCase() : '');
    label.textContent = check.strength || '—';
    label.className = check.strength ? check.strength.toLowerCase() : '';
  });

  credForm.addEventListener('submit', handleSaveCredential);

  // Delete modal confirm button
  document.getElementById('confirmDeleteBtn').addEventListener('click', executeDeleteCredential);

  // Reset inactivity timer on user actions
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
}

// Inactivity Auto-lock
function resetInactivityTimer() {
  if (!appState.isUnlocked) return;
  clearTimeout(appState.inactivityTimer);
  appState.inactivityTimer = setTimeout(() => {
    if (appState.isUnlocked) {
      showToast('Vault locked automatically due to inactivity.', 'warning');
      lockVault();
    }
  }, INACTIVITY_TIMEOUT_MS);
}

// ----------------------------------------------------------
// Authentication Handlers
// ----------------------------------------------------------

// 1. Setup Master Password
async function handleSetupSubmit(e) {
  e.preventDefault();
  const password = document.getElementById('setupPassword').value;
  const confirmPassword = document.getElementById('setupConfirmPassword').value;
  const statusDiv = document.getElementById('setupStatus');

  if (password !== confirmPassword) {
    showStatusMessage(statusDiv, 'Passwords do not match', 'error');
    return;
  }

  if (password.length < 8) {
    showStatusMessage(statusDiv, 'Master Password must be at least 8 characters', 'error');
    return;
  }

  try {
    const submitBtn = document.getElementById('setupSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Deriving Keys & Initializing...';

    // 1. Compute SHA-256 hash for authentication verification
    const passwordHash = await VaultCrypto.sha256(password);

    // 2. Generate random 16-byte salt
    const salt = VaultCrypto.generateSalt();

    // 3. Derive 256-bit AES key (PBKDF2 65,536 iterations)
    const sessionKey = await VaultCrypto.deriveKey(password, salt);

    if (appState.isOfflineMode) {
      // Save in localStorage
      localStorage.setItem('securevault_offline_vault', JSON.stringify({
        passwordHash,
        salt,
        credentials: []
      }));
    } else {
      // Save on server
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordHash, salt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to setup master password');
    }

    // Set state
    appState.initialized = true;
    appState.isUnlocked = true;
    appState.sessionKey = sessionKey;
    appState.salt = salt;
    appState.masterPasswordHash = passwordHash;
    appState.credentials = [];

    showToast('Vault initialized successfully!', 'success');
    showDashboardScreen();
  } catch (err) {
    console.error('Setup error:', err);
    showStatusMessage(statusDiv, err.message, 'error');
  } finally {
    const submitBtn = document.getElementById('setupSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Set Master Password & Initialize Vault';
  }
}

// 2. Unlock Vault
async function handleUnlockSubmit(e) {
  e.preventDefault();
  const password = document.getElementById('unlockPassword').value;
  const statusDiv = document.getElementById('unlockStatus');
  const card = document.getElementById('unlockCard');

  if (!password) {
    showStatusMessage(statusDiv, 'Please enter your Master Password', 'error');
    return;
  }

  try {
    const submitBtn = document.getElementById('unlockSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Decrypting Vault...';

    // Compute SHA-256 hash
    const passwordHash = await VaultCrypto.sha256(password);
    let salt = appState.salt;

    if (appState.isOfflineMode) {
      const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
      if (localVault.passwordHash !== passwordHash) {
        throw new Error('Incorrect Master Password');
      }
      salt = localVault.salt;
    } else {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordHash })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Incorrect Master Password');
      }
      salt = data.salt;
    }

    // Derive session key in browser memory
    const sessionKey = await VaultCrypto.deriveKey(password, salt);

    appState.isUnlocked = true;
    appState.sessionKey = sessionKey;
    appState.salt = salt;
    appState.masterPasswordHash = passwordHash;

    // Load and decrypt credentials
    await loadAndDecryptCredentials();

    document.getElementById('unlockPassword').value = '';
    showToast('Vault unlocked successfully!', 'success');
    showDashboardScreen();
  } catch (err) {
    console.error('Unlock error:', err);
    showStatusMessage(statusDiv, err.message, 'error');
    card.classList.remove('shake');
    void card.offsetWidth; // Trigger reflow
    card.classList.add('shake');
  } finally {
    const submitBtn = document.getElementById('unlockSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Unlock Vault';
  }
}

// 3. Lock Vault
function lockVault() {
  appState.isUnlocked = false;
  appState.sessionKey = null; // Key garbage collected, inaccessible
  appState.credentials = [];
  appState.filteredCredentials = [];
  appState.revealedSet.clear();
  appState.editingId = null;

  clearTimeout(appState.inactivityTimer);
  clearClipboardCountdown();

  // Clear form fields
  document.getElementById('credentialForm').reset();
  cancelEdit();

  showToast('Vault locked. Session key purged from memory.', 'warning');
  showUnlockScreen();
}

// ----------------------------------------------------------
// Credentials Operations
// ----------------------------------------------------------

// Fetch and decrypt credentials
async function loadAndDecryptCredentials() {
  let rawList = [];

  if (appState.isOfflineMode) {
    const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
    rawList = localVault.credentials || [];
  } else {
    const res = await fetch('/api/credentials');
    if (!res.ok) throw new Error('Failed to load credentials from database');
    const data = await res.json();
    rawList = data.credentials || [];
  }

  const decryptedList = [];
  for (const item of rawList) {
    try {
      const decryptedPassword = await VaultCrypto.decrypt(item.encryptedPassword, appState.sessionKey);
      const strengthCheck = VaultCrypto.checkPasswordStrength(decryptedPassword);
      decryptedList.push({
        id: item.id,
        website: item.website,
        username: item.username,
        password: decryptedPassword,
        encryptedPassword: item.encryptedPassword,
        createdAt: item.createdAt,
        strength: strengthCheck.strength
      });
    } catch (decryptErr) {
      console.error(`Failed to decrypt credential id ${item.id}:`, decryptErr);
      decryptedList.push({
        id: item.id,
        website: item.website,
        username: item.username,
        password: '[Decryption Error]',
        encryptedPassword: item.encryptedPassword,
        createdAt: item.createdAt,
        strength: 'Weak'
      });
    }
  }

  appState.credentials = decryptedList;
  appState.filteredCredentials = [...decryptedList];
}

// Save Credential (Add or Edit)
async function handleSaveCredential(e) {
  e.preventDefault();
  const website = document.getElementById('credWebsite').value.trim();
  const username = document.getElementById('credUsername').value.trim();
  const password = document.getElementById('credPassword').value;
  const editingId = appState.editingId;

  if (!website || !username || !password) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  try {
    const saveBtn = document.getElementById('saveCredBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Encrypting & Saving...';

    // Encrypt password using AES-256-CBC with random 16-byte IV
    const encryptedPassword = await VaultCrypto.encrypt(password, appState.sessionKey);
    const strengthCheck = VaultCrypto.checkPasswordStrength(password);

    if (editingId) {
      // Update existing
      if (appState.isOfflineMode) {
        const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
        const idx = (localVault.credentials || []).findIndex(c => c.id === editingId);
        if (idx !== -1) {
          localVault.credentials[idx] = {
            ...localVault.credentials[idx],
            website,
            username,
            encryptedPassword
          };
          localStorage.setItem('securevault_offline_vault', JSON.stringify(localVault));
        }
      } else {
        const res = await fetch(`/api/credentials/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website, username, encryptedPassword })
        });
        if (!res.ok) throw new Error('Failed to update credential');
      }

      // Update in-memory state
      const targetIndex = appState.credentials.findIndex(c => c.id === editingId);
      if (targetIndex !== -1) {
        appState.credentials[targetIndex] = {
          ...appState.credentials[targetIndex],
          website,
          username,
          password,
          encryptedPassword,
          strength: strengthCheck.strength
        };
      }

      showToast(`Updated credential for ${website}`, 'success');
      cancelEdit();
    } else {
      // Add new
      let newId = Date.now();
      const createdAt = new Date().toISOString();

      if (appState.isOfflineMode) {
        const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
        localVault.credentials = localVault.credentials || [];
        localVault.credentials.unshift({ id: newId, website, username, encryptedPassword, createdAt });
        localStorage.setItem('securevault_offline_vault', JSON.stringify(localVault));
      } else {
        const res = await fetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website, username, encryptedPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save credential');
        newId = data.credential.id;
      }

      appState.credentials.unshift({
        id: newId,
        website,
        username,
        password,
        encryptedPassword,
        createdAt,
        strength: strengthCheck.strength
      });

      showToast(`Saved credential for ${website}`, 'success');
    }

    // Reset form
    document.getElementById('credentialForm').reset();
    document.getElementById('credStrengthBar').className = 'strength-bar-fill';
    document.getElementById('credStrengthLabel').textContent = '—';
    document.getElementById('credStrengthLabel').className = '';

    handleSearch();
    updateStats();
  } catch (err) {
    console.error('Save credential error:', err);
    showToast(err.message, 'danger');
  } finally {
    const saveBtn = document.getElementById('saveCredBtn');
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Save Credential';
  }
}

// Edit Credential
function editCredential(id) {
  const cred = appState.credentials.find(c => c.id === id);
  if (!cred) return;

  appState.editingId = id;
  document.getElementById('editingId').value = id;
  document.getElementById('credWebsite').value = cred.website;
  document.getElementById('credUsername').value = cred.username;
  document.getElementById('credPassword').value = cred.password;

  // Trigger strength check
  const check = VaultCrypto.checkPasswordStrength(cred.password);
  const bar = document.getElementById('credStrengthBar');
  const label = document.getElementById('credStrengthLabel');
  bar.className = 'strength-bar-fill ' + check.strength.toLowerCase();
  label.textContent = check.strength;
  label.className = check.strength.toLowerCase();

  // Update Form Card header
  document.getElementById('formCardIcon').textContent = '✏️';
  document.getElementById('formCardTitle').textContent = `Editing Credential: ${cred.website}`;
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  document.getElementById('saveCredBtn').textContent = '💾 Update Credential';

  // Scroll to form
  document.getElementById('credentialFormCard').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  appState.editingId = null;
  document.getElementById('editingId').value = '';
  document.getElementById('formCardIcon').textContent = '➕';
  document.getElementById('formCardTitle').textContent = 'Add New Credential';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('saveCredBtn').textContent = '💾 Save Credential';
  document.getElementById('credentialForm').reset();
  document.getElementById('credStrengthBar').className = 'strength-bar-fill';
  document.getElementById('credStrengthLabel').textContent = '—';
}

// Delete Credential Prompt
function promptDeleteCredential(id) {
  const cred = appState.credentials.find(c => c.id === id);
  if (!cred) return;

  appState.deleteTargetId = id;
  document.getElementById('deleteTargetWebsite').textContent = cred.website;
  openModal('deleteModal');
}

async function executeDeleteCredential() {
  const id = appState.deleteTargetId;
  if (!id) return;

  try {
    if (appState.isOfflineMode) {
      const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
      localVault.credentials = (localVault.credentials || []).filter(c => c.id !== id);
      localStorage.setItem('securevault_offline_vault', JSON.stringify(localVault));
    } else {
      const res = await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete credential');
    }

    appState.credentials = appState.credentials.filter(c => c.id !== id);
    if (appState.editingId === id) cancelEdit();

    closeModal('deleteModal');
    showToast('Credential deleted', 'success');
    handleSearch();
    updateStats();
  } catch (err) {
    console.error('Delete error:', err);
    showToast(err.message, 'danger');
  }
}

// ----------------------------------------------------------
// Clipboard & 10-Second Auto-Clear Feature
// ----------------------------------------------------------
function copyPasswordWithAutoClear(password, website) {
  navigator.clipboard.writeText(password).then(() => {
    showToast(`Password for ${website} copied to clipboard!`, 'success');
    startClipboardCountdown();
  }).catch(err => {
    console.error('Clipboard copy error:', err);
    showToast('Failed to copy to clipboard', 'danger');
  });
}

function copyUsername(username) {
  navigator.clipboard.writeText(username).then(() => {
    showToast('Username copied to clipboard!', 'success');
  }).catch(err => {
    showToast('Failed to copy username', 'danger');
  });
}

function startClipboardCountdown() {
  clearClipboardCountdown();

  let secondsRemaining = 10;
  const banner = document.getElementById('clipboardBanner');
  const timerLabel = document.getElementById('clipboardTimer');

  banner.style.display = 'flex';
  timerLabel.textContent = `${secondsRemaining}s`;

  appState.clipboardCountdown = setInterval(() => {
    secondsRemaining--;
    timerLabel.textContent = `${secondsRemaining}s`;

    if (secondsRemaining <= 0) {
      clearClipboardCountdown();
      // Auto-clear clipboard for security
      navigator.clipboard.writeText('').then(() => {
        showToast('Clipboard cleared automatically for security.', 'warning');
      }).catch(() => {});
    }
  }, 1000);
}

function clearClipboardCountdown() {
  if (appState.clipboardCountdown) {
    clearInterval(appState.clipboardCountdown);
    appState.clipboardCountdown = null;
  }
  const banner = document.getElementById('clipboardBanner');
  if (banner) banner.style.display = 'none';
}

// Toggle inline password visibility in table
function toggleInlinePassword(id) {
  if (appState.revealedSet.has(id)) {
    appState.revealedSet.delete(id);
  } else {
    appState.revealedSet.add(id);
  }
  renderCredentials();
}

// ----------------------------------------------------------
// Rendering & UI Updates
// ----------------------------------------------------------
function renderCredentials() {
  const tbody = document.getElementById('credentialsListBody');
  const emptyState = document.getElementById('emptyState');
  const list = appState.filteredCredentials;

  tbody.innerHTML = '';

  if (list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  list.forEach(cred => {
    const isRevealed = appState.revealedSet.has(cred.id);
    const domain = extractDomain(cred.website);
    const firstLetter = (cred.website || '?').charAt(0).toUpperCase();

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="site-cell">
          <div class="site-favicon">
            <img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64" 
                 onerror="this.onerror=null; this.parentElement.innerText='${firstLetter}';" 
                 alt="${escapeHtml(cred.website)}" />
          </div>
          <div class="site-info">
            <span class="site-name">${escapeHtml(cred.website)}</span>
          </div>
        </div>
      </td>
      <td>
        <span>${escapeHtml(cred.username)}</span>
        <button class="action-icon-btn" style="width: 22px; height: 22px; font-size: 11px; margin-left: 6px;" 
                onclick="copyUsername('${escapeJs(cred.username)}')" title="Copy Username">📋</button>
      </td>
      <td>
        ${isRevealed
          ? `<span class="password-revealed">${escapeHtml(cred.password)}</span>`
          : `<span class="password-masked">••••••••••••</span>`
        }
      </td>
      <td>
        <span class="strength-text ${cred.strength ? cred.strength.toLowerCase() : ''}" style="margin-top: 0; font-size: 11px;">
          ${escapeHtml(cred.strength || 'Weak')}
        </span>
      </td>
      <td>
        <span class="site-date">${formatDate(cred.createdAt)}</span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="action-icon-btn copy" onclick="copyPasswordWithAutoClear('${escapeJs(cred.password)}', '${escapeJs(cred.website)}')" title="Copy Password (10s auto-clear)">
            📋
          </button>
          <button class="action-icon-btn" onclick="toggleInlinePassword('${escapeJs(cred.id)}')" title="${isRevealed ? 'Hide' : 'Reveal'} Password">
            ${isRevealed ? '🙈' : '👁️'}
          </button>
          <button class="action-icon-btn" onclick="editCredential('${escapeJs(cred.id)}')" title="Edit Credential">
            ✏️
          </button>
          <button class="action-icon-btn delete" onclick="promptDeleteCredential('${escapeJs(cred.id)}')" title="Delete Credential">
            🗑️
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateStats() {
  const list = appState.credentials;
  document.getElementById('statTotal').textContent = list.length;
  document.getElementById('statStrong').textContent = list.filter(c => c.strength === 'Strong').length;
  document.getElementById('statMedium').textContent = list.filter(c => c.strength === 'Medium').length;
  document.getElementById('statWeak').textContent = list.filter(c => c.strength === 'Weak' || !c.strength).length;
}

function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!query) {
    appState.filteredCredentials = [...appState.credentials];
  } else {
    appState.filteredCredentials = appState.credentials.filter(c =>
      c.website.toLowerCase().includes(query) ||
      c.username.toLowerCase().includes(query)
    );
  }
  handleSort();
}

function handleSort() {
  const sortMode = document.getElementById('sortSelect').value;
  appState.filteredCredentials.sort((a, b) => {
    if (sortMode === 'dateDesc') return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
    if (sortMode === 'dateAsc') return (new Date(a.createdAt || 0)) - (new Date(b.createdAt || 0));
    if (sortMode === 'alphaAsc') return a.website.localeCompare(b.website);
    if (sortMode === 'alphaDesc') return b.website.localeCompare(a.website);
    return 0;
  });
  renderCredentials();
}

// ----------------------------------------------------------
// Password Generator Modal Logic
// ----------------------------------------------------------
function openGeneratorModal() {
  regeneratePassword();
  openModal('generatorModal');
}

function updateGenLength(val) {
  document.getElementById('genLengthVal').textContent = val;
  regeneratePassword();
}

function regeneratePassword() {
  const length = parseInt(document.getElementById('genLength').value, 10);
  const includeUpper = document.getElementById('genUpper').checked;
  const includeLower = document.getElementById('genLower').checked;
  const includeDigits = document.getElementById('genDigits').checked;
  const includeSymbols = document.getElementById('genSymbols').checked;
  const excludeAmbiguous = document.getElementById('genAmbiguous').checked;

  const password = VaultCrypto.generatePassword({
    length,
    includeUpper,
    includeLower,
    includeDigits,
    includeSymbols,
    excludeAmbiguous
  });

  document.getElementById('genResult').value = password;
  const check = VaultCrypto.checkPasswordStrength(password);
  const bar = document.getElementById('genStrengthBar');
  const label = document.getElementById('genStrengthLabel');

  bar.className = 'strength-bar-fill ' + check.strength.toLowerCase();
  label.textContent = check.strength;
  label.className = check.strength.toLowerCase();
}

function copyGeneratedPassword() {
  const pw = document.getElementById('genResult').value;
  navigator.clipboard.writeText(pw).then(() => {
    showToast('Generated password copied to clipboard!', 'success');
  });
}

function applyGeneratedPassword() {
  const pw = document.getElementById('genResult').value;
  document.getElementById('credPassword').value = pw;

  // Trigger strength indicator on form
  const check = VaultCrypto.checkPasswordStrength(pw);
  const bar = document.getElementById('credStrengthBar');
  const label = document.getElementById('credStrengthLabel');
  bar.className = 'strength-bar-fill ' + check.strength.toLowerCase();
  label.textContent = check.strength;
  label.className = check.strength.toLowerCase();

  closeModal('generatorModal');
  showToast('Generated password inserted into form', 'success');
}

// ----------------------------------------------------------
// Educational Raw Encrypted Viewer Modal
// ----------------------------------------------------------
function openEncryptedViewerModal() {
  const select = document.getElementById('encryptedSelect');
  select.innerHTML = '';

  if (appState.credentials.length === 0) {
    select.innerHTML = '<option value="">No credentials available</option>';
    document.getElementById('encryptedIV').textContent = '—';
    document.getElementById('encryptedCipher').textContent = '—';
    document.getElementById('encryptedCombined').textContent = '—';
  } else {
    appState.credentials.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.website} (${c.username})`;
      select.appendChild(opt);
    });
    displayEncryptedDetails();
  }

  openModal('encryptedModal');
}

function displayEncryptedDetails() {
  const select = document.getElementById('encryptedSelect');
  const selectedId = select.value;
  const cred = appState.credentials.find(c => String(c.id) === String(selectedId));

  if (!cred || !cred.encryptedPassword) {
    document.getElementById('encryptedIV').textContent = '—';
    document.getElementById('encryptedCipher').textContent = '—';
    document.getElementById('encryptedCombined').textContent = '—';
    return;
  }

  const parts = cred.encryptedPassword.split(':');
  document.getElementById('encryptedIV').textContent = parts[0] || '—';
  document.getElementById('encryptedCipher').textContent = parts[1] || '—';
  document.getElementById('encryptedCombined').textContent = cred.encryptedPassword;
}

// ----------------------------------------------------------
// Change Master Password Logic
// ----------------------------------------------------------
function openChangePasswordModal() {
  document.getElementById('changePasswordForm').reset();
  document.getElementById('changePassStatus').style.display = 'none';
  openModal('changePasswordModal');
}

async function submitChangePassword() {
  const currentPassword = document.getElementById('currentMasterPass').value;
  const newPassword = document.getElementById('newMasterPass').value;
  const confirmNew = document.getElementById('confirmNewMasterPass').value;
  const statusDiv = document.getElementById('changePassStatus');

  if (!currentPassword || !newPassword || !confirmNew) {
    showStatusMessage(statusDiv, 'Please fill in all fields', 'error');
    return;
  }

  if (newPassword !== confirmNew) {
    showStatusMessage(statusDiv, 'New passwords do not match', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showStatusMessage(statusDiv, 'New password must be at least 8 characters', 'error');
    return;
  }

  if (currentPassword === newPassword) {
    showStatusMessage(statusDiv, 'New password must be different from current password', 'error');
    return;
  }

  try {
    // 1. Verify current password
    const currentHash = await VaultCrypto.sha256(currentPassword);
    if (currentHash !== appState.masterPasswordHash) {
      showStatusMessage(statusDiv, 'Current password is incorrect', 'error');
      return;
    }

    // 2. Generate new salt & derive new session key
    const newSalt = VaultCrypto.generateSalt();
    const newSessionKey = await VaultCrypto.deriveKey(newPassword, newSalt);
    const newPasswordHash = await VaultCrypto.sha256(newPassword);

    // 3. Re-encrypt all stored credentials with the new key
    const reEncrypted = [];
    for (const cred of appState.credentials) {
      const newEncryptedPassword = await VaultCrypto.encrypt(cred.password, newSessionKey);
      reEncrypted.push({ id: cred.id, encryptedPassword: newEncryptedPassword });
    }

    if (appState.isOfflineMode) {
      const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
      localVault.passwordHash = newPasswordHash;
      localVault.salt = newSalt;
      localVault.credentials = localVault.credentials.map(c => {
        const found = reEncrypted.find(r => r.id === c.id);
        return found ? { ...c, encryptedPassword: found.encryptedPassword } : c;
      });
      localStorage.setItem('securevault_offline_vault', JSON.stringify(localVault));
    } else {
      const res = await fetch('/api/change-master-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPasswordHash: currentHash,
          newPasswordHash,
          newSalt,
          reEncryptedCredentials: reEncrypted
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update master password');
    }

    // Update in-memory state with new session key and hash
    appState.sessionKey = newSessionKey;
    appState.salt = newSalt;
    appState.masterPasswordHash = newPasswordHash;
    appState.credentials = appState.credentials.map(c => {
      const found = reEncrypted.find(r => r.id === c.id);
      return found ? { ...c, encryptedPassword: found.encryptedPassword } : c;
    });

    closeModal('changePasswordModal');
    showToast('Master Password changed and credentials re-encrypted!', 'success');
  } catch (err) {
    console.error('Change master password error:', err);
    showStatusMessage(statusDiv, err.message, 'error');
  }
}

// ----------------------------------------------------------
// Export & Import Backup
// ----------------------------------------------------------

// Direct download of Backup.txt matching Java VaultFH format
function exportBackupText() {
  if (appState.credentials.length === 0) {
    showToast('No credentials to export', 'warning');
    return;
  }

  let text = '';
  appState.credentials.forEach(c => {
    text += `Website: ${c.website}\n`;
    text += `Username: ${c.username}\n`;
    text += `Password: ${c.password}\n`;
    text += `-------------------------------\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Backup.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${appState.credentials.length} credentials to Backup.txt`, 'success');
}

function openExportModal() {
  exportBackupText();
}

function openImportModal() {
  document.getElementById('importText').value = '';
  document.getElementById('importFileInput').value = '';
  openModal('importModal');
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('importText').value = e.target.result;
  };
  reader.readAsText(file);
}

async function submitImport() {
  const content = document.getElementById('importText').value.trim();
  if (!content) {
    showToast('Please provide backup text or select a file', 'warning');
    return;
  }

  try {
    const parsed = parseBackupText(content);
    if (parsed.length === 0) {
      showToast('No valid credentials found in content', 'warning');
      return;
    }

    const encryptedBatch = [];
    const now = new Date().toISOString();

    for (const item of parsed) {
      const encryptedPassword = await VaultCrypto.encrypt(item.password, appState.sessionKey);
      encryptedBatch.push({
        website: item.website,
        username: item.username,
        encryptedPassword,
        createdAt: now
      });
    }

    if (appState.isOfflineMode) {
      const localVault = JSON.parse(localStorage.getItem('securevault_offline_vault') || '{}');
      localVault.credentials = localVault.credentials || [];
      encryptedBatch.forEach(b => {
        localVault.credentials.unshift({ id: Date.now() + Math.random(), ...b });
      });
      localStorage.setItem('securevault_offline_vault', JSON.stringify(localVault));
    } else {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: encryptedBatch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed on server');
    }

    // Refresh credentials list
    await loadAndDecryptCredentials();
    closeModal('importModal');
    showToast(`Successfully imported ${parsed.length} credentials!`, 'success');
    handleSearch();
    updateStats();
  } catch (err) {
    console.error('Import error:', err);
    showToast(err.message, 'danger');
  }
}

// Parses Backup.txt format or JSON format
function parseBackupText(text) {
  // Try JSON first
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) return json;
      if (json.credentials && Array.isArray(json.credentials)) return json.credentials;
    } catch (_) {}
  }

  // Parse text block format
  const blocks = text.split(/---+/);
  const results = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let website = '', username = '', password = '';

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.startsWith('website:')) {
        website = line.substring(8).trim();
      } else if (lower.startsWith('username:')) {
        username = line.substring(9).trim();
      } else if (lower.startsWith('password:')) {
        password = line.substring(9).trim();
      }
    }

    if (website && username && password) {
      results.push({ website, username, password });
    }
  }

  return results;
}

// ----------------------------------------------------------
// UI Helpers & Utilities
// ----------------------------------------------------------
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

function switchNav(nav) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeBtn = event.currentTarget;
  if (activeBtn) activeBtn.classList.add('active');

  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

function showStatusMessage(container, message, type) {
  container.style.display = 'block';
  container.className = `form-group ${type === 'error' ? 'strength-text weak' : 'strength-text strong'}`;
  container.textContent = message;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✅' : type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function extractDomain(url) {
  try {
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const parsed = new URL(clean);
    return parsed.hostname;
  } catch (_) {
    return url;
  }
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return isoString;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '';
  return str.toString()
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}
