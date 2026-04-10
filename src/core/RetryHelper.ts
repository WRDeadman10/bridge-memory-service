import { logger } from '../utils/logger';

export async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 100
): Promise<T> {
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i < retries) {
                logger.warn(`Attempt ${i + 1} failed. Retrying in ${delayMs}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
                // i === retries, rethrow the error
                throw error;
            }
        }
    }
    // This line should theoretically be unreachable if retries >= 0
    throw new Error('Retry mechanism failed to complete or throw an error.');
}
