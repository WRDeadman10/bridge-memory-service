import Database from 'better-sqlite3';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class SqliteClient {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Create parent directories if they don't exist
    const dirName = path.dirname(dbPath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    this.db = new Database(dbPath);
  }

  public init(): void {
    const migrationSql = `
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT NOT NULL,
        importance_score REAL DEFAULT 0,
        recency_score REAL DEFAULT 0,
        embedding_id TEXT,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `;

    this.db.exec(migrationSql);
    logger.info('Database initialization completed');
  }

  public getDb(): Database.Database {
    return this.db;
  }
}
