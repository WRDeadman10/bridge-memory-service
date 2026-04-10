import { SqliteClient } from './relational/SqliteClient';
import { VectorClient } from './vector/VectorClient';
import { MemoryEntry, MemoryType, SaveMemoryRequest, SearchResult } from '../core/types/MemoryTypes';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { EmbeddingClient } from '../embedding/EmbeddingClient';

export class MemoryRepository {
  private sqlite: SqliteClient;
  private vector: VectorClient;
  private embedding: EmbeddingClient;

  constructor(sqlite: SqliteClient, vector: VectorClient, embedding: EmbeddingClient) {
    this.sqlite = sqlite;
    this.vector = vector;
    this.embedding = embedding;
  }

  async save(req: SaveMemoryRequest): Promise<MemoryEntry> {
    const id = uuidv4();
    const importanceScore = 0.5;
    const recencyScore = 1.0;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const tagsJson = JSON.stringify(req.tags);

    const memoryEntry: MemoryEntry = {
      id,
      type: req.type,
      content: req.content,
      summary: req.summary,
      importanceScore,
      recencyScore,
      embeddingId: null,
      tags: req.tags,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt)
    };

    this.sqlite.getDb().prepare(`
      INSERT INTO memory_entries (
        id, type, content, summary, importance_score, recency_score, embedding_id, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.type,
      req.content,
      req.summary,
      importanceScore,
      recencyScore,
      null,
      tagsJson,
      createdAt,
      updatedAt
    );

    const embVector = await this.embedding.embed(req.content);
    await this.vector.upsert(id, embVector, { content: req.content, type: String(req.type) });

    return memoryEntry;
  }

  async search(query: string, limit: number, type?: MemoryType): Promise<SearchResult[]> {
    const qVec = await this.embedding.embed(query);
    const vResults = await this.vector.search(qVec, limit);

    if (vResults.length === 0) return [];

    const ids = vResults.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    let sql = 'SELECT * FROM memory_entries WHERE id IN (' + placeholders + ')';
    const params: any[] = [...ids];

    if (type !== undefined) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const rows = this.sqlite.getDb().prepare(sql).all(...params) as any[];

    return rows.map(row => ({
      entry: {
        id: row.id,
        type: row.type,
        content: row.content,
        summary: row.summary,
        importanceScore: row.importance_score,
        recencyScore: row.recency_score,
        embeddingId: row.embedding_id,
        tags: JSON.parse(row.tags),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      },
      score: vResults.find(v => v.id === row.id)?.score ?? 0
    })).sort((a, b) => b.score - a.score);
  }
}
