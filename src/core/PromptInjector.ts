import { SearchResult } from '../core/types/MemoryTypes';

export class PromptInjector {
  inject(results: SearchResult[], userPrompt: string, maxTokens: number): string {
    if (results.length === 0) {
      return userPrompt;
    }

    // Build memoryText by joining up to 5 result entries
    const limitedResults = results.slice(0, 5);
    const memoryEntries = limitedResults.map(result => {
      return `- ${result.entry.summary}`;
    });
    
    let memoryText = memoryEntries.join('\n');

    // Check token limit and slice if necessary
    const maxChars = maxTokens * 4;
    if (memoryText.length / 4 > maxTokens) {
      memoryText = memoryText.substring(0, maxChars);
    }

    // Return the formatted string
    return `[MEMORY CONTEXT]\n${memoryText}\n\n[USER PROMPT]\n${userPrompt}`;
  }
}
