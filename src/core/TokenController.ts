import { SearchResult } from '../core/types/MemoryTypes';

export class TokenController {
    /**
     * Estimates the number of tokens for a given text.
     * @param text The text to estimate tokens for.
     * @returns The estimated token count.
     */
    estimate(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Trims a list of search results to fit within a maximum token limit.
     * @param results The array of search results.
     * @param maxTokens The maximum number of tokens allowed.
     * @returns The trimmed array of search results.
     */
    trim(results: SearchResult[], maxTokens: number): SearchResult[] {
        // Sort a copy of results descending by score
        const sortedResults = [...results].sort((a, b) => b.score - a.score);

        const accumulatedResults: SearchResult[] = [];
        let currentTokenCount = 0;

        for (const result of sortedResults) {
            const tokens = this.estimate(result.entry.summary);

            // Stop when adding the next entry would exceed maxTokens
            if (currentTokenCount + tokens <= maxTokens) {
                accumulatedResults.push(result);
                currentTokenCount += tokens;
            } else {
                break;
            }
        }

        return accumulatedResults;
    }
}
