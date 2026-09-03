// ==========================================================
// SecureVault Web Server
// Supports:
// 1. Cloud Database: MongoDB Atlas (via MONGODB_URI in .env)
// 2. Local Database: SQLite (fallback via node:sqlite)
// Zero-Knowledge Architecture with client-side cryptography
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
// Database Adapters
// ----------------------------------------------------------

class MongoAdapter {
  constructor(client, dbName) {
    this.client = client;
    this.db = client.db(dbName || 'SecureVault');
    this.masterPasswordCol = this.db.collection('master_password');
    this.credentialsCol = this.db.collection('credentials');
    this.type = 'mongodb';
  }

  async hasMasterPassword() {
    const doc = await this.masterPasswordCol.findOne();
    return !!doc;
  }

  async getMasterPasswordRecord() {
    const doc = await this.masterPasswordCol.findOne();
    if (!doc) return null;
    return {
      password_hash: doc.password_hash,
      salt: doc.salt,
      created_at: doc.created_at
    };
  }

  async saveMasterPassword(passwordHash, salt, createdAt) {
    await this.masterPasswordCol.insertOne({
      password_hash: passwordHash,
      salt: salt,
      created_at: createdAt
    });
  }

  async updateMasterPassword(passwordHash, salt) {
    const updateFields = {
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    };
    if (salt) updateFields.salt = salt;
    await this.masterPasswordCol.updateOne({}, { $set: updateFields });
  }

  async countCredentials() {
    return await this.credentialsCol.countDocuments();
  }

  async getAllCredentials() {
    const docs = await this.credentialsCol.find().sort({ created_at: -1 }).toArray();
    return docs.map(d => ({
      id: d._id.toString(),
      website: d.website,
      username: d.username,
      encryptedPassword: d.encrypted_password,
      createdAt: d.created_at
    }));
  }

  async addCredential(website, username, encryptedPassword, createdAt) {
    const res = await this.credentialsCol.insertOne({
      website,
      username,
      encrypted_password: encryptedPassword,
      created_at: createdAt
    });
    return res.insertedId.toString();
  }

  async updateCredential(id, website, username, encryptedPassword) {
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (_) {
      query = { _id: id };
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

  async deleteCredential(id) {
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch (_) {
      query = { _id: id };
    }
    const res = await this.credentialsCol.deleteOne(query);
    return res.deletedCount > 0;
  }

  async reEncryptCredentials(reEncryptedList) {
    for (const item of reEncryptedList) {
      let query;
      try {
        query = { _id: new ObjectId(item.id) };
      } catch (_) {
        query = { _id: item.id };
      }
      await this.credentialsCol.updateOne(query, {
        $set: { encrypted_password: item.encryptedPassword }
      });
    }
  }

  async batchInsertCredentials(list) {
    if (!list || list.length === 0) return 0;
    const docs = list.map(item => ({
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
      CREATE TABLE IF NOT EXISTS master_password (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        website TEXT NOT NULL,
        username TEXT NOT NULL,
        encrypted_password TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  async hasMasterPassword() {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM master_password').get();
    return row && row.cnt > 0;
  }

  async getMasterPasswordRecord() {
    return this.db.prepare('SELECT password_hash, salt, created_at FROM master_password LIMIT 1').get();
  }

  async saveMasterPassword(passwordHash, salt, createdAt) {
    this.db.prepare('INSERT INTO master_password (password_hash, salt, created_at) VALUES (?, ?, ?)')
      .run(passwordHash, salt, createdAt);
  }

  async updateMasterPassword(passwordHash, salt) {
    if (salt) {
      this.db.prepare('UPDATE master_password SET password_hash = ?, salt = ? WHERE id = 1')
        .run(passwordHash, salt);
    } else {
      this.db.prepare('UPDATE master_password SET password_hash = ? WHERE id = 1')
        .run(passwordHash);
    }
  }

  async countCredentials() {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM credentials').get();
    return row ? row.cnt : 0;
  }

  async getAllCredentials() {
    const rows = this.db.prepare(`
      SELECT id, website, username, encrypted_password as encryptedPassword, created_at as createdAt 
      FROM credentials 
      ORDER BY id DESC
    `).all();
    return rows.map(r => ({
      id: r.id.toString(),
      website: r.website,
      username: r.username,
      encryptedPassword: r.encryptedPassword,
      createdAt: r.createdAt
    }));
  }

  async addCredential(website, username, encryptedPassword, createdAt) {
    const res = this.db.prepare(`
      INSERT INTO credentials (website, username, encrypted_password, created_at) 
      VALUES (?, ?, ?, ?)
    `).run(website, username, encryptedPassword, createdAt);
    return res.lastInsertRowid.toString();
  }

  async updateCredential(id, website, username, encryptedPassword) {
    const res = this.db.prepare(`
      UPDATE credentials 
      SET website = ?, username = ?, encrypted_password = ? 
      WHERE id = ?
    `).run(website, username, encryptedPassword, parseInt(id, 10));
    return res.changes > 0;
  }

  async deleteCredential(id) {
    const res = this.db.prepare('DELETE FROM credentials WHERE id = ?').run(parseInt(id, 10));
    return res.changes > 0;
  }

  async reEncryptCredentials(reEncryptedList) {
    const stmt = this.db.prepare('UPDATE credentials SET encrypted_password = ? WHERE id = ?');
    for (const item of reEncryptedList) {
      stmt.run(item.encryptedPassword, parseInt(item.id, 10));
    }
  }

  async batchInsertCredentials(list) {
    const stmt = this.db.prepare(`
      INSERT INTO credentials (website, username, encrypted_password, created_at) 
      VALUES (?, ?, ?, ?)
    `);
    let count = 0;
    const now = new Date().toISOString();
    for (const item of list) {
      stmt.run(item.website, item.username, item.encryptedPassword, item.createdAt || now);
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // 1. GET /api/status
  if (method === 'GET' && pathname === '/api/status') {
    try {
      const hasMaster = await activeDb.hasMasterPassword();
      let salt = null;

      if (hasMaster) {
        const record = await activeDb.getMasterPasswordRecord();
        if (record) salt = record.salt;
      }

      const totalCount = await activeDb.countCredentials();

      return sendJSON(res, 200, {
        initialized: hasMaster,
        salt: salt,
        totalCredentials: totalCount,
        dbType: activeDb.type // 'mongodb' or 'sqlite'
      });
    } catch (err) {
      console.error('API /status error:', err);
      return sendJSON(res, 500, { error: 'Database error checking status' });
    }
  }

  // 2. POST /api/setup
  if (method === 'POST' && pathname === '/api/setup') {
    try {
      const hasMaster = await activeDb.hasMasterPassword();
      if (hasMaster) {
        return sendJSON(res, 400, { error: 'Master Password already exists' });
      }

      const body = await parseBody(req);
      const { passwordHash, salt } = body;

      if (!passwordHash || !salt) {
        return sendJSON(res, 400, { error: 'Missing passwordHash or salt' });
      }

      const createdAt = new Date().toISOString();
      await activeDb.saveMasterPassword(passwordHash, salt, createdAt);

      return sendJSON(res, 200, {
        success: true,
        message: 'Master Password created successfully in Cloud Database'
      });
    } catch (err) {
      console.error('API /setup error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 3. POST /api/verify
  if (method === 'POST' && pathname === '/api/verify') {
    try {
      const body = await parseBody(req);
      const { passwordHash } = body;

      if (!passwordHash) {
        return sendJSON(res, 400, { error: 'Please provide master password hash' });
      }

      const record = await activeDb.getMasterPasswordRecord();
      if (!record) {
        return sendJSON(res, 404, { error: 'Master Password not found. Please setup first.' });
      }

      if (record.password_hash === passwordHash) {
        return sendJSON(res, 200, {
          success: true,
          message: 'Unlock successful',
          salt: record.salt
        });
      } else {
        return sendJSON(res, 401, { success: false, error: 'Incorrect Master Password' });
      }
    } catch (err) {
      console.error('API /verify error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 4. GET /api/credentials
  if (method === 'GET' && pathname === '/api/credentials') {
    try {
      const list = await activeDb.getAllCredentials();
      return sendJSON(res, 200, { credentials: list });
    } catch (err) {
      console.error('API /credentials GET error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 5. POST /api/credentials
  if (method === 'POST' && pathname === '/api/credentials') {
    try {
      const body = await parseBody(req);
      const { website, username, encryptedPassword } = body;

      if (!website || !username || !encryptedPassword) {
        return sendJSON(res, 400, { error: 'Website, username, and encrypted password are required' });
      }

      const createdAt = new Date().toISOString();
      const newId = await activeDb.addCredential(
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

  // 6. PUT /api/credentials/:id
  const putMatch = pathname.match(/^\/api\/credentials\/([a-zA-Z0-9_-]+)$/);
  if (method === 'PUT' && putMatch) {
    try {
      const id = putMatch[1];
      const body = await parseBody(req);
      const { website, username, encryptedPassword } = body;

      if (!website || !username || !encryptedPassword) {
        return sendJSON(res, 400, { error: 'Website, username, and encrypted password are required' });
      }

      const updated = await activeDb.updateCredential(
        id,
        website.trim(),
        username.trim(),
        encryptedPassword
      );

      if (!updated) {
        return sendJSON(res, 404, { error: 'Credential not found' });
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

  // 7. DELETE /api/credentials/:id
  const delMatch = pathname.match(/^\/api\/credentials\/([a-zA-Z0-9_-]+)$/);
  if (method === 'DELETE' && delMatch) {
    try {
      const id = delMatch[1];
      const deleted = await activeDb.deleteCredential(id);

      if (!deleted) {
        return sendJSON(res, 404, { error: 'Credential not found' });
      }

      return sendJSON(res, 200, { success: true, message: 'Credential deleted successfully' });
    } catch (err) {
      console.error('API /credentials DELETE error:', err);
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 8. POST /api/change-master-password
  if (method === 'POST' && pathname === '/api/change-master-password') {
    try {
      const body = await parseBody(req);
      const { currentPasswordHash, newPasswordHash, newSalt, reEncryptedCredentials } = body;

      if (!currentPasswordHash || !newPasswordHash || !newSalt) {
        return sendJSON(res, 400, { error: 'Missing required password change fields' });
      }

      const record = await activeDb.getMasterPasswordRecord();
      if (!record || record.password_hash !== currentPasswordHash) {
        return sendJSON(res, 401, { error: 'Current master password verification failed' });
      }

      await activeDb.updateMasterPassword(newPasswordHash, newSalt);

      if (Array.isArray(reEncryptedCredentials) && reEncryptedCredentials.length > 0) {
        await activeDb.reEncryptCredentials(reEncryptedCredentials);
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

  // 9. POST /api/import
  if (method === 'POST' && pathname === '/api/import') {
    try {
      const body = await parseBody(req);
      const { credentials } = body;

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return sendJSON(res, 400, { error: 'Valid credentials array required' });
      }

      const count = await activeDb.batchInsertCredentials(credentials);
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

// Start Server after database initialization
setupDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`
============================================================
🔒 SecureVault Web Application
============================================================
Server running at: http://localhost:${PORT}
Active Database:   ${activeDb.type === 'mongodb' ? '☁️ MongoDB Atlas Cloud' : '💾 Local SQLite (' + DB_PATH + ')'}
Static folder:     ${PUBLIC_DIR}
Zero-Knowledge:    AES-256-CBC with PBKDF2 (65,536 iterations)
============================================================
`);
  });
}).catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
