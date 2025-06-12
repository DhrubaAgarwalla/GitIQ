/**
 * Enhanced Multi-Provider Commit Categorization
 * - 50% Groq, 30% Gemini, 20% Hugging Face parallel processing
 * - Keyword fallback only after ALL AI providers fail
 * - True parallel processing for maximum speed
 */

import { z } from 'zod';
import { COMMIT_CATEGORIES, type CategorizedCommit } from '@/types/commit-categories';
import { multiProviderAI, type BatchDistribution } from '@/ai/providers/multi-provider-ai';

const EnhancedMultiProviderCategorizeInputSchema = z.object({
  commits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
  })).describe('Array of commits to categorize'),
});

const EnhancedMultiProviderCategorizeOutputSchema = z.object({
  categorizedCommits: z.array(z.object({
    sha: z.string(),
    message: z.string(),
    categories: z.array(z.string()),
    provider: z.string().optional(),
    processingTime: z.number().optional(),
  })),
  stats: z.object({
    total: z.number(),
    aiSuccessful: z.number(),
    keywordFallback: z.number(),
    failed: z.number(),
    providerBreakdown: z.record(z.number()),
    totalProcessingTime: z.number(),
    averageTimePerCommit: z.number(),
    parallelBatches: z.number(),
  }),
  progressUpdates: z.array(z.string()),
});

export type EnhancedMultiProviderCategorizeInput = z.infer<typeof EnhancedMultiProviderCategorizeInputSchema>;
export type EnhancedMultiProviderCategorizeOutput = z.infer<typeof EnhancedMultiProviderCategorizeOutputSchema>;

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
 * Keyword-based fallback categorization
 */
function categorizeWithKeywords(message: string): string[] {
  const categories = [];
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('fix') || lowerMessage.includes('bug') || lowerMessage.includes('resolve')) {
    categories.push('bugfix');
  }
  if (lowerMessage.includes('feat') || lowerMessage.includes('add') || lowerMessage.includes('implement')) {
    categories.push('feature');
  }
  if (lowerMessage.includes('refactor') || lowerMessage.includes('restructure')) {
    categories.push('refactor');
  }
  if (lowerMessage.includes('doc') || lowerMessage.includes('readme') || lowerMessage.includes('comment')) {
    categories.push('documentation');
  }
  if (lowerMessage.includes('test') || lowerMessage.includes('spec') || lowerMessage.includes('coverage')) {
    categories.push('test');
  }
  if (lowerMessage.includes('perf') || lowerMessage.includes('optimize') || lowerMessage.includes('speed')) {
    categories.push('performance');
  }
  if (lowerMessage.includes('security') || lowerMessage.includes('auth') || lowerMessage.includes('vulnerability')) {
    categories.push('security');
  }
  if (lowerMessage.includes('build') || lowerMessage.includes('webpack') || lowerMessage.includes('config')) {
    categories.push('build');
  }
  if (lowerMessage.includes('ci') || lowerMessage.includes('deploy') || lowerMessage.includes('pipeline')) {
    categories.push('ci/cd');
  }
  if (lowerMessage.includes('dep') || lowerMessage.includes('package') || lowerMessage.includes('npm') || lowerMessage.includes('yarn')) {
    categories.push('dependencies');
  }
  if (lowerMessage.includes('style') || lowerMessage.includes('css') || lowerMessage.includes('ui')) {
    categories.push('styling');
  }

  return categories.length > 0 ? categories.slice(0, 2) : ['other'];
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

  console.log(`🚀 Processing batch ${batchIndex + 1}/${totalBatches} with ${provider} (${commits.length} commits)`);

  // Clean commit messages for the prompt
  const cleanCommits = commits.map(commit => ({
    sha: commit.sha,
    message: commit.message.replace(/[\n\r\t]/g, ' ').replace(/"/g, "'").substring(0, 100)
  }));

  // Create enhanced prompt with examples and guidance
  const prompt = `You are an expert Git commit analyzer. Categorize these ${commits.length} commits accurately based on their content and intent.

🎯 CATEGORIZATION RULES:
- Choose 1-2 most relevant categories (avoid over-categorization)
- Be specific and precise - don't default to "backend" or "other"
- Consider the actual change, not just keywords
- Pay attention to conventional commit prefixes: fix:, feat:, perf:, docs:, test:, style:, refactor:, build:, ci:, chore:, security:

📚 CATEGORY DEFINITIONS & EXAMPLES:

🐛 bugfix: Fixes bugs, errors, issues
   Examples: "fix memory leak", "resolve crash", "correct calculation"

✨ feature: New functionality, capabilities
   Examples: "add user login", "implement search", "create dashboard"

♻️ refactor: Code restructuring without changing functionality
   Examples: "extract service", "simplify logic", "clean up code"

📚 documentation: Docs, comments, README updates
   Examples: "add API docs", "update README", "document process"

🧪 test: Testing code, test improvements
   Examples: "add unit tests", "fix flaky test", "increase coverage"

🔧 chore: Maintenance, cleanup, routine tasks
   Examples: "update gitignore", "clean dependencies", "format code"

💄 styling: CSS, UI styling, visual changes
   Examples: "fix button style", "update colors", "responsive design"

⚡ performance: Speed, optimization improvements (look for "perf:" prefix)
   Examples: "perf: optimize queries", "perf: reduce bundle size", "perf: cache data", "optimize database", "improve speed"

🔒 security: Security fixes, authentication, authorization (look for "security:" prefix)
   Examples: "security: fix vulnerability", "security: add encryption", "security: implement auth", "add authentication", "fix security issue"

⚙️ backend: Server-side logic, APIs, databases
   Examples: "create API endpoint", "database migration", "server config"

🎨 frontend: Client-side UI, user interface
   Examples: "update component", "add modal", "fix layout"

🗄️ database: Database changes, migrations, schema
   Examples: "add table", "migrate schema", "optimize index"

🔌 API: API changes, endpoints, integrations
   Examples: "create REST endpoint", "update GraphQL", "API versioning"

🖼️ UI: User interface components, elements
   Examples: "add button", "create form", "update navigation"

👤 UX: User experience, usability improvements
   Examples: "improve workflow", "simplify process", "enhance accessibility"

🏗️ build: Build system, compilation, packaging
   Examples: "update webpack", "fix build script", "optimize bundling"

🚀 ci/cd: Continuous integration, deployment, pipelines
   Examples: "add GitHub Actions", "fix pipeline", "deploy script"

📦 dependencies: Package updates, library changes
   Examples: "upgrade React", "add library", "remove unused deps"

❓ other: Miscellaneous changes that don't fit other categories

COMMITS TO CATEGORIZE:
${cleanCommits.map((commit, index) => `${index + 1}. ${commit.sha.substring(0, 8)}: ${commit.message}`).join('\n')}

Return ONLY valid JSON array with this exact format (use the 8-character SHA shown above):
[{"sha":"${cleanCommits[0]?.sha.substring(0, 8)}","categories":["category1"]}]

For multiple categories (max 2), use:
[{"sha":"${cleanCommits[0]?.sha.substring(0, 8)}","categories":["category1","category2"]}]

IMPORTANT: Use the exact 8-character SHA from the list above, not the full SHA.`;

  try {
    const response = await multiProviderAI.generateResponse(prompt, provider);

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
          // Clean and normalize categories (remove emojis, normalize names)
          const cleanedCategories = result.categories.map((cat: string) => {
            // Remove emojis and extra spaces
            let cleaned = cat.replace(/[^\w\s-]/g, '').trim().toLowerCase();

            // Map common variations to standard categories (use actual COMMIT_CATEGORIES values)
            const categoryMappings: Record<string, string> = {
              'feat': 'feature',
              'features': 'feature',
              'bug': 'bugfix',
              'fix': 'bugfix',
              'fixes': 'bugfix',
              'style': 'styling',
              'styles': 'styling',
              'perf': 'performance',
              'optimize': 'performance',
              'optimization': 'performance',
              'doc': 'documentation',
              'docs': 'documentation',
              'testing': 'test',
              'tests': 'test',
              'security': 'security',
              'backend': 'backend',
              'frontend': 'frontend',
              'ui': 'UI',
              'ux': 'UX',
              'api': 'API',
              'database': 'database',
              'build': 'build',
              'ci': 'ci/cd',
              'cd': 'ci/cd',
              'cicd': 'ci/cd',
              'dependencies': 'dependencies',
              'deps': 'dependencies',
              'chore': 'chore',
              'refactor': 'refactor',
              'other': 'other'
            };

            return categoryMappings[cleaned] || cleaned;
          });

          const validCategories = cleanedCategories.filter((cat: string) =>
            COMMIT_CATEGORIES.includes(cat as any)
          );

          // Find the original commit by matching SHA (handle both short and full SHAs)
          const originalCommit = commits.find(c =>
            c.sha === result.sha ||
            c.sha.startsWith(result.sha) ||
            result.sha.startsWith(c.sha)
          );

          if (originalCommit) {
            results.push({
              sha: originalCommit.sha, // Use the original full SHA
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
    console.error(`❌ ${provider} batch failed:`, error instanceof Error ? error.message : String(error));

    const processingTime = Date.now() - startTime;

    return {
      results: [], // Return empty results - will be handled by keyword fallback later
      provider: 'failed',
      processingTime,
      success: false
    };
  }
}

/**
 * Main enhanced multi-provider categorization function
 */
export async function enhancedMultiProviderCategorizeCommits(
  input: EnhancedMultiProviderCategorizeInput
): Promise<EnhancedMultiProviderCategorizeOutput> {
  const { commits } = input;
  const startTime = Date.now();
  const progressUpdates: string[] = [];
  const stats = {
    total: commits.length,
    aiSuccessful: 0,
    keywordFallback: 0,
    failed: 0,
    providerBreakdown: {} as Record<string, number>,
    totalProcessingTime: 0,
    averageTimePerCommit: 0,
    parallelBatches: 0,
  };

  const startMessage = `🚀 Starting enhanced multi-provider categorization of ${commits.length} commits...`;
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

  // Distribute batches with percentage allocation (50% Groq, 50% Gemini)
  const distributions = multiProviderAI.distributeBatches(commits);
  stats.parallelBatches = distributions.length;

  const distributionMessage = `📦 Created ${distributions.length} batches with 50/50 allocation:`;
  console.log(distributionMessage);
  progressUpdates.push(distributionMessage);

  // Log distribution details
  const providerCounts: Record<string, number> = {};
  distributions.forEach((dist) => {
    providerCounts[dist.provider] = (providerCounts[dist.provider] || 0) + dist.commits.length;
  });

  Object.entries(providerCounts).forEach(([provider, count]) => {
    const percentage = ((count / commits.length) * 100).toFixed(1);
    const detailMessage = `   ${provider}: ${count} commits (${percentage}%)`;
    console.log(detailMessage);
    progressUpdates.push(detailMessage);
  });

  // Process ALL batches in parallel for maximum speed
  const parallelMessage = `⚡ Processing ${distributions.length} batches in parallel...`;
  console.log(parallelMessage);
  progressUpdates.push(parallelMessage);

  const batchPromises = distributions.map((distribution, index) =>
    processBatch(distribution, index, distributions.length)
  );

  const batchResults = await Promise.allSettled(batchPromises);

  // Collect successful AI results and track failed batches by provider
  const aiCategorizedCommits: CategorizedCommit[] = [];
  const failedCommitsByProvider: Record<string, Array<{ sha: string; message: string }>> = {};
  const workingProviders: string[] = [];

  batchResults.forEach((result, index) => {
    const distribution = distributions[index];
    const providerName = distribution.provider;

    if (result.status === 'fulfilled') {
      const { results, provider, processingTime, success } = result.value;

      if (success && results.length > 0) {
        aiCategorizedCommits.push(...results);
        stats.aiSuccessful += results.length;
        stats.providerBreakdown[provider] = (stats.providerBreakdown[provider] || 0) + results.length;

        // Track working providers for failover
        if (!workingProviders.includes(providerName)) {
          workingProviders.push(providerName);
        }

        const resultMessage = `✅ Batch ${index + 1} completed: ${results.length} commits via ${provider} (${(processingTime / 1000).toFixed(1)}s)`;
        console.log(resultMessage);
        progressUpdates.push(resultMessage);
      } else {
        // AI failed for this batch - track by provider for failover
        if (!failedCommitsByProvider[providerName]) {
          failedCommitsByProvider[providerName] = [];
        }
        failedCommitsByProvider[providerName].push(...distribution.commits);

        const failMessage = `❌ Batch ${index + 1} AI failed: ${distribution.commits.length} commits from ${providerName} need failover`;
        console.log(failMessage);
        progressUpdates.push(failMessage);
      }
    } else {
      // Batch crashed - track by provider for failover
      if (!failedCommitsByProvider[providerName]) {
        failedCommitsByProvider[providerName] = [];
      }
      failedCommitsByProvider[providerName].push(...distribution.commits);

      const errorMessage = `💥 Batch ${index + 1} crashed: ${distribution.commits.length} commits from ${providerName} need failover`;
      console.error(errorMessage);
      progressUpdates.push(errorMessage);
    }
  });

  // Implement failover: redistribute failed commits to working providers
  const failoverCategorizedCommits: CategorizedCommit[] = [];
  const finalFailedCommits: Array<{ sha: string; message: string }> = [];

  // Process failover for each failed provider
  for (const [failedProvider, commits] of Object.entries(failedCommitsByProvider)) {
    if (commits.length === 0) continue;

    // Find a working provider (prefer the other main provider)
    const availableFailoverProviders = workingProviders.filter(p => p !== failedProvider);

    if (availableFailoverProviders.length > 0) {
      const failoverProvider = availableFailoverProviders[0]; // Use first available

      const failoverMessage = `🔄 Failover: Redistributing ${commits.length} commits from ${failedProvider} to ${failoverProvider}...`;
      console.log(failoverMessage);
      progressUpdates.push(failoverMessage);

      // Process failed commits with the working provider
      try {
        const failoverResult = await processBatch(
          { provider: failoverProvider, commits, batchSize: commits.length },
          -1, // Special index for failover batches
          1
        );

        if (failoverResult.success && failoverResult.results.length > 0) {
          failoverCategorizedCommits.push(...failoverResult.results);
          stats.aiSuccessful += failoverResult.results.length;
          stats.providerBreakdown[failoverResult.provider] = (stats.providerBreakdown[failoverResult.provider] || 0) + failoverResult.results.length;

          const successMessage = `✅ Failover successful: ${failoverResult.results.length} commits processed by ${failoverProvider}`;
          console.log(successMessage);
          progressUpdates.push(successMessage);
        } else {
          // Failover also failed, add to final failed list
          finalFailedCommits.push(...commits);

          const failMessage = `❌ Failover failed: ${commits.length} commits from ${failedProvider} still need keyword fallback`;
          console.log(failMessage);
          progressUpdates.push(failMessage);
        }
      } catch (error) {
        // Failover crashed, add to final failed list
        finalFailedCommits.push(...commits);

        const errorMessage = `💥 Failover crashed: ${commits.length} commits from ${failedProvider} need keyword fallback`;
        console.error(errorMessage);
        progressUpdates.push(errorMessage);
      }
    } else {
      // No working providers available for failover
      finalFailedCommits.push(...commits);

      const noFailoverMessage = `⚠️ No failover available: ${commits.length} commits from ${failedProvider} need keyword fallback`;
      console.log(noFailoverMessage);
      progressUpdates.push(noFailoverMessage);
    }
  }

  // Apply keyword fallback only to commits where ALL AI (including failover) failed
  const keywordCategorizedCommits: CategorizedCommit[] = [];
  if (finalFailedCommits.length > 0) {
    const keywordMessage = `🔄 Applying keyword fallback to ${finalFailedCommits.length} commits where all AI failed...`;
    console.log(keywordMessage);
    progressUpdates.push(keywordMessage);

    finalFailedCommits.forEach(commit => {
      const categories = categorizeWithKeywords(commit.message);
      keywordCategorizedCommits.push({
        sha: commit.sha,
        message: commit.message,
        categories: categories as any
      });
    });

    stats.keywordFallback = keywordCategorizedCommits.length;
    stats.providerBreakdown['keyword-fallback'] = keywordCategorizedCommits.length;

    const fallbackMessage = `✅ Keyword fallback completed: ${keywordCategorizedCommits.length} commits categorized`;
    console.log(fallbackMessage);
    progressUpdates.push(fallbackMessage);
  }

  // Combine all results (original AI + failover AI + keyword fallback)
  const allCategorizedCommits = [...aiCategorizedCommits, ...failoverCategorizedCommits, ...keywordCategorizedCommits];

  // Calculate final stats
  const totalTime = Date.now() - startTime;
  stats.totalProcessingTime = totalTime;
  stats.averageTimePerCommit = totalTime / commits.length;

  const finalMessage = `🎉 Enhanced categorization completed: ${allCategorizedCommits.length}/${commits.length} commits in ${(totalTime / 1000).toFixed(1)}s`;
  console.log(finalMessage);
  progressUpdates.push(finalMessage);

  // Log final breakdown
  const aiPercentage = ((stats.aiSuccessful / commits.length) * 100).toFixed(1);
  const keywordPercentage = ((stats.keywordFallback / commits.length) * 100).toFixed(1);

  const breakdownMessage = `📊 Final breakdown: ${stats.aiSuccessful} AI (${aiPercentage}%), ${stats.keywordFallback} keyword (${keywordPercentage}%)`;
  console.log(breakdownMessage);
  progressUpdates.push(breakdownMessage);

  return {
    categorizedCommits: allCategorizedCommits,
    stats,
    progressUpdates
  };
}
