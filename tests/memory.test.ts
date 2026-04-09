import { SqliteClient } from '../src/storage/relational/SqliteClient';
import { MemoryRepository } from '../src/storage/MemoryRepository';
import { MemoryType } from '../src/core/types/MemoryTypes';

class MockVectorClient {
  async ensureCollection() {}
  async upsert(id: string, vector: number[], options?: any) {}
  async search(query: string, limit?: number): Promise<any[]> {
    return [];
  }
}

describe('MemoryRepository integration', () => {
  let sqlite: SqliteClient;
  let vector: MockVectorClient;
  let repo: MemoryRepository;

  beforeEach(() => {
    sqlite = new SqliteClient(':memory:');
    sqlite.init();
    vector = new MockVectorClient();
    repo = new MemoryRepository(sqlite, vector);
  });

  test('save returns a MemoryEntry with generated id', async () => {
    const result = await repo.save({
      type: MemoryType.EPISODIC,
      content: 'test content',
      summary: 'test',
      tags: []
    });

    expect(result.id).toBeDefined();
    expect(result.content).toEqual('test content');
    expect(result.type).toEqual(MemoryType.EPISODIC);
  });

  test('search returns saved entry', async () => {
    await repo.save({
      type: MemoryType.EPISODIC,
      content: 'test content',
      summary: 'test',
      tags: []
    });

    const results = await repo.search('test', 10);
    expect(results.length).toBe(1);
    expect(results[0].entry.content).toEqual('test content');
  });
});
