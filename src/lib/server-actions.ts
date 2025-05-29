'use server';

import { summarizeFrequentChanges } from '@/ai/flows/summarize-frequent-changes';
import { summarizeReadme } from '@/ai/flows/summarize-readme-flow';
import { explainCommitMessage } from '@/ai/flows/explain-commit-message-flow';
import { categorizeCommit } from '@/ai/flows/categorize-commit-flow';
import { categorizeCommitsBulk } from '@/ai/flows/categorize-commits-bulk-flow';
import { smartCategorizeCommits } from '@/ai/flows/smart-categorize-commits-flow';

export async function summarizeCommitsAction(commitMessages: string[]) {
  try {
    const result = await summarizeFrequentChanges({ commitMessages });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error summarizing commits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize commits'
    };
  }
}

export async function summarizeReadmeAction(readmeContent: string) {
  try {
    const result = await summarizeReadme({ readmeContent });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error summarizing README:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to summarize README'
    };
  }
}

export async function explainCommitAction(commitMessage: string) {
  try {
    const result = await explainCommitMessage({ commitMessage });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error explaining commit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to explain commit'
    };
  }
}

export async function categorizeCommitAction(commitMessage: string) {
  try {
    const result = await categorizeCommit({ commitMessage });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to categorize commit'
    };
  }
}

export async function categorizeAllCommitsAction(commits: Array<{ sha: string; message: string }>) {
  try {
    // Use smart categorization for better efficiency and rate limit management
    const result = await smartCategorizeCommits({ commits });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commits in bulk:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to categorize commits'
    };
  }
}

// Fallback action using the original bulk method (for testing)
export async function categorizeAllCommitsBulkAction(commits: Array<{ sha: string; message: string }>) {
  try {
    const result = await categorizeCommitsBulk({ commits });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commits with bulk method:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to categorize commits'
    };
  }
}
