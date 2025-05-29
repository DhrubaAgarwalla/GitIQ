/**
 * @fileOverview An AI flow to categorize multiple commit messages in bulk.
 *
 * - categorizeCommitsBulk - A function that takes multiple commits and returns categorized results.
 * - CategorizeCommitsBulkInput - The input type for the categorizeCommitsBulk function.
 * - CategorizeCommitsBulkOutput - The return type for the categorizeCommitsBulk function.
 */

import { generateAIResponse } from '@/ai/genkit';
import { z } from 'zod';
import { COMMIT_CATEGORIES, type CategorizedCommit } from '@/types/commit-categories';

// Helper function to repair incomplete JSON
function repairIncompleteJSON(jsonStr: string): string {
  try {
    // First try to parse as-is
    JSON.parse(jsonStr);
    return jsonStr;
  } catch (error) {
    // Try to repair common issues
    let repaired = jsonStr;

    // If it doesn't end with ], try to close the array
    if (!repaired.trim().endsWith(']')) {
      // Find the last complete object
      const lastCompleteObject = repaired.lastIndexOf('}');
      if (lastCompleteObject !== -1) {
        repaired = repaired.substring(0, lastCompleteObject + 1) + ']';
      }
    }

    // Try to fix trailing commas
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // Try to fix missing quotes around property names
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    return repaired;
  }
}

const CategorizeCommitsBulkInputSchema = z.object({
  commits: z.array(z.object({
    sha: z.string().describe('The commit SHA hash.'),
    message: z.string().describe('The commit message to be categorized.')
  })).describe('An array of commits to be categorized.'),
});
export type CategorizeCommitsBulkInput = z.infer<typeof CategorizeCommitsBulkInputSchema>;

const CategorizeCommitsBulkOutputSchema = z.object({
  categorizedCommits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
    categories: z.array(z.string())
  })).describe('An array of commits with their assigned categories.'),
});
export type CategorizeCommitsBulkOutput = z.infer<typeof CategorizeCommitsBulkOutputSchema>;

const BATCH_SIZE = 5; // Smaller batches to reduce token usage and respect rate limits
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay to respect rate limits

export async function categorizeCommitsBulk(input: CategorizeCommitsBulkInput): Promise<CategorizeCommitsBulkOutput> {
  const { commits } = input;
  const categorizedCommits: CategorizedCommit[] = [];
  const processedShas = new Set<string>();

  console.log(`Starting bulk categorization of ${commits.length} commits...`);

  // Process commits in batches
  for (let i = 0; i < commits.length; i += BATCH_SIZE) {
    const batch = commits.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(commits.length / BATCH_SIZE)} (${batch.length} commits)`);

    const prompt = `You must categorize these commits and return ONLY a valid JSON array. Do not include any explanatory text, comments, or formatting. Return ONLY the JSON array.

Available categories: ${COMMIT_CATEGORIES.join(', ')}

Commits to categorize:
${batch.map((commit, index) => `${index + 1}. SHA: ${commit.sha}, Message: ${commit.message.substring(0, 100)}`).join('\n')}

Return format (ONLY this, no other text):
[{"sha":"full_sha_here","message":"full_message_here","categories":["category1","category2"]}]`;

    let batchProcessed = false;
    let response = '';

    try {
      response = await generateAIResponse(prompt);
      console.log(`Raw AI response for batch: ${response.substring(0, 200)}...`);

      // Try to extract and repair JSON from response
      let cleanedResponse = response.trim();

      // Look for JSON array pattern
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      // Try to repair incomplete JSON
      cleanedResponse = repairIncompleteJSON(cleanedResponse);

      // Try to parse the JSON response
      const batchResults = JSON.parse(cleanedResponse);

      if (Array.isArray(batchResults)) {
        batchResults.forEach((result: any) => {
          if (result.sha && result.message && Array.isArray(result.categories)) {
            const validCategories = result.categories.filter((cat: string) =>
              COMMIT_CATEGORIES.includes(cat as any)
            );

            categorizedCommits.push({
              sha: result.sha,
              message: result.message,
              categories: validCategories.length > 0 ? validCategories : ['other']
            });
            processedShas.add(result.sha);
          }
        });
        batchProcessed = true;
        console.log(`AI successfully processed ${batchResults.length} commits in this batch`);
      }
    } catch (error) {
      console.error('Error parsing batch categorization:', error);
      console.error('Failed response preview:', response.substring(0, 300));
      console.log('Falling back to keyword-based categorization for this batch');
    }

    // If AI processing failed, use fallback categorization for ALL commits in this batch
    if (!batchProcessed) {
      batch.forEach(commit => {
        if (!processedShas.has(commit.sha)) {
          const message = commit.message.toLowerCase();
          const categories = [];

          if (message.includes('fix') || message.includes('bug')) categories.push('bugfix');
          else if (message.includes('feat') || message.includes('add')) categories.push('feature');
          else if (message.includes('refactor')) categories.push('refactor');
          else if (message.includes('doc')) categories.push('documentation');
          else if (message.includes('test')) categories.push('test');
          else if (message.includes('style') || message.includes('css')) categories.push('styling');
          else if (message.includes('perf') || message.includes('performance')) categories.push('performance');
          else if (message.includes('security') || message.includes('auth')) categories.push('security');
          else if (message.includes('build') || message.includes('webpack')) categories.push('build');
          else if (message.includes('ci') || message.includes('deploy')) categories.push('ci/cd');
          else if (message.includes('dep') || message.includes('package')) categories.push('dependencies');
          else categories.push('other');

          categorizedCommits.push({
            sha: commit.sha,
            message: commit.message,
            categories: categories as any
          });
          processedShas.add(commit.sha);
        }
      });
    }

    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < commits.length) {
      console.log(`Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Ensure ALL commits are processed - fallback for any missed commits
  commits.forEach(commit => {
    if (!processedShas.has(commit.sha)) {
      console.log(`Processing missed commit: ${commit.sha.substring(0, 7)}`);
      const message = commit.message.toLowerCase();
      const categories = [];

      if (message.includes('fix') || message.includes('bug')) categories.push('bugfix');
      else if (message.includes('feat') || message.includes('add')) categories.push('feature');
      else if (message.includes('refactor')) categories.push('refactor');
      else if (message.includes('doc')) categories.push('documentation');
      else if (message.includes('test')) categories.push('test');
      else categories.push('other');

      categorizedCommits.push({
        sha: commit.sha,
        message: commit.message,
        categories: categories as any
      });
    }
  });

  console.log(`Bulk categorization complete: ${categorizedCommits.length}/${commits.length} commits processed`);
  return { categorizedCommits };
}
