import express from 'express';
import { config } from './config/config';
import { SqliteClient } from './storage/relational/SqliteClient';
import { VectorClient } from './storage/vector/VectorClient';
import { MemoryRepository } from './storage/MemoryRepository';
import { EmbeddingClient } from './embedding/EmbeddingClient';
import { createMemoryRouter } from './api/memory.routes';
import { logger } from './utils/logger';
import { IngestionPipeline } from './core/IngestionPipeline';
import { PromptInjector } from './core/PromptInjector';
import { MemoryMiddleware } from './core/MemoryMiddleware';
import { TokenController } from './core/TokenController';
import { QueryUnderstanding } from './core/QueryUnderstanding';
import { createBridgeRouter } from './api/bridge.routes';

async function main() {
  const sqlite = new SqliteClient(config.SQLITE_PATH);
  await sqlite.init();

  // Qdrant is optional — if it's not running the service falls back to SQLite-only mode.
  // Set ENABLE_VECTOR=false in .env (or leave Qdrant offline) to skip vector search entirely.
  let vector: VectorClient | null = null;
  if (process.env.ENABLE_VECTOR !== 'false') {
    try {
      vector = new VectorClient(config.QDRANT_URL, config.QDRANT_COLLECTION, config.VECTOR_SIZE);
      await vector.ensureCollection();
      logger.info('Qdrant vector store connected.');
    } catch (err) {
      logger.warn(`Qdrant unavailable (${err}). Running in SQLite-only mode — semantic search disabled.`);
      vector = null;
    }
  } else {
    logger.info('Vector search disabled via ENABLE_VECTOR=false. Running in SQLite-only mode.');
  }

  const embedding = new EmbeddingClient(config.EMBED_URL, config.EMBED_MODEL, config.VECTOR_SIZE);
  const repo = new MemoryRepository(sqlite, vector, embedding);

  const pipeline = new IngestionPipeline(repo);
  const injector = new PromptInjector();
  const tokenController = new TokenController();
  const queryUnderstanding = new QueryUnderstanding();
  const middleware = new MemoryMiddleware(repo, injector, pipeline, config.MAX_MEMORY_TOKENS, tokenController, queryUnderstanding);

  const app = express();
  app.use(express.json());
  app.use('/', createMemoryRouter(repo));
  app.use(createBridgeRouter(middleware));

  app.listen(config.PORT, () => {
    logger.info(`Server is running on port ${config.PORT}`);
  });
}

main().catch(error => {
  logger.error('Error starting server', error);
});
