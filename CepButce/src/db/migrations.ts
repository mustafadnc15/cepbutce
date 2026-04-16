import { type DB } from '@op-engineering/op-sqlite';
import { getDB } from './connection';
import { DEFAULT_CATEGORIES } from '../constants/categories';

interface Migration {
  version: number;
  up: (db: DB) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.executeSync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      db.executeSync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          type TEXT NOT NULL,
          isDefault INTEGER NOT NULL
        );
      `);

      db.executeSync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          type TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          receiptUri TEXT,
          receiptOcrData TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      db.executeSync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      `);

      db.executeSync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
      `);

      db.executeSync(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL,
          billingCycle TEXT NOT NULL,
          categoryId TEXT NOT NULL,
          startDate TEXT NOT NULL,
          nextRenewalDate TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          note TEXT,
          isActive INTEGER NOT NULL,
          remindBefore INTEGER NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);

      db.executeSync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          categoryId TEXT,
          amount REAL NOT NULL,
          period TEXT NOT NULL,
          currency TEXT NOT NULL
        );
      `);

      // Seed default categories
      for (const cat of DEFAULT_CATEGORIES) {
        db.executeSync(
          `INSERT OR IGNORE INTO categories (id, name, icon, color, type, isDefault) VALUES (?, ?, ?, ?, ?, ?);`,
          [cat.id, cat.name, cat.icon, cat.color, cat.type, cat.isDefault ? 1 : 0]
        );
      }
    },
  },
];

function getCurrentVersion(db: DB): number {
  try {
    const result = db.executeSync(
      `SELECT value FROM settings WHERE key = 'db_version';`
    );
    const row = result.rows?.[0];
    if (!row || typeof row.value !== 'string') return 0;
    const parsed = parseInt(row.value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    // settings table doesn't exist yet — v0
    return 0;
  }
}

function setCurrentVersion(db: DB, version: number): void {
  db.executeSync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('db_version', ?);`,
    [version.toString()]
  );
}

export function runMigrations(): void {
  const db = getDB();
  const current = getCurrentVersion(db);
  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    migration.up(db);
    setCurrentVersion(db, migration.version);
  }
}

export function logCategoryCount(): void {
  const db = getDB();
  const result = db.executeSync(`SELECT COUNT(*) as count FROM categories;`);
  const count = result.rows?.[0]?.count ?? 0;
  console.log(`[db] categories table: ${count} rows`);
}
