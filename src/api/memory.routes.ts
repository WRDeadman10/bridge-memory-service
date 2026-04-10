import { Router } from 'express';
import { MemoryRepository } from '../storage/MemoryRepository';
import { SaveMemoryRequest, SearchMemoryRequest, MemoryType } from '../core/types/MemoryTypes';
import { logger } from '../utils/logger';
import { metrics } from '../core/Metrics';

export function createMemoryRouter(repo: MemoryRepository): Router {
  const router = Router();

  router.post('/memory/save', async (req, res) => {
    try {
      logger.info('POST /memory/save request received');

      const { type, content, summary, tags } = req.body;

      if (!type || !content || !summary || !tags) {
        return res.status(400).send('Missing required fields');
      }

      const saveRequest: SaveMemoryRequest = {
        type,
        content,
        summary,
        tags
      };

      const savedEntry = await repo.save(saveRequest);
      res.status(201).json(savedEntry);
      metrics.increment('saves');
    } catch (error) {
      logger.error('Error saving memory', error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.get('/memory/search', async (req, res) => {
    try {
      logger.info('GET /memory/search request received');

      const query = req.query.query as string | undefined; const limit = (req.query.limit as string) || '10'; const type = req.query.type as any;

      if (!query) {
        return res.status(400).send('Missing required field: query');
      }

      const searchRequest: SearchMemoryRequest = {
        query,
        limit: parseInt(limit as string, 10),
        type: type as MemoryType | undefined
      };

      const results = await repo.search(searchRequest.query, searchRequest.limit, searchRequest.type);
      res.status(200).json(results);
      metrics.increment('searches');
    } catch (error) {
      logger.error('Error searching memory', error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.get('/metrics', async (req, res) => {
    try {
      res.status(200).json(metrics.snapshot());
    } catch (error) {
      logger.error('Error retrieving metrics', error);
      res.status(500).send('Internal Server Error');
    }
  });

  router.get('/health', (_req, res) => { res.status(200).json({ status: 'ok', service: 'bridge-memory-service' }); });

  return router;
}
