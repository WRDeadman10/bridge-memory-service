import { MemoryRepository } from '../storage/MemoryRepository';
import { MemoryType } from '../core/types/MemoryTypes';
import { logger } from '../utils/logger';

export class IngestionPipeline {
  private repo: MemoryRepository;

  constructor(repo: MemoryRepository) {
    this.repo = repo;
  }

  async ingest(event: { input: string; output: string; agent: string; type?: string }): Promise<void> {
    try {
      // Classify MemoryType
      const outputLower = event.output.toLowerCase();
      let memoryType: MemoryType;

      if (outputLower.includes('fix') || outputLower.includes('error') || outputLower.includes('bug')) {
        memoryType = MemoryType.EPISODIC;
      } else {
        memoryType = MemoryType.PROCEDURAL;
      }

      // Prepare arguments for repo.save
      const content = `${event.input}\n${event.output}`;
      const summary = event.input.substring(0, 100);
      const tags = [event.agent];

      // Save memory
      await this.repo.save({
        type: memoryType,
        content: content,
        summary: summary,
        tags: tags,
      });
    } catch (error) {
      logger.error('Failed to ingest memory event', error);
    }
  }
}
