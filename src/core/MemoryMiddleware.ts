import { MemoryRepository } from '../storage/MemoryRepository';
import { PromptInjector } from './PromptInjector';
import { IngestionPipeline } from './IngestionPipeline';
import { logger } from '../utils/logger';
import { TokenController } from './TokenController';
import { QueryUnderstanding } from './QueryUnderstanding';

export class MemoryMiddleware {
  private repo: MemoryRepository;
  private injector: PromptInjector;
  private pipeline: IngestionPipeline;
  private maxMemoryTokens: number;
  private tokenController: TokenController;
  private queryUnderstanding: QueryUnderstanding;

  constructor(
    repo: MemoryRepository,
    injector: PromptInjector,
    pipeline: IngestionPipeline,
    maxMemoryTokens: number = 800,
    tokenController: TokenController,
    queryUnderstanding: QueryUnderstanding
  ) {
    this.repo = repo;
    this.injector = injector;
    this.pipeline = pipeline;
    this.maxMemoryTokens = maxMemoryTokens;
    this.tokenController = tokenController;
    this.queryUnderstanding = queryUnderstanding;
  }

  async enhance(prompt: string, limit: number = 5): Promise<string> {
    const parsed = this.queryUnderstanding.parse(prompt);
    const suggestedType = parsed.suggestedTypes.length > 0 ? parsed.suggestedTypes[0] : undefined;
    const results = await this.repo.search(prompt, limit, suggestedType);
    const trimmed = this.tokenController.trim(results, this.maxMemoryTokens);
    return this.injector.inject(trimmed, prompt, this.maxMemoryTokens);
  }

  async ingest(event: { input: string; output: string; agent: string; type?: string }): Promise<void> {
    try {
      await this.pipeline.ingest(event);
    } catch (error) {
      logger.error('Failed to ingest memory event in MemoryMiddleware', error);
    }
  }
}
