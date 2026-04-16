import { open, type DB } from '@op-engineering/op-sqlite';

let dbInstance: DB | null = null;

export function getDB(): DB {
  if (!dbInstance) {
    dbInstance = open({ name: 'cepbutce.db' });
  }
  return dbInstance;
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
