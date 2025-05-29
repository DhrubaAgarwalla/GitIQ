
/**
 * @fileOverview An AI flow to explain or elaborate on a given commit message.
 *
 * - explainCommitMessage - A function that takes a commit message and returns an AI-generated explanation.
 * - ExplainCommitMessageInput - The input type for the explainCommitMessage function.
 * - ExplainCommitMessageOutput - The return type for the explainCommitMessage function.
 */

import { generateAIResponse } from '@/ai/genkit';
import { z } from 'zod';

const ExplainCommitMessageInputSchema = z.object({
  commitMessage: z.string().describe('The commit message to be explained.'),
});
export type ExplainCommitMessageInput = z.infer<typeof ExplainCommitMessageInputSchema>;

const ExplainCommitMessageOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation of the commit message.'),
});
export type ExplainCommitMessageOutput = z.infer<typeof ExplainCommitMessageOutputSchema>;

export async function explainCommitMessage(input: ExplainCommitMessageInput): Promise<ExplainCommitMessageOutput> {
  const prompt = `You are an expert software development assistant.
Given the following commit message, provide a brief explanation or elaborate on what this change likely involved.
If the message is already very clear and detailed, you can state that it's self-explanatory.

Commit message:
"${input.commitMessage}"

Please provide only the explanation text, no additional formatting or labels.`;

  const explanation = await generateAIResponse(prompt);
  return { explanation };
}
