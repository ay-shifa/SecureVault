// ==========================================================
// SecureVault Web Server
// Multi-Account Zero-Knowledge Web Password Manager
// Supports:
// 1. Cloud Database: MongoDB Atlas (via MONGODB_URI in .env)
// 2. Local Database: SQLite (fallback via node:sqlite)
// ==========================================================

require('dotenv').config();
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'securevault.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ----------------------------------------------------------
// Database Adapters (Multi-Account)
// ----------------------------------------------------------

class MongoAdapter {
  constructor(client, dbName) {
    this.client = client;
    this.db = client.db(dbName || 'SecureVault');
    this.usersCol = this.db.collection('users');
    this.credentialsCol = this.db.collection('credentials');
    this.type = 'mongodb';
  }

  async countUsers() {
    return await this.usersCol.countDocuments();
  }

  async findUserByEmail(email) {
    const normalized = email.trim().toLowerCase();
    return await this.usersCol.findOne({ email: normalized });
  }

  async findUserById(id) {
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (_) {
      query = { _id: id };
    }
    return await this.usersCol.findOne(query);
  }

  async createUser(email, passwordHash, salt, createdAt) {
    const normalized = email.trim().toLowerCase();
    const res = await this.usersCol.insertOne({
      email: normalized,
      password_hash: passwordHash,
      salt: salt,
      created_at: createdAt || new Date().toISOString()
    });
    return res.insertedId.toString();
  }

  async updateUserPassword(id, passwordHash, salt) {
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (_) {
      query = { _id: id };
    }
    const updateFields = {
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    };
    if (salt) updateFields.salt = salt;
    const res = await this.usersCol.updateOne(query, { $set: updateFields });
    return res.matchedCount > 0;
  }

  async listRecentAccounts() {
    const users = await this.usersCol.find({}, { projection: { email: 1, created_at: 1 } })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
    return users.map(u => ({ id: u._id.toString(), email: u.email }));
  }

  async countCredentials(userId) {
    return await this.credentialsCol.countDocuments({ userId: userId.toString() });
  }

  async getCredentialsByUser(userId) {
    const docs = await this.credentialsCol.find({ userId: userId.toString() })
      .sort({ created_at: -1 })
      .toArray();
    return docs.map(d => ({
      id: d._id.toString(),
      website: d.website,
      username: d.username,
      encryptedPassword: d.encrypted_password,
      createdAt: d.created_at
    }));
  }

  async addCredential(userId, website, username, encryptedPassword, createdAt) {
    const res = await this.credentialsCol.insertOne({
      userId: userId.toString(),
      website,
      username,
      encrypted_password: encryptedPassword,
      created_at: createdAt || new Date().toISOString()
    });
    return res.insertedId.toString();
  }

  async updateCredential(id, userId, website, username, encryptedPassword) {
    let query;
    try {
      query = { _id: new ObjectId(id), userId: userId.toString() };
    } catch (_) {
      query = { _id: id, userId: userId.toString() };
    }
    const res = await this.credentialsCol.updateOne(query, {
      $set: {
        website,
        username,
        encrypted_password: encryptedPassword,
        updated_at: new Date().toISOString()
      }
    });
    return res.matchedCount > 0;
  }

  async deleteCredential(id, userId) {
    let query;
    try {
      query = { _id: new ObjectId(id), userId: userId.toString() };
    } catch (_) {
      query = { _id: id, userId: userId.toString() };
    }
    const res = await this.credentialsCol.deleteOne(query);
    return res.deletedCount > 0;
  }

  async reEncryptCredentials(userId, reEncryptedList) {
    for (const item of reEncryptedList) {
      let query;
      try {
        query = { _id: new ObjectId(item.id), userId: userId.toString() };
      } catch (_) {
        query = { _id: item.id, userId: userId.toString() };
      }
      await this.credentialsCol.updateOne(query, {
        $set: { encrypted_password: item.encryptedPassword }
      });
    }
  }

  async batchInsertCredentials(userId, list) {
    if (!list || list.length === 0) return 0;
    const docs = list.map(item => ({
      userId: userId.toString(),
      website: item.website,
      username: item.username,
      encrypted_password: item.encryptedPassword,
      created_at: item.createdAt || new Date().toISOString()
    }));
    const res = await this.credentialsCol.insertMany(docs);
    return res.insertedCount;
  }
}

class SqliteAdapter {
  constructor(dbPath) {
    this.db = new DatabaseSync(dbPath);
    this.type = 'sqlite';
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT '1',
        website TEXT NOT NULL,
        username TEXT NOT NULL,
        encrypted_password TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Ensure user_id column exists if table was created in older version
    try {
      const colInfo = this.db.prepare("PRAGMA table_info(credentials)").all();
      const hasUserId = colInfo.some(c => c.name === 'user_id');
      if (!hasUserId) {
        this.db.exec("ALTER TABLE credentials ADD COLUMN user_id TEXT NOT NULL DEFAULT '1'");
      }
    } catch (_) {}
  }

  async countUsers() {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM users').get();
    return row ? row.cnt : 0;
  }

  async findUserByEmail(email) {
    const normalized = email.trim().toLowerCase();
    const row = this.db.prepare('SELECT id, email, password_hash, salt, created_at FROM users WHERE LOWER(email) = ?').get(normalized);
    if (!row) return null;
    return {
      _id: row.id.toString(),
      email: row.email,
      password_hash: row.password_hash,
      salt: row.salt,
      created_at: row.created_at
    };
  }

  async findUserById(id) {
    const row = this.db.prepare('SELECT id, email, password_hash, salt, created_at FROM users WHERE id = ?').get(parseInt(id, 10));
    if (!row) return null;
    return {
      _id: row.id.toString(),
      email: row.email,
      password_hash: row.password_hash,
      salt: row.salt,
      created_at: row.created_at
    };
  }

  async createUser(email, passwordHash, salt, createdAt) {
    const normalized = email.trim().toLowerCase();
    const res = this.db.prepare('INSERT INTO users (email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)')
      .run(normalized, passwordHash, salt, createdAt || new Date().toISOString());
    return res.lastInsertRowid.toString();
  }

  async updateUserPassword(id, passwordHash, salt) {
    if (salt) {
      const res = this.db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?')
        .run(passwordHash, salt, parseInt(id, 10));
      return res.changes > 0;
    } else {
      const res = this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .run(passwordHash, parseInt(id, 10));
      return res.changes > 0;
    }
  }

  async listRecentAccounts() {
    const rows = this.db.prepare('SELECT id, email FROM users ORDER BY id DESC LIMIT 10').all();
    return rows.map(r => ({ id: r.id.toString(), email: r.email }));
  }

  async countCredentials(userId) {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM credentials WHERE user_id = ?').get(userId.toString());
    return row ? row.cnt : 0;
  }

  async getCredentialsByUser(userId) {
    const rows = this.db.prepare(`
      SELECT id, website, username, encrypted_password as encryptedPassword, created_at as createdAt 
      FROM credentials 
      WHERE user_id = ? 
      ORDER BY id DESC
    `).all(userId.toString());
    return rows.map(r => ({
      id: r.id.toString(),
      website: r.website,
      username: r.username,
      encryptedPassword: r.encryptedPassword,
      createdAt: r.createdAt
    }));
  }

  async addCredential(userId, website, username, encryptedPassword, createdAt) {
    const res = this.db.prepare(`
      INSERT INTO credentials (user_id, website, username, encrypted_password, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `).run(userId.toString(), website, username, encryptedPassword, createdAt || new Date().toISOString());
    return res.lastInsertRowid.toString();
  }

  async updateCredential(id, userId, website, username, encryptedPassword) {
    const res = this.db.prepare(`
      UPDATE credentials 
      SET website = ?, username = ?, encrypted_password = ? 
      WHERE id = ? AND user_id = ?
    `).run(website, username, encryptedPassword, parseInt(id, 10), userId.toString());
    return res.changes > 0;
  }

  async deleteCredential(id, userId) {
    const res = this.db.prepare('DELETE FROM credentials WHERE id = ? AND user_id = ?')
      .run(parseInt(id, 10), userId.toString());
    return res.changes > 0;
  }

  async reEncryptCredentials(userId, reEncryptedList) {
    const stmt = this.db.prepare('UPDATE credentials SET encrypted_password = ? WHERE id = ? AND user_id = ?');
    for (const item of reEncryptedList) {
      stmt.run(item.encryptedPassword, parseInt(item.id, 10), userId.toString());
    }
  }

  async batchInsertCredentials(userId, list) {
    const stmt = this.db.prepare(`
      INSERT INTO credentials (user_id, website, username, encrypted_password, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `);
    let count = 0;
    const now = new Date().toISOString();
    for (const item of list) {
      stmt.run(userId.toString(), item.website, item.username, item.encryptedPassword, item.createdAt || now);
      count++;
    }
    return count;
  }
}

// Global active database adapter
let activeDb = null;

async function setupDatabase() {
  if (process.env.MONGODB_URI) {
    try {
      console.log('Connecting to MongoDB Cloud Database...');
      const client = new MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000
      });
      await client.connect();
      console.log('✅ Connected successfully to MongoDB Atlas Cloud Database!');
      activeDb = new MongoAdapter(client, process.env.DB_NAME || 'SecureVault');
      return;
    } catch (err) {
      console.error('⚠️ Could not connect to MongoDB Atlas:', err.message);
      console.log('Falling back to local SQLite database...');
    }
  }

  activeDb = new SqliteAdapter(DB_PATH);
  console.log('✅ Connected to local SQLite database at:', DB_PATH);
}

// ----------------------------------------------------------
// MIME Types and Helpers
// ----------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJSON(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
    'Cache-Control': 'no-store'
  });
  res.end(json);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function getUserIdFromRequest(req, parsedUrl, body) {
  return req.headers['x-user-id'] ||
         parsedUrl.searchParams.get('userId') ||
         (body && body.userId);
}

// ----------------------------------------------------------
// HTTP Server & Request Dispatcher
// ----------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
    });
    return res.end();
  }

  // 1. GET /api/status - Server status & existing accounts info
  if (method === 'GET' && pathname === '/api/status') {
    try {
      const userCount = await activeDb.countUsers();
      const recentAccounts = await activeDb.listRecentAccounts();

      return sendJSON(res, 200, {
        totalUsers: userCount,
        hasUsers: userCount > 0,
        recentAccounts: recentAccounts,
        dbType: activeDb.type
      });
    } catch (err) {
      console.error('API /status error:', err);
      return sendJSON(res, 500, { error: 'Database error checking status' });
    }
  }

  // 2. POST /api/register - Register a new account with its own master password
  if (method === 'POST' && pathname === '/api/register') {
    try {
      const body = await parseBody(req);
      const { email, passwordHash, salt } = body;

      if (!email || !passwordHash || !salt) {
        return sendJSON(res, 400, { error: 'Email/Username, Master Password hash, and salt are required' });
      }

      const existing = await activeDb.findUserByEmail(email);
      if (existing) {
        return sendJSON(res, 400, { error: 'An account with this email or username already exists. Please log in.' });
      }

      const userId = await activeDb.createUser(email, passwordHash, salt);

      return sendJSON(res, 201, {
        success: true,
        message: 'Account created successfully',
        userId: userId,
        email: email.trim().toLowerCase(),
        salt: salt
      });
    } catch (err) {
      console.error('API /register error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 3. POST /api/login - Log into a specific account
  if (method === 'POST' && pathname === '/api/login') {
    try {
      const body = await parseBody(req);
      const { email, passwordHash } = body;

      if (!email || !passwordHash) {
        return sendJSON(res, 400, { error: 'Email/Username and Master Password are required' });
      }

      const user = await activeDb.findUserByEmail(email);
      if (!user) {
        return sendJSON(res, 404, { error: 'Account not found. Please check username or create a new account.' });
      }

      if (user.password_hash === passwordHash) {
        return sendJSON(res, 200, {
          success: true,
          message: 'Unlock successful',
          userId: user._id.toString(),
          email: user.email,
          salt: user.salt
        });
      } else {
        return sendJSON(res, 401, { success: false, error: 'Incorrect Master Password' });
      }
    } catch (err) {
      console.error('API /login error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 4. GET /api/credentials - List credentials for the authenticated user
  if (method === 'GET' && pathname === '/api/credentials') {
    try {
      const userId = getUserIdFromRequest(req, parsedUrl);
      if (!userId) {
        return sendJSON(res, 401, { error: 'User ID is required to fetch credentials' });
      }

      const list = await activeDb.getCredentialsByUser(userId);
      return sendJSON(res, 200, { credentials: list });
    } catch (err) {
      console.error('API /credentials GET error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 5. POST /api/credentials - Add credential for the authenticated user
  if (method === 'POST' && pathname === '/api/credentials') {
    try {
      const body = await parseBody(req);
      const userId = getUserIdFromRequest(req, parsedUrl, body);
      const { website, username, encryptedPassword } = body;

      if (!userId) {
        return sendJSON(res, 401, { error: 'User ID is required' });
      }

      if (!website || !username || !encryptedPassword) {
        return sendJSON(res, 400, { error: 'Website, username, and encrypted password are required' });
      }

      const createdAt = new Date().toISOString();
      const newId = await activeDb.addCredential(
        userId,
        website.trim(),
        username.trim(),
        encryptedPassword,
        createdAt
      );

      return sendJSON(res, 201, {
        success: true,
        credential: {
          id: newId,
          website: website.trim(),
          username: username.trim(),
          encryptedPassword,
          createdAt
        }
      });
    } catch (err) {
      console.error('API /credentials POST error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 6. PUT /api/credentials/:id - Update credential
  const putMatch = pathname.match(/^\/api\/credentials\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PUT' && putMatch) {
    try {
      const id = putMatch[1];
      const body = await parseBody(req);
      const userId = getUserIdFromRequest(req, parsedUrl, body);
      const { website, username, encryptedPassword } = body;

      if (!userId) {
        return sendJSON(res, 401, { error: 'User ID is required' });
      }

      if (!website || !username || !encryptedPassword) {
        return sendJSON(res, 400, { error: 'Website, username, and encrypted password are required' });
      }

      const updated = await activeDb.updateCredential(
        id,
        userId,
        website.trim(),
        username.trim(),
        encryptedPassword
      );

      if (!updated) {
        return sendJSON(res, 404, { error: 'Credential not found or not owned by this account' });
      }

      return sendJSON(res, 200, {
        success: true,
        credential: { id, website: website.trim(), username: username.trim(), encryptedPassword }
      });
    } catch (err) {
      console.error('API /credentials PUT error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 7. DELETE /api/credentials/:id - Delete credential
  const delMatch = pathname.match(/^\/api\/credentials\/([a-zA-Z0-9_-]+)$/);
  if (method === 'DELETE' && delMatch) {
    try {
      const id = delMatch[1];
      const userId = getUserIdFromRequest(req, parsedUrl);

      if (!userId) {
        return sendJSON(res, 401, { error: 'User ID is required' });
      }

      const deleted = await activeDb.deleteCredential(id, userId);

      if (!deleted) {
        return sendJSON(res, 404, { error: 'Credential not found or not owned by this account' });
      }

      return sendJSON(res, 200, { success: true, message: 'Credential deleted successfully' });
    } catch (err) {
      console.error('API /credentials DELETE error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 8. POST /api/change-master-password - Change master password for authenticated user
  if (method === 'POST' && pathname === '/api/change-master-password') {
    try {
      const body = await parseBody(req);
      const userId = getUserIdFromRequest(req, parsedUrl, body);
      const { currentPasswordHash, newPasswordHash, newSalt, reEncryptedCredentials } = body;

      if (!userId) {
        return sendJSON(res, 401, { error: 'User ID is required' });
      }

      if (!currentPasswordHash || !newPasswordHash || !newSalt) {
        return sendJSON(res, 400, { error: 'Missing required password change fields' });
      }

      const user = await activeDb.findUserById(userId);
      if (!user || user.password_hash !== currentPasswordHash) {
        return sendJSON(res, 401, { error: 'Current master password verification failed' });
      }

      await activeDb.updateUserPassword(userId, newPasswordHash, newSalt);

      if (Array.isArray(reEncryptedCredentials) && reEncryptedCredentials.length > 0) {
        await activeDb.reEncryptCredentials(userId, reEncryptedCredentials);
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'Master password updated and credentials re-encrypted successfully'
      });
    } catch (err) {
      console.error('API /change-master-password error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 9. POST /api/import - Import credentials for authenticated user
  if (method === 'POST' && pathname === '/api/import') {
    try {
      const body = await parseBody(req);
      const userId = getUserIdFromRequest(req, parsedUrl, body);
      const { credentials } = body;

      if (!userId) {
        return sendJSON(res, 401, { error: 'User ID is required' });
      }

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return sendJSON(res, 400, { error: 'Valid credentials array required' });
      }

      const count = await activeDb.batchInsertCredentials(userId, credentials);
      return sendJSON(res, 200, { success: true, count });
    } catch (err) {
      console.error('API /import error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // --------------------------------------------------------
  // Static File Serving (public/)
  // --------------------------------------------------------
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexFallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFallback, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

setupDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`
============================================================
🔒 SecureVault Web Application (Multi-Account Edition)
============================================================
Server running at: http://localhost:${PORT}
Active Database:   ${activeDb.type === 'mongodb' ? '☁️ MongoDB Atlas Cloud' : '💾 Local SQLite (' + DB_PATH + ')'}
Static folder:     ${PUBLIC_DIR}
Zero-Knowledge:    AES-256-CBC with PBKDF2 (65,536 iterations)
Multi-Tenant:      Each account has its own isolated vault & key
============================================================
`);
  });
}).catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
