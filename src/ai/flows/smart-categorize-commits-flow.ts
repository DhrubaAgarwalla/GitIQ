import { z } from 'zod';
import { COMMIT_CATEGORIES } from '@/types/commit-categories';
import { generateAIResponse } from '@/ai/genkit';

// Helper function to repair incomplete JSON
function repairIncompleteJSON(jsonStr: string): string {
  try {
    // First try to parse as-is
    JSON.parse(jsonStr);
    return jsonStr;
  } catch (error) {
    console.log('Attempting to repair JSON:', error);

    // Try to repair common issues
    let repaired = jsonStr;

    // Remove any text before the first [
    const firstBracket = repaired.indexOf('[');
    if (firstBracket > 0) {
      repaired = repaired.substring(firstBracket);
    }

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

    // Fix control characters and newlines in strings
    repaired = repaired.replace(/[\n\r\t]/g, ' ');
    repaired = repaired.replace(/[\x00-\x1F\x7F]/g, '');

    // Fix incomplete strings (add closing quotes)
    repaired = repaired.replace(/"([^"]*?)$/gm, '"$1"');

    // Try to fix incomplete objects by removing the last incomplete entry
    if (repaired.includes('{"sha":') && !repaired.endsWith(']')) {
      const lastCompleteEntry = repaired.lastIndexOf('},');
      if (lastCompleteEntry !== -1) {
        repaired = repaired.substring(0, lastCompleteEntry + 1) + ']';
      }
    }

    console.log('Repaired JSON:', repaired.substring(0, 200) + '...');
    return repaired;
  }
}

const CategorizedCommitSchema = z.object({
  sha: z.string(),
  message: z.string(),
  categories: z.array(z.enum(COMMIT_CATEGORIES)),
});

const SmartCategorizeCommitsInputSchema = z.object({
  commits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
  })),
});

const SmartCategorizeCommitsOutputSchema = z.object({
  categorizedCommits: z.array(CategorizedCommitSchema),
  stats: z.object({
    total: z.number(),
    keywordBased: z.number(),
    aiBased: z.number(),
    fallback: z.number(),
  }),
  progressUpdates: z.array(z.string()).optional(),
});

export type SmartCategorizeCommitsInput = z.infer<typeof SmartCategorizeCommitsInputSchema>;
export type SmartCategorizeCommitsOutput = z.infer<typeof SmartCategorizeCommitsOutputSchema>;
export type CategorizedCommit = z.infer<typeof CategorizedCommitSchema>;

// Enhanced keyword patterns for better categorization
const KEYWORD_PATTERNS = {
  bugfix: [
    /\b(fix|bug|error|issue|problem|crash|broken|repair|resolve|patch)\b/i,
    /\b(hotfix|quickfix|critical|urgent)\b/i,
  ],
  feature: [
    /\b(feat|feature|add|new|implement|create|introduce)\b/i,
    /\b(enhancement|improvement|extend)\b/i,
  ],
  refactor: [
    /\b(refactor|restructure|reorganize|cleanup|clean|optimize)\b/i,
    /\b(simplify|improve|modernize)\b/i,
  ],
  documentation: [
    /\b(doc|docs|documentation|readme|comment|guide)\b/i,
    /\b(manual|tutorial|example)\b/i,
  ],
  test: [
    /\b(test|spec|testing|unit|integration|e2e)\b/i,
    /\b(coverage|mock|stub)\b/i,
  ],
  styling: [
    /\b(style|css|scss|sass|ui|design|theme)\b/i,
    /\b(layout|visual|appearance|format)\b/i,
  ],
  performance: [
    /\b(perf|performance|speed|fast|slow|optimize|cache)\b/i,
    /\b(memory|cpu|load|latency)\b/i,
  ],
  security: [
    /\b(security|auth|authentication|authorization|permission)\b/i,
    /\b(vulnerability|exploit|secure|encrypt|decrypt)\b/i,
  ],
  build: [
    /\b(build|compile|bundle|webpack|rollup|vite)\b/i,
    /\b(config|configuration|setup|install)\b/i,
  ],
  'ci/cd': [
    /\b(ci|cd|deploy|deployment|pipeline|workflow)\b/i,
    /\b(github|actions|jenkins|travis)\b/i,
  ],
  dependencies: [
    /\b(dep|deps|dependency|dependencies|package|npm|yarn)\b/i,
    /\b(update|upgrade|downgrade|install|remove)\b/i,
  ],
};

function categorizeWithKeywords(message: string): string[] {
  const categories: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(lowerMessage))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories.slice(0, 2) : ['other'];
}

function isAmbiguousCommit(message: string): boolean {
  const categories = categorizeWithKeywords(message);
  return categories.includes('other') || categories.length > 2;
}

export async function smartCategorizeCommits(input: SmartCategorizeCommitsInput): Promise<SmartCategorizeCommitsOutput> {
  const { commits } = input;
  const categorizedCommits: CategorizedCommit[] = [];
  const progressUpdates: string[] = [];
  const stats = {
    total: commits.length,
    keywordBased: 0,
    aiBased: 0,
    fallback: 0,
  };

  const startMessage = `Starting smart categorization of ${commits.length} commits...`;
  console.log(startMessage);
  progressUpdates.push(startMessage);

  // Step 1: Categorize with keywords
  const ambiguousCommits: typeof commits = [];

  for (const commit of commits) {
    const keywordCategories = categorizeWithKeywords(commit.message);

    if (!isAmbiguousCommit(commit.message)) {
      // Clear categorization with keywords
      categorizedCommits.push({
        sha: commit.sha,
        message: commit.message,
        categories: keywordCategories as any,
      });
      stats.keywordBased++;
    } else {
      // Ambiguous - needs AI
      ambiguousCommits.push(commit);
    }
  }

  const keywordMessage = `Keyword-based: ${stats.keywordBased}/${commits.length}, AI needed: ${ambiguousCommits.length}`;
  console.log(keywordMessage);
  progressUpdates.push(keywordMessage);

  // Step 2: Use AI for ambiguous commits in small batches
  const batchTimes: number[] = [];
  if (ambiguousCommits.length > 0) {
    const AI_BATCH_SIZE = 5; // Increased batch size for faster processing
    const totalBatches = Math.ceil(ambiguousCommits.length / AI_BATCH_SIZE);

    // Provide initial time estimate (optimized: ~3 seconds per batch including reduced delays)
    const estimatedTimePerBatch = 3; // seconds
    const totalEstimatedTime = totalBatches * estimatedTimePerBatch;

    let estimateMessage = '';
    if (totalEstimatedTime > 60) {
      const minutes = Math.floor(totalEstimatedTime / 60);
      const seconds = Math.floor(totalEstimatedTime % 60);
      estimateMessage = `Estimated total time for AI processing: ${minutes}m ${seconds}s (${totalBatches} batches)`;
    } else {
      estimateMessage = `Estimated total time for AI processing: ${totalEstimatedTime}s (${totalBatches} batches)`;
    }
    console.log(estimateMessage);
    progressUpdates.push(estimateMessage);

    for (let i = 0; i < ambiguousCommits.length; i += AI_BATCH_SIZE) {
      const batch = ambiguousCommits.slice(i, i + AI_BATCH_SIZE);
      const currentBatch = Math.floor(i / AI_BATCH_SIZE) + 1;

      // Calculate time estimation
      let timeEstimate = '';
      if (batchTimes.length > 0) {
        const avgTimePerBatch = batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
        const remainingBatches = totalBatches - currentBatch;
        const estimatedRemainingTime = (remainingBatches * avgTimePerBatch) / 1000; // Convert to seconds

        if (estimatedRemainingTime > 60) {
          const minutes = Math.floor(estimatedRemainingTime / 60);
          const seconds = Math.floor(estimatedRemainingTime % 60);
          timeEstimate = ` (Est. ${minutes}m ${seconds}s remaining)`;
        } else {
          timeEstimate = ` (Est. ${Math.floor(estimatedRemainingTime)}s remaining)`;
        }
      }

      const batchMessage = `AI processing batch ${currentBatch}/${totalBatches}${timeEstimate}`;
      console.log(batchMessage);
      progressUpdates.push(batchMessage);
      const batchStartTime = Date.now();

      let response = '';
      try {
        // Clean commit messages for the prompt
        const cleanCommits = batch.map(c => ({
          sha: c.sha,
          message: c.message.replace(/[\n\r\t]/g, ' ').replace(/"/g, "'").substring(0, 80)
        }));

        const prompt = `Categorize these ${batch.length} commits. Return ONLY a JSON array.

Categories: ${COMMIT_CATEGORIES.join(', ')}

${cleanCommits.map((c, idx) => `${idx + 1}. ${c.sha.substring(0, 8)}: ${c.message}`).join('\n')}

Return: [{"sha":"full_sha","message":"full_message","categories":["cat1","cat2"]}]`;

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

        const results = JSON.parse(cleanedResponse);

        if (Array.isArray(results)) {
          results.forEach((result: any) => {
            if (result.sha && result.categories) {
              // Find the original commit to get the full message
              const originalCommit = batch.find(c => c.sha === result.sha);
              categorizedCommits.push({
                sha: result.sha,
                message: originalCommit ? originalCommit.message : result.message,
                categories: result.categories.filter((cat: string) =>
                  COMMIT_CATEGORIES.includes(cat as any)
                ),
              });
              stats.aiBased++;
            }
          });
        }
      } catch (error) {
        console.error('AI categorization failed for batch, using fallback:', error);
        if (response) {
          console.error('Failed response preview:', response.substring(0, 500));
        }

        // Fallback for failed AI batch
        batch.forEach(commit => {
          const fallbackCategories = categorizeWithKeywords(commit.message);
          categorizedCommits.push({
            sha: commit.sha,
            message: commit.message,
            categories: fallbackCategories as any,
          });
          stats.fallback++;
        });
      }

      // Record batch processing time
      const batchEndTime = Date.now();
      const batchDuration = batchEndTime - batchStartTime;
      batchTimes.push(batchDuration);

      const completionMessage = `Batch ${currentBatch} completed in ${(batchDuration / 1000).toFixed(1)}s`;
      console.log(completionMessage);
      progressUpdates.push(completionMessage);

      // Reduced delay between AI batches for faster processing
      if (i + AI_BATCH_SIZE < ambiguousCommits.length) {
        console.log('Waiting 1s before next AI batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Step 3: Ensure all commits are processed
  const processedShas = new Set(categorizedCommits.map(c => c.sha));
  commits.forEach(commit => {
    if (!processedShas.has(commit.sha)) {
      const fallbackCategories = categorizeWithKeywords(commit.message);
      categorizedCommits.push({
        sha: commit.sha,
        message: commit.message,
        categories: fallbackCategories as any,
      });
      stats.fallback++;
    }
  });

  // Calculate and log final timing statistics
  if (batchTimes.length > 0) {
    const totalProcessingTime = batchTimes.reduce((a, b) => a + b, 0) / 1000; // Convert to seconds
    const avgTimePerBatch = totalProcessingTime / batchTimes.length;
    const timingMessage = `AI processing completed in ${totalProcessingTime.toFixed(1)}s (avg ${avgTimePerBatch.toFixed(1)}s per batch)`;
    console.log(timingMessage);
    progressUpdates.push(timingMessage);
  }

  const finalMessage = `Smart categorization complete: ${stats.aiBased} AI-based, ${stats.keywordBased} keyword-based, ${stats.fallback} fallback`;
  console.log(finalMessage, stats);
  progressUpdates.push(finalMessage);

  return { categorizedCommits, stats, progressUpdates };
}
