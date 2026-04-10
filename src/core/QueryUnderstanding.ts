import { MemoryType } from '../core/types/MemoryTypes';

export class QueryUnderstanding {
    /**
     * Analyzes a user query to determine its intent and suggested memory types.
     * @param query The user's natural language query.
     * @returns An object containing the determined intent and relevant memory types.
     */
    parse(query: string): { intent: string; suggestedTypes: MemoryType[] } {
        const lowerQuery = query.toLowerCase();

        // Check for debug intent (why, error, crash, bug, fix)
        const debugKeywords = ["why", "error", "crash", "bug", "fix"];
        if (debugKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return { intent: 'debug', suggestedTypes: [MemoryType.EPISODIC] };
        }

        // Check for procedure intent (how, steps, implement, create, build)
        const procedureKeywords = ["how", "steps", "implement", "create", "build"];
        if (procedureKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return { intent: 'procedure', suggestedTypes: [MemoryType.PROCEDURAL] };
        }

        // Default general intent
        return { intent: 'general', suggestedTypes: [MemoryType.EPISODIC, MemoryType.SEMANTIC, MemoryType.PROCEDURAL] };
    }
}
