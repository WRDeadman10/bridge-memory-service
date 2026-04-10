import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '../../utils/logger';

export class VectorClient {
  private client: QdrantClient;
  private collectionName: string;
  private vectorSize: number;

  constructor(qdrantUrl: string, collectionName: string, vectorSize: number) {
    this.client = new QdrantClient({ url: qdrantUrl });
    this.collectionName = collectionName;
    this.vectorSize = vectorSize;
  }

  async ensureCollection(): Promise<void> {
    const collections = await this.client.getCollections();
    if (!collections.collections.some(c => c.name === this.collectionName)) {
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine'
        }
      });
      logger.info(`Created collection ${this.collectionName}`);
    } else {
      logger.info(`Collection ${this.collectionName} already exists`);
    }
  }

  async upsert(id: string, vector: number[], payload: Record<string, unknown>): Promise<void> {
    await this.client.upsert(this.collectionName, {
      points: [
        {
          id: id,
          vector,
          payload
        }
      ]
    });
    logger.info(`Upserted document with id ${id}`);
  }

  async search(vector: number[], limit: number): Promise<Array<{ id: string, score: number, payload: Record<string, unknown> }>> {
    const result = await this.client.search(this.collectionName, {
      vector,
      limit
    });
    logger.info(`Searched for vector with limit ${limit}`);
    return result.map(item => ({
      id: item.id.toString(),
      score: item.score,
      payload: (item.payload ?? {}) as Record<string, unknown>
    }));
  }
}
