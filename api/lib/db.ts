import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { config } from './config.js';
import { logger } from './logger.js';

type TableName =
  | 'users'
  | 'progress'
  | 'submissions'
  | 'simRecords'
  | 'chatSessions'
  | 'chatMessages'
  | 'classSessions'
  | 'classEvents';

const TABLES: TableName[] = [
  'users', 'progress', 'submissions', 'simRecords', 'chatSessions', 'chatMessages',
  'classSessions', 'classEvents',
];

let dbInstance: Database.Database | null = null;

function getDB(): Database.Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(config.storage.dataDir)) {
    fs.mkdirSync(config.storage.dataDir, { recursive: true });
  }

  const dbPath = path.join(config.storage.dataDir, 'app.db');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('synchronous = NORMAL');

  for (const t of TABLES) {
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS ${t} (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    dbInstance.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_updated ON ${t}(updated_at);`);
  }

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  logger.info(`[DB:SQLite] initialized at ${dbPath}`);
  return dbInstance;
}

function parseRow(row: any): any {
  if (!row) return undefined;
  const obj = JSON.parse(row.data);
  obj.id = row.id;
  obj.createdAt = row.created_at;
  obj.updatedAt = row.updated_at;
  return obj;
}

export const db = {
  all(table: string): any[] {
    if (table === 'meta') return [];
    const d = getDB();
    const rows = d.prepare(`SELECT * FROM ${table} ORDER BY updated_at DESC`).all() as any[];
    return rows.map(parseRow);
  },

  find(table: string, predicate: (item: any) => boolean): any | undefined {
    return this.all(table).find(predicate);
  },

  filter(table: string, predicate: (item: any) => boolean): any[] {
    return this.all(table).filter(predicate);
  },

  insert(table: string, item: Record<string, any>): any {
    const d = getDB();
    const id = item.id || nanoid(12);
    const now = Date.now();
    const data = { ...item };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    d.prepare(`INSERT INTO ${table} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
      id, JSON.stringify(data), item.createdAt || now, now
    );
    return { ...data, id, createdAt: item.createdAt || now, updatedAt: now };
  },

  upsert(table: string, key: string, item: Record<string, any>): any {
    const existing = this.all(table).find((r: any) => r[key] === item[key]);
    if (existing) {
      return this.update(table, (r: any) => r.id === existing.id, () => ({ ...existing, ...item })) > 0
        ? this.find(table, (r: any) => r.id === existing.id)
        : existing;
    }
    return this.insert(table, item);
  },

  update(
    table: string,
    predicate: (item: any) => boolean,
    updater: (item: any) => any
  ): number {
    const d = getDB();
    const rows = this.all(table);
    let n = 0;
    const stmt = d.prepare(`UPDATE ${table} SET data = ?, updated_at = ? WHERE id = ?`);
    const updateTx = d.transaction((items: any[]) => {
      for (const item of items) {
        if (predicate(item)) {
          const updated = updater(item);
          const data = { ...updated };
          delete data.id;
          delete data.createdAt;
          delete data.updatedAt;
          stmt.run(JSON.stringify(data), Date.now(), item.id);
          n++;
        }
      }
    });
    updateTx(rows);
    return n;
  },

  remove(table: string, predicate: (item: any) => boolean): number {
    const d = getDB();
    const rows = this.all(table);
    let n = 0;
    const stmt = d.prepare(`DELETE FROM ${table} WHERE id = ?`);
    const delTx = d.transaction((items: any[]) => {
      for (const item of items) {
        if (predicate(item)) {
          stmt.run(item.id);
          n++;
        }
      }
    });
    delTx(rows);
    return n;
  },

  meta(k: string, fallback?: any): any {
    const d = getDB();
    const row = d.prepare('SELECT value FROM _meta WHERE key = ?').get(k) as any;
    if (!row) return fallback;
    try { return JSON.parse(row.value); } catch { return row.value; }
  },

  setMeta(k: string, v: any) {
    const d = getDB();
    d.prepare('INSERT OR REPLACE INTO _meta (key, value) VALUES (?, ?)').run(k, JSON.stringify(v));
  },

  reset() {
    const d = getDB();
    const tx = d.transaction(() => {
      for (const t of TABLES) {
        d.exec(`DELETE FROM ${t};`);
      }
      d.exec(`DELETE FROM _meta;`);
    });
    tx();
    logger.info('[DB:SQLite] all tables cleared');
  },

  forceFlush() {
    // SQLite is synchronous, no flush needed
  },

  close() {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }
  },
};

process.on('SIGTERM', () => { try { db.close(); } catch {/* noop */} });
process.on('SIGINT', () => { try { db.close(); } catch {/* noop */} });
