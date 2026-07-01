import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import pool from '../../db/config.js';

const execAsync   = promisify(exec);
const BACKUP_DIR  = path.resolve('backups');
const KEEP_DAYS   = 7;

// Orden de exportación respetando dependencias (FK)
const TENANT_TABLES = [
  'customers', 'products', 'admins',
  'sales', 'sale_details', 'payments',
  'shopping', 'audit_logs', 'monthly_closings',
];

const ensureDir = async () => {
  if (!existsSync(BACKUP_DIR)) await mkdir(BACKUP_DIR, { recursive: true });
};

const serializeValue = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean')        return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number')         return v.toString();
  if (v instanceof Date)             return `'${v.toISOString()}'`;
  if (Array.isArray(v)) {
    const items = v.map(item =>
      typeof item === 'string' ? `'${item.replace(/'/g, "''")}'` : String(item)
    ).join(', ');
    return `ARRAY[${items}]::TEXT[]`;
  }
  if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

// ── Backup completo ────────────────────────────────────────────────────────

export const runFullBackup = async () => {
  await ensureDir();
  const date     = new Date().toISOString().slice(0, 10);
  const filename = `backup_${date}_${Date.now()}.dump`;
  const filepath = path.join(BACKUP_DIR, filename);

  const { DB_HOST = 'localhost', DB_USER = 'postgres', DB_NAME = 'kreditfy', DB_PASSWORD = '' } = process.env;
  const cmd = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -F c -f "${filepath}"`;

  await execAsync(cmd);
  await cleanOldBackups();
  const info = await stat(filepath);
  return { filename, size_mb: (info.size / 1024 / 1024).toFixed(2) };
};

export const cleanOldBackups = async () => {
  await ensureDir();
  const files = (await readdir(BACKUP_DIR))
    .filter(f => f.startsWith('backup_') && f.endsWith('.dump'))
    .sort()
    .reverse();

  for (const file of files.slice(KEEP_DAYS)) {
    await unlink(path.join(BACKUP_DIR, file));
  }
};

export const getLastBackupInfo = async () => {
  await ensureDir();
  const files = (await readdir(BACKUP_DIR))
    .filter(f => f.startsWith('backup_') && f.endsWith('.dump'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  const latest = files[0];
  const info   = await stat(path.join(BACKUP_DIR, latest));
  return {
    filename:   latest,
    size_mb:    (info.size / 1024 / 1024).toFixed(2),
    created_at: info.mtime,
    count:      files.length,
  };
};

// ── Dump lógico por tenant ─────────────────────────────────────────────────

export const generateTenantDump = async (tenantId, tenantName) => {
  const lines = [
    `-- Backup lógico de tenant: ${tenantName} (ID: ${tenantId})`,
    `-- Generado: ${new Date().toISOString()}`,
    `-- Sistema: Kreditfy`,
    '',
    'BEGIN;',
    '',
  ];

  for (const table of TENANT_TABLES) {
    const { rows } = await pool.query(
      `SELECT * FROM "${table}" WHERE tenant_id = $1 ORDER BY id`,
      [tenantId]
    );

    lines.push(`-- Tabla: ${table} (${rows.length} registros)`);

    if (rows.length > 0) {
      const cols    = Object.keys(rows[0]);
      const colList = cols.map(c => `"${c}"`).join(', ');
      for (const row of rows) {
        const vals = cols.map(c => serializeValue(row[c])).join(', ');
        lines.push(`INSERT INTO "${table}" (${colList}) VALUES (${vals});`);
      }
    }

    lines.push('');
  }

  lines.push('COMMIT;');
  return lines.join('\n');
};
