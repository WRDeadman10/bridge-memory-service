import { IngestionPipeline } from './IngestionPipeline';
import { logger } from '../utils/logger';

export function wrapTool(
  tool: Function,
  pipeline: IngestionPipeline,
  agentName: string
) {
  return async (...args: any[]) => {
    try {
      // Call the original tool
      const result = await tool(...args);

      // Ingest memory event
      await pipeline.ingest({
        input: JSON.stringify(args),
        output: JSON.stringify(result),
        agent: agentName,
        type: 'tool',
      }).catch(error => {
        logger.error('Failed to ingest memory event after tool execution', error);
      });

      // Return the result from the original tool call
      return result;
    } catch (error) {
      // Re-throw error if the tool call fails
      throw error;
    }
  };
}
