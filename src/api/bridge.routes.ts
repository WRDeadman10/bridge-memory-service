import { Router, Request, Response } from 'express';
import { MemoryMiddleware } from '../core/MemoryMiddleware';
import { logger } from '../utils/logger';

export function createBridgeRouter(middleware: MemoryMiddleware): Router {
  const router = Router();

  // POST /bridge/enhance
  router.post('/bridge/enhance', async (req: Request, res: Response) => {
    try {
      const { prompt, agentName, limit } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      // Use 5 as default limit if not provided or invalid
      const enhancementLimit = limit !== undefined ? Number(limit) : 5;

      const enhancedPrompt = await middleware.enhance(prompt, enhancementLimit);
      
      return res.status(200).json({ enhancedPrompt });

    } catch (error) {
      logger.error('Error enhancing prompt in /bridge/enhance', error);
      return res.status(500).json({ error: 'Internal server error during prompt enhancement.' });
    }
  });

  // POST /bridge/ingest
  router.post('/bridge/ingest', async (req: Request, res: Response) => {
    try {
      const { input, output, agent } = req.body;

      if (!input || !output || !agent) {
        return res.status(400).json({ error: 'Input, output, and agent are required for ingestion.' });
      }

      const event = { input, output, agent, type: 'tool' };
      await middleware.ingest(event);
      
      return res.status(200).json({ status: 'ok' });

    } catch (error) {
      logger.error('Error ingesting memory event in /bridge/ingest', error);
      return res.status(500).json({ error: 'Internal server error during memory ingestion.' });
    }
  });

  return router;
}
