import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.ADMIN_API_PORT || 3100);
const logDir = path.join(__dirname, 'runtime');
const logFile = path.join(logDir, 'admin-service.log');
const backupDir = path.join(logDir, 'backups');

fs.mkdirSync(logDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const sessions = new Map();

const serviceState = {
  startedAt: new Date().toISOString(),
  dbProvider: process.env.DATABASE_PROVIDER || 'postgresql',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://dbuser:dbpass@localhost:5432/ogh_admin',
  mysqlUrl: process.env.MYSQL_DATABASE_URL || 'mysql://dbuser:dbpass@localhost:3306/ogh_admin',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
  return entry;
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  req.adminSession = sessions.get(token);
  next();
}

app.get('/health', (req, res) => {
  const health = {
    ok: true,
    service: 'admin-api',
    uptimeSeconds: Math.round(process.uptime()),
    startedAt: serviceState.startedAt,
    dbProvider: serviceState.dbProvider,
  };
  log('info', 'Health check requested', health);
  res.json(health);
});

app.post('/api/auth/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};

  if (!serviceState.adminEmail || !serviceState.adminPassword) {
    log('warn', 'Admin auth requested before credentials were configured');
    return res.status(503).json({ ok: false, message: 'Admin credentials are not configured on the server' });
  }

  if (email !== serviceState.adminEmail || password !== serviceState.adminPassword) {
    log('warn', 'Failed admin login attempt', { email });
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  const token = crypto.randomUUID();
  const session = { email, createdAt: new Date().toISOString() };
  sessions.set(token, session);
  log('info', 'Admin login successful', { email });
  return res.json({ ok: true, token, email });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = readToken(req);
  sessions.delete(token);
  log('info', 'Admin logout successful', { email: req.adminSession?.email });
  res.json({ ok: true });
});

app.get('/api/status', requireAuth, (req, res) => {
  res.json({
    services: [
      { name: 'Web Frontend', status: 'running', url: 'http://localhost:3000' },
      { name: 'PocketBase CMS', status: 'expected', url: process.env.VITE_POCKETBASE_URL || 'http://localhost:8090' },
      { name: 'Admin API', status: 'running', url: `http://localhost:${port}` },
    ],
    databases: [
      { provider: 'postgresql', enabled: serviceState.dbProvider === 'postgresql', url: 'server-managed connection' },
      { provider: 'mysql', enabled: serviceState.dbProvider === 'mysql', url: 'server-managed connection' },
    ],
  });
});

app.get('/api/logs', requireAuth, (req, res) => {
  if (!fs.existsSync(logFile)) {
    return res.json([]);
  }
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).slice(-200);
  const logs = lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { timestamp: new Date().toISOString(), level: 'error', message: 'Invalid log line', meta: { line } };
    }
  });
  res.json(logs.reverse());
});

app.post('/api/logs', requireAuth, (req, res) => {
  const { level = 'info', message = 'Manual log', meta = {} } = req.body || {};
  const entry = log(level, message, meta);
  res.status(201).json(entry);
});

app.post('/api/backup', requireAuth, (req, res) => {
  const snapshot = {
    createdAt: new Date().toISOString(),
    source: 'admin-dashboard',
    data: req.body || {},
  };
  const fileName = `backup-${Date.now()}.json`;
  const filePath = path.join(backupDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  log('info', 'Backup created', { fileName });
  res.status(201).json({ ok: true, fileName, filePath, snapshot });
});

app.post('/api/restore', requireAuth, (req, res) => {
  const payload = req.body || {};
  log('warn', 'Restore requested', { keys: Object.keys(payload) });
  res.json({ ok: true, restoredAt: new Date().toISOString(), payload });
});

app.listen(port, () => {
  log('info', `Admin API listening on port ${port}`, { port, dbProvider: serviceState.dbProvider });
});
