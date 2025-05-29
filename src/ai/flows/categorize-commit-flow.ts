
/**
 * @fileOverview An AI flow to categorize a given commit message.
 *
 * - categorizeCommitFlow - A function that takes a commit message and returns suggested categories.
 * - CategorizeCommitInput - The input type for the categorizeCommitFlow function.
 * - CategorizeCommitOutput - The return type for the categorizeCommitFlow function.
 */

import { generateAIResponse } from '@/ai/genkit';
import { z } from 'zod';

const CategorizeCommitInputSchema = z.object({
  commitMessage: z.string().describe('The commit message to be categorized.'),
});
export type CategorizeCommitInput = z.infer<typeof CategorizeCommitInputSchema>;

const CategorizeCommitOutputSchema = z.object({
  categories: z.array(z.string()).describe('A list of suggested categories for the commit, typically 1-3.'),
});
export type CategorizeCommitOutput = z.infer<typeof CategorizeCommitOutputSchema>;

export async function categorizeCommit(input: CategorizeCommitInput): Promise<CategorizeCommitOutput> {
  const prompt = `You must categorize this commit and return ONLY a valid JSON array. Do not include any explanatory text, comments, or formatting. Return ONLY the JSON array.

Available categories: bugfix, feature, refactor, documentation, test, chore, styling, performance, security, backend, frontend, database, API, UI, UX, build, ci/cd, dependencies, other

Commit message: "${input.commitMessage}"

Return format (ONLY this, no other text):
["category1", "category2"]`;

  let response = '';
  try {
    response = await generateAIResponse(prompt);
    console.log(`Raw AI response for single commit: ${response.substring(0, 200)}...`);

    // Try to extract JSON from response if it contains extra text
    let cleanedResponse = response.trim();

    // Look for JSON array pattern
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Try to parse the JSON response
    const categories = JSON.parse(cleanedResponse);
    if (Array.isArray(categories)) {
      return { categories };
    } else {
      // Fallback if response is not an array
      return { categories: ["other"] };
    }
  } catch (error) {
    console.error('Error parsing categories:', error);
    console.error('Failed response preview:', response.substring(0, 300));
    // Fallback to basic categorization
    const message = input.commitMessage.toLowerCase();
    const categories = [];

    if (message.includes('fix') || message.includes('bug')) categories.push('bugfix');
    else if (message.includes('feat') || message.includes('add')) categories.push('feature');
    else if (message.includes('refactor')) categories.push('refactor');
    else if (message.includes('doc')) categories.push('documentation');
    else if (message.includes('test')) categories.push('test');
    else categories.push('other');

    return { categories };
  }
}
