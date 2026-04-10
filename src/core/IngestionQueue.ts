import { logger } from '../utils/logger';

export class IngestionQueue {
    private queue: { input: string; output: string; agent: string; type?: string }[] = [];
    private processing: boolean = false;
    private worker: (event: { input: string; output: string; agent: string; type?: string }) => Promise<void>;

    constructor(worker: (event: { input: string; output: string; agent: string; type?: string }) => Promise<void>) {
        this.worker = worker;
    }

    push(event: { input: string; output: string; agent: string; type?: string }): void {
        this.queue.push(event);
        if (!this.processing) {
            this.run();
        }
    }

    private async run(): Promise<void> {
        this.processing = true;
        while (this.queue.length > 0) {
            const event = this.queue.shift()!;
            try {
                await this.worker(event);
            } catch (error) {
                logger.error('Error processing event in IngestionQueue', error);
            }
        }
        this.processing = false;
    }
}
