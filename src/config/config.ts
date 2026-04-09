import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(3000),
  SQLITE_PATH: z.string().default('./data/memory.db'),
  QDRANT_URL: z.string().default('http://localhost:6333'),
  QDRANT_COLLECTION: z.string().default('memories'),
  VECTOR_SIZE: z.coerce.number().default(1536)
});

const config = configSchema.parse(process.env);

export { config };
