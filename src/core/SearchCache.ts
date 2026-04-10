import { SearchResult, MemoryType } from '../core/types/MemoryTypes';

export class SearchCache {
    private cache: Map<string, { results: SearchResult[]; expiry: number }>;
    private ttlMs: number;

    constructor(ttlMs: number = 60000) {
        this.cache = new Map<string, { results: SearchResult[]; expiry: number }>();
        this.ttlMs = ttlMs;
    }

    makeKey(query: string, limit: number, type?: MemoryType): string {
        const typeString = type === undefined ? 'none' : type.toString();
        return `${query}:${limit}:${typeString}`;
    }

    get(key: string): SearchResult[] | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.results;
    }

    set(key: string, results: SearchResult[]): void {
        const expiry = Date.now() + this.ttlMs;
        this.cache.set(key, { results, expiry });
    }
}
