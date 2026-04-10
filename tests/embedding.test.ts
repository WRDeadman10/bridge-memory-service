import { EmbeddingClient } from '../src/embedding/EmbeddingClient';

describe('EmbeddingClient', () => {
    let client: EmbeddingClient;
    const mockFetch = jest.fn();
    const EMBED_URL = 'http://localhost:11434/api/embeddings';
    const MODEL = 'nomic-embed-text';
    const VECTOR_SIZE = 1536;

    beforeEach(() => {
        // Mock global fetch
        global.fetch = mockFetch as any;
        mockFetch.mockReset();

        // Initialize client before each test
        client = new EmbeddingClient(EMBED_URL, MODEL, VECTOR_SIZE);
    });

    test('embed returns vector of correct size', async () => {
        // Mock successful response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ embedding: Array(1536).fill(0.1) }),
        });

        const result = await client.embed('hello');

        expect(result).toHaveLength(1536);
        expect(result[0]).toBe(0.1);
    });

    test('embed throws on HTTP error', async () => {
        // Mock failed response
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });

        await expect(client.embed('hello')).rejects.toThrow('Embedding request failed');
    });
});
