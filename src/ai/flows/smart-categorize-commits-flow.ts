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
  const stats = {
    total: commits.length,
    keywordBased: 0,
    aiBased: 0,
    fallback: 0,
  };

  console.log(`Starting smart categorization of ${commits.length} commits...`);

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

  console.log(`Keyword-based: ${stats.keywordBased}/${commits.length}, AI needed: ${ambiguousCommits.length}`);

  // Step 2: Use AI for ambiguous commits in small batches
  if (ambiguousCommits.length > 0) {
    const AI_BATCH_SIZE = 2; // Even smaller batches to avoid truncation

    for (let i = 0; i < ambiguousCommits.length; i += AI_BATCH_SIZE) {
      const batch = ambiguousCommits.slice(i, i + AI_BATCH_SIZE);
      console.log(`AI processing batch ${Math.floor(i / AI_BATCH_SIZE) + 1}/${Math.ceil(ambiguousCommits.length / AI_BATCH_SIZE)}`);

      try {
        const prompt = `You must categorize these commits and return ONLY a valid JSON array. Do not include any explanatory text, comments, or formatting. Return ONLY the JSON array.

Available categories: ${COMMIT_CATEGORIES.join(', ')}

Commits to categorize:
${batch.map((c, idx) => `${idx + 1}. SHA: ${c.sha}, Message: ${c.message.substring(0, 100)}`).join('\n')}

Return format (ONLY this, no other text):
[{"sha":"full_sha_here","message":"full_message_here","categories":["category1","category2"]}]`;

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

          const results = JSON.parse(cleanedResponse);

          if (Array.isArray(results)) {
            results.forEach((result: any) => {
              if (result.sha && result.categories) {
                categorizedCommits.push({
                  sha: result.sha,
                  message: result.message,
                  categories: result.categories.filter((cat: string) =>
                    COMMIT_CATEGORIES.includes(cat as any)
                  ),
                });
                stats.aiBased++;
              }
            });
          }
        } catch (parseError) {
          throw parseError; // Re-throw to be caught by outer catch
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

      // Delay between AI batches
      if (i + AI_BATCH_SIZE < ambiguousCommits.length) {
        console.log('Waiting 4s before next AI batch...');
        await new Promise(resolve => setTimeout(resolve, 4000));
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

  console.log(`Smart categorization complete:`, stats);
  return { categorizedCommits, stats };
}
