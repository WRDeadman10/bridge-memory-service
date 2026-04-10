import { TokenController } from '../src/core/TokenController';
import { QueryUnderstanding } from '../src/core/QueryUnderstanding';
import { MemoryType, SearchResult } from '../src/core/types/MemoryTypes';

describe('Intelligence Tests', () => {
  const tokenController = new TokenController();
  const queryUnderstanding = new QueryUnderstanding();

  describe('TokenController', () => {
    it('estimate returns Math.ceil of text.length divided by 4 for input hello', () => {
      // length 5 -> ceil(5/4) = 2
      expect(tokenController.estimate('hello')).toBe(2);
    });

    it('trim returns empty array when maxTokens is 0', () => {
      const mockResults: SearchResult[] = [
        {
          entry: {
            id: '1', type: MemoryType.SEMANTIC, content: '', summary: 'test',
            importanceScore: 0, recencyScore: 0, tags: [],
            createdAt: new Date(), updatedAt: new Date()
          },
          score: 1
        }
      ];
      expect(tokenController.trim(mockResults, 0)).toEqual([]);
    });

    it('trim keeps only entries whose summaries fit within maxTokens budget', () => {
      // r1: 'abcdefghi' = 9 chars -> ceil(9/4) = 3 tokens
      const r1: SearchResult = {
        entry: { id: '1', type: MemoryType.SEMANTIC, content: '', summary: 'abcdefghi', importanceScore: 0, recencyScore: 0, tags: [], createdAt: new Date(), updatedAt: new Date() },
        score: 0.9
      };
      // r2: 'abcdefghijklmnopqrs' = 19 chars -> ceil(19/4) = 5 tokens
      const r2: SearchResult = {
        entry: { id: '2', type: MemoryType.SEMANTIC, content: '', summary: 'abcdefghijklmnopqrs', importanceScore: 0, recencyScore: 0, tags: [], createdAt: new Date(), updatedAt: new Date() },
        score: 0.8
      };
      // r3: 35 chars -> ceil(35/4) = 9 tokens — would push total to 17, exceeds budget
      const r3: SearchResult = {
        entry: { id: '3', type: MemoryType.SEMANTIC, content: '', summary: 'abcdefghijklmnopqrsabcdefghijklmnop', importanceScore: 0, recencyScore: 0, tags: [], createdAt: new Date(), updatedAt: new Date() },
        score: 0.7
      };

      // maxTokens=10: r1(3) + r2(5) = 8 <= 10, r3 would make 17 > 10, stop
      const trimmed = tokenController.trim([r1, r2, r3], 10);
      expect(trimmed.length).toBe(2);
      expect(trimmed[0].entry.id).toBe('1');
      expect(trimmed[1].entry.id).toBe('2');
    });
  });

  describe('QueryUnderstanding', () => {
    it('parse returns intent debug and EPISODIC for query containing error', () => {
      const result = queryUnderstanding.parse('why is there an error');
      expect(result.intent).toBe('debug');
      expect(result.suggestedTypes).toContain(MemoryType.EPISODIC);
    });

    it('parse returns intent general for a plain query', () => {
      const result = queryUnderstanding.parse('tell me something');
      expect(result.intent).toBe('general');
      expect(result.suggestedTypes).toEqual([MemoryType.EPISODIC, MemoryType.SEMANTIC, MemoryType.PROCEDURAL]);
    });
  });
});
