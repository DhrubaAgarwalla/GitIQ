/**
 * Multi-Provider Commit Categorization with Smart Batch Distribution
 * Distributes workload across Groq, Gemini, and Hugging Face for optimal speed
 */

import { z } from 'zod';
import { COMMIT_CATEGORIES, type CategorizedCommit } from '@/types/commit-categories';
import { multiProviderAI, type BatchDistribution } from '@/ai/providers/multi-provider-ai';

// Global flag to disable keyword fallbacks for testing
let DISABLE_KEYWORD_FALLBACK = false;

export function setDisableKeywordFallback(disable: boolean) {
  DISABLE_KEYWORD_FALLBACK = disable;
}

const MultiProviderCategorizeInputSchema = z.object({
  commits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
  })).describe('Array of commits to categorize'),
});

const MultiProviderCategorizeOutputSchema = z.object({
  categorizedCommits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
    categories: z.array(z.string()),
    provider: z.string().optional(),
    processingTime: z.number().optional(),
  })),
  stats: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
    providerBreakdown: z.record(z.number()),
    totalProcessingTime: z.number(),
    averageTimePerCommit: z.number(),
  }),
  progressUpdates: z.array(z.string()),
});

export type MultiProviderCategorizeInput = z.infer<typeof MultiProviderCategorizeInputSchema>;
export type MultiProviderCategorizeOutput = z.infer<typeof MultiProviderCategorizeOutputSchema>;

/**
 * Repair incomplete JSON responses from AI providers
 */
function repairIncompleteJSON(jsonStr: string): string {
  try {
    // Remove any trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // Try to close incomplete arrays/objects
    let openBrackets = 0;
    let openBraces = 0;

    for (const char of jsonStr) {
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
    }

    // Close unclosed brackets/braces
    while (openBraces > 0) {
      jsonStr += '}';
      openBraces--;
    }
    while (openBrackets > 0) {
      jsonStr += ']';
      openBrackets--;
    }

    return jsonStr;
  } catch {
    return jsonStr;
  }
}

/**
 * Process a single batch with a specific provider
 */
async function processBatch(
  distribution: BatchDistribution,
  batchIndex: number,
  totalBatches: number
): Promise<{
  results: CategorizedCommit[];
  provider: string;
  processingTime: number;
  success: boolean;
}> {
  const startTime = Date.now();
  const { provider, commits } = distribution;

  console.log(`Processing batch ${batchIndex + 1}/${totalBatches} with ${provider} (${commits.length} commits)`);

  // Clean commit messages for the prompt
  const cleanCommits = commits.map(commit => ({
    sha: commit.sha,
    message: commit.message.replace(/[\n\r\t]/g, ' ').replace(/"/g, "'").substring(0, 100)
  }));

  const prompt = `Categorize these ${commits.length} commits. Return ONLY a valid JSON array, no other text.

Categories: ${COMMIT_CATEGORIES.join(', ')}

${cleanCommits.map((commit, index) => `${index + 1}. ${commit.sha.substring(0, 8)}: ${commit.message}`).join('\n')}

Return format: [{"sha":"commit_sha","categories":["category1","category2"]}]`;

  try {
    const response = await multiProviderAI.generateResponse(prompt, provider.toLowerCase().replace(' ', ''));

    // Try to extract and repair JSON from response
    let cleanedResponse = response.content.trim();

    // Look for JSON array pattern
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }

    // Try to repair incomplete JSON
    cleanedResponse = repairIncompleteJSON(cleanedResponse);

    // Parse the JSON response
    const batchResults = JSON.parse(cleanedResponse);

    if (Array.isArray(batchResults)) {
      const results: CategorizedCommit[] = [];

      batchResults.forEach((result: any) => {
        if (result.sha && Array.isArray(result.categories)) {
          const validCategories = result.categories.filter((cat: string) =>
            COMMIT_CATEGORIES.includes(cat as any)
          );

          // Find the original commit to get the full message
          const originalCommit = commits.find(c => c.sha === result.sha);
          if (originalCommit) {
            results.push({
              sha: result.sha,
              message: originalCommit.message,
              categories: validCategories.length > 0 ? validCategories : ['other']
            });
          }
        }
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ ${provider} processed ${results.length}/${commits.length} commits in ${(processingTime / 1000).toFixed(1)}s`);

      return {
        results,
        provider: response.provider,
        processingTime,
        success: true
      };
    } else {
      throw new Error('Response is not a valid array');
    }
  } catch (error) {
    console.error(`❌ ${provider} batch failed:`, error);

    if (DISABLE_KEYWORD_FALLBACK) {
      // For AI-only testing, return empty results instead of keyword fallback
      const processingTime = Date.now() - startTime;
      console.log(`🚫 AI-only mode: No fallback for ${commits.length} commits (${(processingTime / 1000).toFixed(1)}s)`);

      return {
        results: [], // Empty results for failed AI processing
        provider: 'failed',
        processingTime,
        success: false
      };
    }

    // Fallback to keyword-based categorization (normal mode)
    const fallbackResults: CategorizedCommit[] = commits.map(commit => {
      const message = commit.message.toLowerCase();
      const categories = [];

      if (message.includes('fix') || message.includes('bug')) categories.push('bugfix');
      else if (message.includes('feat') || message.includes('add')) categories.push('feature');
      else if (message.includes('refactor')) categories.push('refactor');
      else if (message.includes('doc')) categories.push('documentation');
      else if (message.includes('test')) categories.push('test');
      else categories.push('other');

      return {
        sha: commit.sha,
        message: commit.message,
        categories: categories as any
      };
    });

    const processingTime = Date.now() - startTime;
    console.log(`🔄 Fallback categorization for ${commits.length} commits in ${(processingTime / 1000).toFixed(1)}s`);

    return {
      results: fallbackResults,
      provider: 'fallback',
      processingTime,
      success: false
    };
  }
}

/**
 * Main multi-provider categorization function
 */
export async function multiProviderCategorizeCommits(
  input: MultiProviderCategorizeInput
): Promise<MultiProviderCategorizeOutput> {
  const { commits } = input;
  const startTime = Date.now();
  const progressUpdates: string[] = [];
  const stats = {
    total: commits.length,
    successful: 0,
    failed: 0,
    providerBreakdown: {} as Record<string, number>,
    totalProcessingTime: 0,
    averageTimePerCommit: 0,
  };

  const startMessage = `🚀 Starting multi-provider categorization of ${commits.length} commits...`;
  console.log(startMessage);
  progressUpdates.push(startMessage);

  // Get provider status
  const providerStatus = multiProviderAI.getProviderStatus();
  const availableProviders = providerStatus.filter(p => p.isAvailable);

  const statusMessage = `📊 Available providers: ${availableProviders.map(p => p.name).join(', ')}`;
  console.log(statusMessage);
  progressUpdates.push(statusMessage);

  if (availableProviders.length === 0) {
    throw new Error('No AI providers available');
  }

  // Distribute batches across providers
  const distributions = multiProviderAI.distributeBatches(commits);

  const distributionMessage = `📦 Created ${distributions.length} batches across ${new Set(distributions.map(d => d.provider)).size} providers`;
  console.log(distributionMessage);
  progressUpdates.push(distributionMessage);

  // Log batch distribution details
  distributions.forEach((dist, index) => {
    const detailMessage = `   Batch ${index + 1}: ${dist.provider} (${dist.commits.length} commits)`;
    console.log(detailMessage);
    progressUpdates.push(detailMessage);
  });

  // Process batches in parallel (with some concurrency control)
  const CONCURRENT_BATCHES = Math.min(3, distributions.length); // Max 3 concurrent batches
  const categorizedCommits: CategorizedCommit[] = [];

  for (let i = 0; i < distributions.length; i += CONCURRENT_BATCHES) {
    const batchGroup = distributions.slice(i, i + CONCURRENT_BATCHES);

    const groupMessage = `⚡ Processing batch group ${Math.floor(i / CONCURRENT_BATCHES) + 1}/${Math.ceil(distributions.length / CONCURRENT_BATCHES)} (${batchGroup.length} batches in parallel)`;
    console.log(groupMessage);
    progressUpdates.push(groupMessage);

    // Process batches in parallel
    const batchPromises = batchGroup.map((distribution, groupIndex) =>
      processBatch(distribution, i + groupIndex, distributions.length)
    );

    const batchResults = await Promise.allSettled(batchPromises);

    // Collect results
    batchResults.forEach((result, groupIndex) => {
      if (result.status === 'fulfilled') {
        const { results, provider, processingTime, success } = result.value;
        categorizedCommits.push(...results);

        // Update stats
        if (success) {
          stats.successful += results.length;
        } else {
          stats.failed += results.length;
        }

        stats.providerBreakdown[provider] = (stats.providerBreakdown[provider] || 0) + results.length;

        const resultMessage = `✅ Batch ${i + groupIndex + 1} completed: ${results.length} commits via ${provider} (${(processingTime / 1000).toFixed(1)}s)`;
        console.log(resultMessage);
        progressUpdates.push(resultMessage);
      } else {
        const errorMessage = `❌ Batch ${i + groupIndex + 1} failed: ${result.reason}`;
        console.error(errorMessage);
        progressUpdates.push(errorMessage);
        stats.failed += batchGroup[groupIndex].commits.length;
      }
    });

    // Small delay between batch groups to be respectful to APIs
    if (i + CONCURRENT_BATCHES < distributions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Calculate final stats
  const totalTime = Date.now() - startTime;
  stats.totalProcessingTime = totalTime;
  stats.averageTimePerCommit = totalTime / commits.length;

  const finalMessage = `🎉 Multi-provider categorization completed: ${categorizedCommits.length}/${commits.length} commits in ${(totalTime / 1000).toFixed(1)}s (avg ${(stats.averageTimePerCommit / 1000).toFixed(2)}s per commit)`;
  console.log(finalMessage);
  progressUpdates.push(finalMessage);

  // Log provider breakdown
  Object.entries(stats.providerBreakdown).forEach(([provider, count]) => {
    const breakdownMessage = `   ${provider}: ${count} commits`;
    console.log(breakdownMessage);
    progressUpdates.push(breakdownMessage);
  });

  return {
    categorizedCommits,
    stats,
    progressUpdates
  };
}
