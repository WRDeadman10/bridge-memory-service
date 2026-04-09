export enum MemoryType {
  EPISODIC,
  SEMANTIC,
  PROCEDURAL
}

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  summary: string;
  importanceScore: number; // 0-1
  recencyScore: number; // 0-1
  embeddingId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveMemoryRequest {
  type: MemoryType;
  content: string;
  summary: string;
  tags: string[];
}

export interface SearchMemoryRequest {
  query: string;
  limit?: number; // optional, default 10
  type?: MemoryType; // optional
}

export interface SearchResult {
  entry: MemoryEntry;
  score: number;
}
