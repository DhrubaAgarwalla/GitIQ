
/**
 * @fileOverview An AI flow to summarize the content of a README file.
 *
 * - summarizeReadme - A function that takes README content and returns an AI-generated summary.
 * - SummarizeReadmeInput - The input type for the summarizeReadme function.
 * - SummarizeReadmeOutput - The return type for the summarizeReadme function.
 */

import { generateAIResponse } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeReadmeInputSchema = z.object({
  readmeContent: z.string().describe('The text content of the README file.'),
});
export type SummarizeReadmeInput = z.infer<typeof SummarizeReadmeInputSchema>;

const SummarizeReadmeOutputSchema = z.object({
  summary: z.string().describe('A concise AI-generated summary of the README content, highlighting the project\'s main purpose and key features in 2-4 sentences.'),
});
export type SummarizeReadmeOutput = z.infer<typeof SummarizeReadmeOutputSchema>;

export async function summarizeReadme(input: SummarizeReadmeInput): Promise<SummarizeReadmeOutput> {
  if (!input.readmeContent.trim()) {
    return { summary: "The README content provided was empty or too short to summarize." };
  }

  const prompt = `You are an expert technical writer. Your task is to summarize the provided README content.
Focus on the project's main purpose, key features, and intended audience if mentioned.
The summary should be concise, informative, and ideally 2-4 sentences long.

README Content:
${input.readmeContent}

Please provide only the summary text, no additional formatting or explanations.`;

  const summary = await generateAIResponse(prompt);
  return { summary };
}
