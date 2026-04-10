import { MemoryRepository } from '../storage/MemoryRepository';
import { PromptInjector } from './PromptInjector';
import { IngestionPipeline } from './IngestionPipeline';
import { logger } from '../utils/logger';

export class MemoryMiddleware {
  private repo: MemoryRepository;
  private injector: PromptInjector;
  private pipeline: IngestionPipeline;
  private maxMemoryTokens: number;

  constructor(
    repo: MemoryRepository,
    injector: PromptInjector,
    pipeline: IngestionPipeline,
    maxMemoryTokens: number = 800
  ) {
    this.repo = repo;
    this.injector = injector;
    this.pipeline = pipeline;
    this.maxMemoryTokens = maxMemoryTokens;
  }

  async enhance(prompt: string, limit: number = 5): Promise<string> {
    const results = await this.repo.search(prompt, limit);
    return this.injector.inject(results, prompt, this.maxMemoryTokens);
  }

  async ingest(event: { input: string; output: string; agent: string; type?: string }): Promise<void> {
    try {
      await this.pipeline.ingest(event);
    } catch (error) {
      logger.error('Failed to ingest memory event in MemoryMiddleware', error);
    }
  }
}
