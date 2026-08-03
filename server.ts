import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read DB
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file:', err);
  }
  return null;
}

// Helper to write DB atomically
function writeDb(data: any) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing DB file:', err);
    return false;
  }
}

// Disable HTTP caching for API endpoints
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET full DB state
app.get('/api/db', (req, res) => {
  const dbData = readDb();
  if (!dbData) {
    return res.status(404).json({ error: 'Database not initialized yet' });
  }
  res.json(dbData);
});

// POST update full DB state or specific keys
app.post('/api/db', (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const existing = readDb() || {};
  const updated = { ...existing, ...incoming, _lastUpdated: new Date().toISOString() };

  const success = writeDb(updated);
  if (success) {
    res.json({ success: true, timestamp: updated._lastUpdated });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// POST reset or initialize default DB if empty
app.post('/api/db/init', (req, res) => {
  const existing = readDb();
  if (!existing || Object.keys(existing).length === 0) {
    const defaultData = req.body;
    writeDb(defaultData);
    return res.json({ success: true, initialized: true });
  }
  res.json({ success: true, initialized: false, data: existing });
});

// Vite / Static files middleware
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
