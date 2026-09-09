import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = 3000;
const app = express();

// Increase payload limit for photos / evidence
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Error al crear directorio data:', e);
  }
}

const CONFIG_FILE = path.join(DATA_DIR, 'supabase-config.json');
const REPORTS_BACKUP_FILE = path.join(DATA_DIR, 'reports-backup.json');
const SUPABASE_TABLE_NAME = 'incidencias_distrito';
const DEFAULT_SUPABASE_URL = 'https://kcunaxyxanmokzvnhnsi.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdW5heHl4YW5tb2t6dm5obnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDgxNDUsImV4cCI6MjEwNDM4NDE0NX0.WpavQ9W4btGgfhQwvbU_XDcWHrktyChKJijOQoAP5Rk';

// Helper to read server config
function getServerConfig(): { url: string; anonKey: string } {
  // 1. Check config file
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (data.url && data.anonKey) {
        return { url: data.url.trim(), anonKey: data.anonKey.trim() };
      }
    } catch (e) {
      console.warn('Error al leer supabase-config.json:', e);
    }
  }

  // 2. Check process.env
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_KEY };
}

// Helper to save server config
function saveServerConfig(url: string, anonKey: string): boolean {
  try {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim(), updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
    return true;
  } catch (e) {
    console.error('Error al guardar supabase-config.json:', e);
    return false;
  }
}

// Helper to get server-side Supabase client
function getServerSupabaseClient() {
  const config = getServerConfig();
  if (!config) return null;
  try {
    return createClient(config.url, config.anonKey);
  } catch (e) {
    console.error('Error al crear cliente Supabase server-side:', e);
    return null;
  }
}

// Helper to read backup reports
function getBackupReports(): any[] {
  if (fs.existsSync(REPORTS_BACKUP_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(REPORTS_BACKUP_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Error al leer backup de reportes:', e);
    }
  }
  return [];
}

// Helper to save backup reports
function saveBackupReports(reports: any[]) {
  try {
    fs.writeFileSync(REPORTS_BACKUP_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error al guardar backup de reportes:', e);
  }
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET /api/config: returns central Supabase configuration to any client worldwide
app.get('/api/config', (req, res) => {
  const config = getServerConfig();
  if (config) {
    res.json({
      configured: true,
      url: config.url,
      anonKey: config.anonKey
    });
  } else {
    res.json({
      configured: false,
      url: 'https://kcunaxyxanmokzvnhnsi.supabase.co',
      anonKey: ''
    });
  }
});

// POST /api/config: saves central Supabase configuration
app.post('/api/config', (req, res) => {
  const { url, anonKey } = req.body || {};
  if (!url || !anonKey) {
    return res.status(400).json({ error: 'URL y Anon Key son requeridos.' });
  }

  const saved = saveServerConfig(url, anonKey);
  if (saved) {
    res.json({ success: true, message: 'Configuración guardada centralmente para todos los usuarios.' });
  } else {
    res.status(500).json({ error: 'No se pudo guardar la configuración en el servidor.' });
  }
});

// GET /api/reports: pulls reports from Supabase (or backup if Supabase unavailable)
app.get('/api/reports', async (req, res) => {
  const supabase = getServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .select('*');

      if (!error && data) {
        // Update local backup with Supabase data
        saveBackupReports(data);
        return res.json({ success: true, source: 'supabase', reports: data });
      } else if (error) {
        console.warn('Supabase query error, using local backup:', error);
      }
    } catch (e) {
      console.warn('Excepción consultando Supabase desde servidor:', e);
    }
  }

  // Fallback to local backup file
  const backup = getBackupReports();
  res.json({ success: true, source: 'backup', reports: backup });
});

// POST /api/reports: stores a batch of reports
app.post('/api/reports', async (req, res) => {
  const newReports = Array.isArray(req.body) ? req.body : req.body?.reports;
  if (!newReports || !Array.isArray(newReports) || newReports.length === 0) {
    return res.status(400).json({ error: 'Se esperaba un arreglo de reportes.' });
  }

  // 1. Always update server backup so data is NEVER lost
  const existing = getBackupReports();
  const updatedBackup = [...newReports, ...existing];
  saveBackupReports(updatedBackup);

  // 2. Insert into Supabase if configured
  const supabase = getServerSupabaseClient();
  let supabaseSuccess = false;
  let supabaseError = null;

  if (supabase) {
    try {
      const payload = newReports.map((r: any) => ({
        nombre_informante: r.nombre_informante || '',
        odpe: r.odpe || '',
        distrito: r.distrito || '',
        rubro_id: Number(r.rubro_id) || 0,
        categoria: r.categoria || '',
        pregunta_texto: r.pregunta_texto || '',
        tiene_problema: Boolean(r.tiene_problema),
        ocurrencia: r.ocurrencia || '',
        consecuencia: r.consecuencia || '',
        acciones_odpe: r.acciones_odpe || '',
        fuente_evidencia: r.fuente_evidencia || '',
        fecha_creacion: r.fecha_creacion || new Date().toISOString()
      }));

      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .insert(payload);

      if (error) {
        console.error('Error insertando en Supabase desde servidor:', error);
        supabaseError = error.message;
      } else {
        supabaseSuccess = true;
      }
    } catch (e: any) {
      console.error('Excepción insertando en Supabase:', e);
      supabaseError = e?.message || 'Error desconocido';
    }
  }

  res.json({
    success: true,
    count: newReports.length,
    supabaseSuccess,
    supabaseError,
    message: supabaseSuccess 
      ? 'Reporte guardado exitosamente en Supabase y respaldo central.'
      : 'Reporte guardado en respaldo del servidor.'
  });
});

// DELETE /api/reports/:id: deletes a single report (requires password '2026Mario')
app.delete('/api/reports/:id', async (req, res) => {
  const password = (req.headers['x-admin-key'] || req.body?.password || req.query?.password || '').toString().trim();
  if (password !== '2026Mario') {
    return res.status(403).json({ error: 'Clave incorrecta. Solo el personal con la clave "2026Mario" puede eliminar este reporte.' });
  }

  const reportId = req.params.id;
  const existing = getBackupReports();
  const filtered = existing.filter((r: any) => r.id !== reportId && r.id_local !== reportId);
  saveBackupReports(filtered);

  const supabase = getServerSupabaseClient();
  let supabaseDeleted = false;
  if (supabase) {
    try {
      const { error } = await supabase.from(SUPABASE_TABLE_NAME).delete().eq('id', reportId);
      if (!error) supabaseDeleted = true;
    } catch (e) {
      console.error('Error al borrar reporte individual en Supabase:', e);
    }
  }

  res.json({ success: true, reportId, supabaseDeleted });
});

// DELETE /api/reports: clears all reports (requires password '2026Mario')
app.delete('/api/reports', async (req, res) => {
  const password = (req.headers['x-admin-key'] || req.body?.password || req.query?.password || '').toString().trim();
  if (password !== '2026Mario') {
    return res.status(403).json({ error: 'Clave incorrecta. Solo el personal con la clave "2026Mario" puede eliminar reportes.' });
  }

  saveBackupReports([]);

  const supabase = getServerSupabaseClient();
  let supabaseDeleted = false;
  if (supabase) {
    try {
      await supabase.from(SUPABASE_TABLE_NAME).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      supabaseDeleted = true;
    } catch (e) {
      console.error('Error al borrar en Supabase:', e);
    }
  }

  res.json({ success: true, supabaseDeleted });
});

// ================= FRONTEND / VITE SERVING =================
async function start() {
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
    console.log(`Servidor ONPE MACE corriendo en http://0.0.0.0:${PORT}`);
  });
}

start();
