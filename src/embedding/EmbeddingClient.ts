import { logger } from '../utils/logger';
import { withRetry } from '../core/RetryHelper';

export class EmbeddingClient {
    private embedUrl: string;
    private model: string;
    private vectorSize: number;

    constructor(embedUrl: string, model: string, vectorSize: number) {
        this.embedUrl = embedUrl;
        this.model = model;
        this.vectorSize = vectorSize;
    }

    async embed(text: string): Promise<number[]> {
        const body = JSON.stringify({ model: this.model, prompt: text });

        const response = await withRetry(async () => {
            return fetch(this.embedUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });
        }, 2, 200);

        if (!response.ok) {
            throw new Error('Embedding request failed');
        }

        const data = await response.json();
        const embedding = data.embedding;

        if (!embedding || !Array.isArray(embedding)) {
            throw new Error('Unexpected embedding size');
        }

        if (embedding.length !== this.vectorSize) {
            throw new Error('Unexpected embedding size');
        }

        return embedding;
    }
}
