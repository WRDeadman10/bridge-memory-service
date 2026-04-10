import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  SQLITE_PATH: z.string().default('./data/memory.db'),
  QDRANT_URL: z.string().default('http://localhost:6333'),
  QDRANT_COLLECTION: z.string().default('memories'),
  VECTOR_SIZE: z.coerce.number().default(1536),
  EMBED_URL: z.string().default('http://localhost:11434/api/embeddings'),
  EMBED_MODEL: z.string().default('nomic-embed-text')
});

const config = configSchema.parse(process.env);

export { config };
