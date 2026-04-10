import { MemoryMiddleware } from '../src/core/MemoryMiddleware';
import { PromptInjector } from '../src/core/PromptInjector';
import { MemoryRepository } from '../src/storage/MemoryRepository';
import { SearchResult, MemoryEntry } from '../src/core/types/MemoryTypes';
import { IngestionPipeline } from '../src/core/IngestionPipeline';
import { jest } from '@jest/globals';

describe('MemoryMiddleware', () => {
  let mockSearch: jest.Mock;
  let mockIngest: jest.Mock;
  let mockRepo: jest.Mocked<MemoryRepository>;
  let mockPipeline: jest.Mocked<IngestionPipeline>;
  let middleware: MemoryMiddleware;
  let injector: PromptInjector;

  beforeEach(() => {
    mockSearch = jest.fn();
    mockIngest = jest.fn();

    mockRepo = {
      search: mockSearch,
    } as unknown as jest.Mocked<MemoryRepository>;

    mockPipeline = {
      ingest: mockIngest,
    } as unknown as jest.Mocked<IngestionPipeline>;

    mockSearch.mockReset();
    mockIngest.mockReset();

    // Initialize dependencies
    injector = new PromptInjector();
    middleware = new MemoryMiddleware(mockRepo, injector, mockPipeline, 800);
  });

  it('inject returns userPrompt when results is empty array', () => {
    const userPrompt = 'test prompt';
    const results: SearchResult[] = [];
    
    const result = injector.inject(results, userPrompt, 100);
    expect(result).toBe(userPrompt);
  });

  it('inject returns string containing MEMORY CONTEXT when results has one entry with summary Test memory', () => {
    const userPrompt = 'test prompt';
    const memoryEntry: MemoryEntry = {
      id: '1',
      type: 0, // Assuming MemoryType enum value
      content: 'content',
      summary: 'Test memory',
      importanceScore: 0,
      recencyScore: 0,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const results: SearchResult[] = [{ entry: memoryEntry, score: 1 }];
    
    const result = injector.inject(results, userPrompt, 100);
    expect(result).toContain('[MEMORY CONTEXT]');
    expect(result).toContain('Test memory');
    expect(result).toContain('[USER PROMPT]');
  });

  it('enhance calls repo.search and returns string, where mockSearch resolves to empty array and enhance is called with the string hello', async () => {
    const prompt = 'hello';
    const limit = 5;
    
    // Setup mockSearch
    mockSearch.mockResolvedValue([]);

    // Execute the method under test
    const result = await middleware.enhance(prompt, limit);
    
    // Assertions
    expect(mockSearch).toHaveBeenCalledWith(prompt, limit);
    expect(result).toBe('hello');
  });
});
