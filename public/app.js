/**
 * SecureVault Web Application (Multi-Account Edition)
 * Client-side Controller & Zero-Knowledge State Management
 */

// Application State
let appState = {
  currentUser: null,       // { id, email, salt }
  isUnlocked: false,
  sessionKey: null,        // 256-bit AES key in tab memory only
  masterPasswordHash: null,// SHA-256 hash in tab memory only
  credentials: [],         // Decrypted credentials for current user
  filteredCredentials: [],
  revealedSet: new Set(),  // Set of credential IDs with visible passwords
  editingId: null,
  deleteTargetId: null,
  clipboardCountdown: null,
  inactivityTimer: null,
  isOfflineMode: false,
  knownAccounts: []        // Cached list of known accounts [{ id, email }]
};

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes auto-lock

// ----------------------------------------------------------
// Initialization
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  loadKnownAccounts();
  setupEventListeners();
  await checkServerStatus();
  resetInactivityTimer();
});

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
// Known Accounts Management (Local Cache & Autocomplete)
// ----------------------------------------------------------
function loadKnownAccounts() {
  try {
    const raw = localStorage.getItem('securevault_known_accounts');
    appState.knownAccounts = raw ? JSON.parse(raw) : [];
  } catch (_) {
    appState.knownAccounts = [];
  }
  refreshAccountsDatalist();
}

function saveKnownAccount(id, email) {
  const normalized = email.trim().toLowerCase();
  const existingIndex = appState.knownAccounts.findIndex(a => a.email === normalized);
  if (existingIndex !== -1) {
    appState.knownAccounts[existingIndex].id = id;
  } else {
    appState.knownAccounts.unshift({ id, email: normalized });
  }
  localStorage.setItem('securevault_known_accounts', JSON.stringify(appState.knownAccounts));
  refreshAccountsDatalist();
}

function refreshAccountsDatalist() {
  const datalist = document.getElementById('recentAccountsList');
  if (!datalist) return;
  datalist.innerHTML = '';
  appState.knownAccounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.email;
    datalist.appendChild(opt);
  });
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

    if (Array.isArray(data.recentAccounts)) {
      data.recentAccounts.forEach(acc => saveKnownAccount(acc.id, acc.email));
    }

    // If accounts exist, default to Login tab. If none exist, default to Register tab.
    if (data.hasUsers || appState.knownAccounts.length > 0) {
      switchAuthTab('login');
      if (appState.knownAccounts.length > 0) {
        const loginEmailInput = document.getElementById('loginEmail');
        if (loginEmailInput && !loginEmailInput.value) {
          loginEmailInput.value = appState.knownAccounts[0].email;
        }
      }
    } else {
      switchAuthTab('register');
    }
  } catch (err) {
    console.warn('Backend server not reachable, switching to Local Browser Storage mode:', err);
    appState.isOfflineMode = true;
    const badge = document.getElementById('backendBadge');
    badge.textContent = 'Offline Browser Mode';
    badge.style.backgroundColor = 'rgba(243, 156, 18, 0.15)';
    badge.style.color = 'var(--warning)';

    const offlineVaults = getOfflineVaults();
    if (Object.keys(offlineVaults).length > 0) {
      switchAuthTab('login');
    } else {
      switchAuthTab('register');
    }
  }
}

// ----------------------------------------------------------
// Auth Tab Switching
// ----------------------------------------------------------
function switchAuthTab(tab) {
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');

  document.getElementById('loginStatus').style.display = 'none';
  document.getElementById('registerStatus').style.display = 'none';

  if (tab === 'login') {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    authTitle.textContent = 'Unlock Secure Vault';
    authSubtitle.textContent = 'Select your account and enter your Master Password';
    setTimeout(() => {
      const emailInput = document.getElementById('loginEmail');
      const pwInput = document.getElementById('loginPassword');
      if (emailInput.value) pwInput.focus();
      else emailInput.focus();
    }, 50);
  } else {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authTitle.textContent = 'Create New Account';
    authSubtitle.textContent = 'Set a unique account name and your own independent Master Password';
    setTimeout(() => document.getElementById('registerEmail').focus(), 50);
  }
}

function showAuthScreen() {
  document.getElementById('authView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
}

function showDashboardScreen() {
  document.getElementById('authView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'flex';

  // Update User Chip & Sidebar profile
  const email = appState.currentUser.email || 'User';
  document.getElementById('currentUserEmail').textContent = email;
  document.getElementById('sidebarUserEmail').textContent = email;
  document.getElementById('userAvatarLetter').textContent = email.charAt(0).toUpperCase();

  renderCredentials();
  updateStats();
  document.getElementById('searchInput').value = '';
}

// ----------------------------------------------------------
// Event Listeners Setup
// ----------------------------------------------------------
function setupEventListeners() {
  // Register Form Strength Meter
  const regPw = document.getElementById('registerPassword');
  regPw.addEventListener('input', () => {
    const val = regPw.value;
    document.getElementById('registerCharCount').textContent = `${val.length} chars`;
    const check = VaultCrypto.checkPasswordStrength(val);
    const bar = document.getElementById('registerStrengthBar');
    const label = document.getElementById('registerStrengthLabel');

    bar.className = 'strength-bar-fill ' + (check.strength ? check.strength.toLowerCase() : '');
    label.textContent = check.strength || '—';
    label.className = check.strength ? check.strength.toLowerCase() : '';
  });

  // Forms
  document.getElementById('registerForm').addEventListener('submit', handleRegisterSubmit);
  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);

  // Credential Form Strength Meter
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

  document.getElementById('credentialForm').addEventListener('submit', handleSaveCredential);
  document.getElementById('confirmDeleteBtn').addEventListener('click', executeDeleteCredential);

  // Inactivity tracking
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
}

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
// Authentication: Register & Login (Multi-Account)
// ----------------------------------------------------------

// 1. Register New Account (New Master Password)
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const statusDiv = document.getElementById('registerStatus');

  if (!email) {
    showStatusMessage(statusDiv, 'Please provide an account name or email', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showStatusMessage(statusDiv, 'Passwords do not match', 'error');
    return;
  }

  if (password.length < 8) {
    showStatusMessage(statusDiv, 'Master Password must be at least 8 characters', 'error');
    return;
  }

  try {
    const submitBtn = document.getElementById('registerSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Deriving Keys & Creating Account...';

    // 1. Derive zero-knowledge cryptographic parameters client-side
    const passwordHash = await VaultCrypto.sha256(password);
    const salt = VaultCrypto.generateSalt();
    const sessionKey = await VaultCrypto.deriveKey(password, salt);

    let userId = 'user_' + Date.now();

    if (appState.isOfflineMode) {
      const vaults = getOfflineVaults();
      const normEmail = email.toLowerCase();
      if (vaults[normEmail]) {
        throw new Error('An account with this email/name already exists offline');
      }
      vaults[normEmail] = {
        userId,
        email: normEmail,
        passwordHash,
        salt,
        credentials: []
      };
      saveOfflineVaults(vaults);
    } else {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash, salt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      userId = data.userId;
    }

    // Set authenticated state
    appState.isUnlocked = true;
    appState.currentUser = { id: userId, email: email.toLowerCase(), salt };
    appState.sessionKey = sessionKey;
    appState.masterPasswordHash = passwordHash;
    appState.credentials = [];
    appState.filteredCredentials = [];

    saveKnownAccount(userId, email);
    document.getElementById('registerForm').reset();

    showToast(`Account created! Welcome to your vault, ${email}`, 'success');
    showDashboardScreen();
  } catch (err) {
    console.error('Register error:', err);
    showStatusMessage(statusDiv, err.message, 'error');
  } finally {
    const submitBtn = document.getElementById('registerSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account & Initialize Vault';
  }
}

// 2. Log In / Unlock Existing Account
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const statusDiv = document.getElementById('loginStatus');
  const card = document.getElementById('authCard');

  if (!email || !password) {
    showStatusMessage(statusDiv, 'Please enter both your account name and Master Password', 'error');
    return;
  }

  try {
    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying & Decrypting...';

    const passwordHash = await VaultCrypto.sha256(password);
    let userId = null;
    let salt = null;

    if (appState.isOfflineMode) {
      const vaults = getOfflineVaults();
      const userVault = vaults[email.toLowerCase()];
      if (!userVault) throw new Error('Account not found in offline storage');
      if (userVault.passwordHash !== passwordHash) throw new Error('Incorrect Master Password');
      userId = userVault.userId;
      salt = userVault.salt;
    } else {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordHash })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Incorrect Master Password');
      }
      userId = data.userId;
      salt = data.salt;
    }

    // Derive session key in browser memory only
    const sessionKey = await VaultCrypto.deriveKey(password, salt);

    appState.isUnlocked = true;
    appState.currentUser = { id: userId, email: email.toLowerCase(), salt };
    appState.sessionKey = sessionKey;
    appState.masterPasswordHash = passwordHash;

    saveKnownAccount(userId, email);

    // Fetch and decrypt this user's vault
    await loadAndDecryptCredentials();

    document.getElementById('loginPassword').value = '';
    showToast(`Welcome back, ${email}! Vault unlocked.`, 'success');
    showDashboardScreen();
  } catch (err) {
    console.error('Login error:', err);
    showStatusMessage(statusDiv, err.message, 'error');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  } finally {
    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Unlock Vault';
  }
}

// 3. Lock Vault
function lockVault() {
  appState.isUnlocked = false;
  appState.sessionKey = null; // Purge session key from memory
  appState.masterPasswordHash = null;
  appState.credentials = [];
  appState.filteredCredentials = [];
  appState.revealedSet.clear();
  appState.editingId = null;

  clearTimeout(appState.inactivityTimer);
  clearClipboardCountdown();

  document.getElementById('credentialForm').reset();
  cancelEdit();

  showToast('Vault locked securely. Session key wiped from memory.', 'warning');
  showAuthScreen();
  switchAuthTab('login');
}

// ----------------------------------------------------------
// Multi-Account Switcher Modal
// ----------------------------------------------------------
function promptSwitchAccount() {
  const container = document.getElementById('modalAccountsList');
  container.innerHTML = '';

  if (appState.knownAccounts.length === 0) {
    container.innerHTML = '<p style="font-size: 13px; color: var(--text-dim);">No saved accounts on this device yet.</p>';
  } else {
    appState.knownAccounts.forEach(acc => {
      const isCurrent = appState.currentUser && appState.currentUser.email === acc.email;
      const row = document.createElement('div');
      row.className = 'stat-card';
      row.style.cursor = 'pointer';
      row.style.padding = '12px 16px';
      row.style.marginBottom = '6px';
      row.style.border = isCurrent ? '1px solid var(--primary)' : '1px solid var(--border-color)';
      row.innerHTML = `
        <div class="user-avatar-chip" style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff;">
          ${escapeHtml(acc.email.charAt(0).toUpperCase())}
        </div>
        <div style="flex-grow: 1; overflow: hidden;">
          <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">${escapeHtml(acc.email)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${isCurrent ? '● Active Session' : 'Click to switch to this account'}</div>
        </div>
        ${isCurrent ? '<span style="font-size: 11px; color: var(--primary); font-weight: bold;">Current</span>' : '<button class="btn btn-outline btn-sm" style="padding: 4px 10px;">Switch</button>'}
      `;
      row.onclick = () => {
        if (!isCurrent) prepareSwitchToAccount('account', acc.email);
        else closeModal('switchAccountModal');
      };
      container.appendChild(row);
    });
  }

  openModal('switchAccountModal');
}

function prepareSwitchToAccount(type, email) {
  closeModal('switchAccountModal');
  lockVault();

  if (type === 'new') {
    switchAuthTab('register');
  } else if (type === 'other') {
    switchAuthTab('login');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginEmail').focus();
  } else if (email) {
    switchAuthTab('login');
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').focus();
  }
}

// ----------------------------------------------------------
// Credentials Operations (Scoped by Active User)
// ----------------------------------------------------------

// Fetch and decrypt credentials for active user
async function loadAndDecryptCredentials() {
  if (!appState.currentUser) return;
  const userId = appState.currentUser.id;
  let rawList = [];

  if (appState.isOfflineMode) {
    const vaults = getOfflineVaults();
    const userVault = vaults[appState.currentUser.email];
    rawList = userVault ? (userVault.credentials || []) : [];
  } else {
    const res = await fetch(`/api/credentials?userId=${encodeURIComponent(userId)}`, {
      headers: { 'X-User-Id': userId }
    });
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
      console.error(`Decryption error on credential ${item.id}:`, decryptErr);
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
  if (!appState.currentUser) return;

  const userId = appState.currentUser.id;
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

    const encryptedPassword = await VaultCrypto.encrypt(password, appState.sessionKey);
    const strengthCheck = VaultCrypto.checkPasswordStrength(password);

    if (editingId) {
      // Update existing
      if (appState.isOfflineMode) {
        const vaults = getOfflineVaults();
        const userVault = vaults[appState.currentUser.email];
        if (userVault) {
          const idx = (userVault.credentials || []).findIndex(c => String(c.id) === String(editingId));
          if (idx !== -1) {
            userVault.credentials[idx] = { ...userVault.credentials[idx], website, username, encryptedPassword };
            saveOfflineVaults(vaults);
          }
        }
      } else {
        const res = await fetch(`/api/credentials/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify({ userId, website, username, encryptedPassword })
        });
        if (!res.ok) throw new Error('Failed to update credential');
      }

      const targetIndex = appState.credentials.findIndex(c => String(c.id) === String(editingId));
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
      let newId = 'cred_' + Date.now();
      const createdAt = new Date().toISOString();

      if (appState.isOfflineMode) {
        const vaults = getOfflineVaults();
        const userVault = vaults[appState.currentUser.email];
        if (userVault) {
          userVault.credentials = userVault.credentials || [];
          userVault.credentials.unshift({ id: newId, website, username, encryptedPassword, createdAt });
          saveOfflineVaults(vaults);
        }
      } else {
        const res = await fetch('/api/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify({ userId, website, username, encryptedPassword })
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
  const cred = appState.credentials.find(c => String(c.id) === String(id));
  if (!cred) return;

  appState.editingId = id;
  document.getElementById('editingId').value = id;
  document.getElementById('credWebsite').value = cred.website;
  document.getElementById('credUsername').value = cred.username;
  document.getElementById('credPassword').value = cred.password;

  const check = VaultCrypto.checkPasswordStrength(cred.password);
  const bar = document.getElementById('credStrengthBar');
  const label = document.getElementById('credStrengthLabel');
  bar.className = 'strength-bar-fill ' + check.strength.toLowerCase();
  label.textContent = check.strength;
  label.className = check.strength.toLowerCase();

  document.getElementById('formCardIcon').textContent = '✏️';
  document.getElementById('formCardTitle').textContent = `Editing: ${cred.website}`;
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  document.getElementById('saveCredBtn').textContent = '💾 Update Credential';

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
  const cred = appState.credentials.find(c => String(c.id) === String(id));
  if (!cred) return;

  appState.deleteTargetId = id;
  document.getElementById('deleteTargetWebsite').textContent = cred.website;
  openModal('deleteModal');
}

async function executeDeleteCredential() {
  const id = appState.deleteTargetId;
  if (!id || !appState.currentUser) return;

  const userId = appState.currentUser.id;

  try {
    if (appState.isOfflineMode) {
      const vaults = getOfflineVaults();
      const userVault = vaults[appState.currentUser.email];
      if (userVault) {
        userVault.credentials = (userVault.credentials || []).filter(c => String(c.id) !== String(id));
        saveOfflineVaults(vaults);
      }
    } else {
      const res = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': userId }
      });
      if (!res.ok) throw new Error('Failed to delete credential');
    }

    appState.credentials = appState.credentials.filter(c => String(c.id) !== String(id));
    if (String(appState.editingId) === String(id)) cancelEdit();

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
// Clipboard with 10-Second Auto-Clear Feature
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

function toggleInlinePassword(id) {
  const strId = String(id);
  if (appState.revealedSet.has(strId)) {
    appState.revealedSet.delete(strId);
  } else {
    appState.revealedSet.add(strId);
  }
  renderCredentials();
}

// ----------------------------------------------------------
// Rendering & Filtering
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
    const isRevealed = appState.revealedSet.has(String(cred.id));
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
// Password Generator Modal
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
    select.innerHTML = '<option value="">No credentials available in active vault</option>';
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
// Change Master Password (Active User)
// ----------------------------------------------------------
function openChangePasswordModal() {
  document.getElementById('changePasswordForm').reset();
  document.getElementById('changePassStatus').style.display = 'none';
  openModal('changePasswordModal');
}

async function submitChangePassword() {
  if (!appState.currentUser) return;
  const userId = appState.currentUser.id;

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
    const currentHash = await VaultCrypto.sha256(currentPassword);
    if (currentHash !== appState.masterPasswordHash) {
      showStatusMessage(statusDiv, 'Current password is incorrect', 'error');
      return;
    }

    const newSalt = VaultCrypto.generateSalt();
    const newSessionKey = await VaultCrypto.deriveKey(newPassword, newSalt);
    const newPasswordHash = await VaultCrypto.sha256(newPassword);

    const reEncrypted = [];
    for (const cred of appState.credentials) {
      const newEncryptedPassword = await VaultCrypto.encrypt(cred.password, newSessionKey);
      reEncrypted.push({ id: cred.id, encryptedPassword: newEncryptedPassword });
    }

    if (appState.isOfflineMode) {
      const vaults = getOfflineVaults();
      const userVault = vaults[appState.currentUser.email];
      if (userVault) {
        userVault.passwordHash = newPasswordHash;
        userVault.salt = newSalt;
        userVault.credentials = userVault.credentials.map(c => {
          const found = reEncrypted.find(r => String(r.id) === String(c.id));
          return found ? { ...c, encryptedPassword: found.encryptedPassword } : c;
        });
        saveOfflineVaults(vaults);
      }
    } else {
      const res = await fetch('/api/change-master-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({
          userId,
          currentPasswordHash: currentHash,
          newPasswordHash,
          newSalt,
          reEncryptedCredentials: reEncrypted
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update master password');
    }

    appState.sessionKey = newSessionKey;
    appState.masterPasswordHash = newPasswordHash;
    appState.currentUser.salt = newSalt;
    appState.credentials = appState.credentials.map(c => {
      const found = reEncrypted.find(r => String(r.id) === String(c.id));
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
function exportBackupText() {
  if (appState.credentials.length === 0) {
    showToast('No credentials in active vault to export', 'warning');
    return;
  }

  let text = `Vault Backup: ${appState.currentUser.email}\n`;
  text += `Exported: ${new Date().toISOString()}\n`;
  text += `-------------------------------\n`;

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
  a.download = `Backup_${appState.currentUser.email}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Exported ${appState.credentials.length} credentials to file`, 'success');
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
  if (!appState.currentUser) return;
  const userId = appState.currentUser.id;

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
      const vaults = getOfflineVaults();
      const userVault = vaults[appState.currentUser.email];
      if (userVault) {
        userVault.credentials = userVault.credentials || [];
        encryptedBatch.forEach(b => {
          userVault.credentials.unshift({ id: 'cred_' + Date.now() + Math.random(), ...b });
        });
        saveOfflineVaults(vaults);
      }
    } else {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId
        },
        body: JSON.stringify({ userId, credentials: encryptedBatch })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed on server');
    }

    await loadAndDecryptCredentials();
    closeModal('importModal');
    showToast(`Imported ${parsed.length} credentials into your vault!`, 'success');
    handleSearch();
    updateStats();
  } catch (err) {
    console.error('Import error:', err);
    showToast(err.message, 'danger');
  }
}

function parseBackupText(text) {
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) return json;
      if (json.credentials && Array.isArray(json.credentials)) return json.credentials;
    } catch (_) {}
  }

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
// Offline Vault Helpers
// ----------------------------------------------------------
function getOfflineVaults() {
  try {
    const raw = localStorage.getItem('securevault_offline_vaults');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveOfflineVaults(vaults) {
  localStorage.setItem('securevault_offline_vaults', JSON.stringify(vaults));
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
