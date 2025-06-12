'use server';

// Ensure environment variables are loaded (especially important for server actions)
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { summarizeFrequentChanges } from '@/ai/flows/summarize-frequent-changes';
import { summarizeReadme } from '@/ai/flows/summarize-readme-flow';
import { explainCommitMessage } from '@/ai/flows/explain-commit-message-flow';
import { categorizeCommit } from '@/ai/flows/categorize-commit-flow';
import { categorizeCommitsBulk } from '@/ai/flows/categorize-commits-bulk-flow';
import { smartCategorizeCommits } from '@/ai/flows/smart-categorize-commits-flow';
import { multiProviderCategorizeCommits } from '@/ai/flows/multi-provider-categorize-flow';
import { enhancedMultiProviderCategorizeCommits } from '@/ai/flows/enhanced-multi-provider-categorize-flow';

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
    // Use enhanced multi-provider categorization with 50/50 Groq/Gemini split, smart failover, and robust error handling
    console.log(`🚀 Starting enhanced categorization for ${commits.length} commits...`);
    const result = await enhancedMultiProviderCategorizeCommits({ commits });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commits with enhanced multi-provider:', error);

    // Fallback to original multi-provider
    try {
      console.log('🔄 Falling back to original multi-provider categorization...');
      const fallbackResult = await multiProviderCategorizeCommits({ commits });
      return { success: true, data: fallbackResult };
    } catch (fallbackError) {
      console.error('Error with multi-provider fallback:', fallbackError);

      // Final fallback to smart categorization
      try {
        console.log('🔄 Final fallback to smart categorization...');
        const finalFallbackResult = await smartCategorizeCommits({ commits });
        return { success: true, data: finalFallbackResult };
      } catch (finalError) {
        console.error('Error with final fallback categorization:', finalError);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to categorize commits'
        };
      }
    }
  }
}

// Enhanced multi-provider action (fastest option with 50/50 split, smart failover, and parallel processing)
export async function categorizeAllCommitsEnhancedAction(commits: Array<{ sha: string; message: string }>) {
  try {
    console.log(`🚀 Enhanced categorization starting for ${commits.length} commits...`);
    const result = await enhancedMultiProviderCategorizeCommits({ commits });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commits with enhanced multi-provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to categorize commits'
    };
  }
}

// Multi-provider action (original implementation)
export async function categorizeAllCommitsMultiProviderAction(commits: Array<{ sha: string; message: string }>) {
  try {
    const result = await multiProviderCategorizeCommits({ commits });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commits with multi-provider:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to categorize commits'
    };
  }
}

// Smart categorization action (balanced approach)
export async function categorizeAllCommitsSmartAction(commits: Array<{ sha: string; message: string }>) {
  try {
    const result = await smartCategorizeCommits({ commits });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error categorizing commits with smart method:', error);
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
