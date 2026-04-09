import express from 'express';
import { config } from './config/config';
import { SqliteClient } from './storage/relational/SqliteClient';
import { VectorClient } from './storage/vector/VectorClient';
import { MemoryRepository } from './storage/MemoryRepository';
import { createMemoryRouter } from './api/memory.routes';
import { logger } from './utils/logger';

async function main() {
  const sqlite = new SqliteClient(config.SQLITE_PATH);
  await sqlite.init();

  const vector = new VectorClient(config.QDRANT_URL, config.QDRANT_COLLECTION, config.VECTOR_SIZE);
  await vector.ensureCollection();

  const repo = new MemoryRepository(sqlite, vector);

  const app = express();
  app.use(express.json());
  app.use('/', createMemoryRouter(repo));

  app.listen(config.PORT, () => {
    logger.info(`Server is running on port ${config.PORT}`);
  });
}

main().catch(error => {
  logger.error('Error starting server', error);
});
