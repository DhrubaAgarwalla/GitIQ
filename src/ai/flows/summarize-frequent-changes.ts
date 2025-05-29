
/**
 * @fileOverview Summarizes frequent code changes in a Git repository's commit history.
 *
 * - summarizeFrequentChanges - A function that takes commit messages and returns a summary of frequent changes.
 * - SummarizeFrequentChangesInput - The input type for the summarizeFrequentChanges function.
 * - SummarizeFrequentChangesOutput - The return type for the summarizeFrequentChanges function.
 */

import { generateAIResponse } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeFrequentChangesInputSchema = z.object({
  commitMessages: z.array(z.string()).describe('An array of commit messages from a Git repository.'),
});
export type SummarizeFrequentChangesInput = z.infer<typeof SummarizeFrequentChangesInputSchema>;

const SummarizeFrequentChangesOutputSchema = z.object({
  summary: z.string().describe('A summary of the frequent code changes.'),
});
export type SummarizeFrequentChangesOutput = z.infer<typeof SummarizeFrequentChangesOutputSchema>;

export async function summarizeFrequentChanges(input: SummarizeFrequentChangesInput): Promise<SummarizeFrequentChangesOutput> {
  const commitList = input.commitMessages.map(msg => `- ${msg}`).join('\n');

  const prompt = `You are an AI assistant that summarizes frequent code changes based on commit messages.

Analyze the following commit messages and provide a concise summary of the main areas of focus in the repository's development.
Identify recurring themes, types of changes (e.g., bug fixes, feature additions, refactoring, documentation updates), or specific modules/components that are frequently mentioned.
The summary should be 2-4 sentences long.

Commit Messages:
${commitList}

Please provide only the summary text, no additional formatting or explanations.`;

  const summary = await generateAIResponse(prompt);
  return { summary };
}
