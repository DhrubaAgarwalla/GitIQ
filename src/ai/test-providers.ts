/**
 * Test script to verify all AI providers are working correctly
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { multiProviderAI } from './providers/multi-provider-ai';
import { multiProviderCategorizeCommits } from './flows/multi-provider-categorize-flow';

async function testProviders() {
  console.log('🧪 Testing AI Providers...\n');

  // Test provider status
  console.log('📊 Provider Status:');
  const status = multiProviderAI.getProviderStatus();
  status.forEach(provider => {
    const statusIcon = provider.isAvailable ? '✅' : '❌';
    console.log(`${statusIcon} ${provider.name}: ${provider.isAvailable ? 'Available' : 'Unavailable'}`);
    console.log(`   Priority: ${provider.priority}, Max Batch: ${provider.maxBatchSize}, RPM: ${provider.requestsPerMinute}`);
  });

  console.log('\n🔄 Testing individual providers...\n');

  // Test simple prompt with each provider
  const testPrompt = 'Categorize this commit: "fix: resolve login bug". Return only: ["bugfix"]';

  const providers = ['groq', 'gemini', 'huggingface'];

  for (const provider of providers) {
    try {
      console.log(`Testing ${provider}...`);
      const response = await multiProviderAI.generateResponse(testPrompt, provider);
      console.log(`✅ ${provider}: ${response.content.substring(0, 100)}... (${response.responseTime}ms)`);
    } catch (error) {
      console.log(`❌ ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n🚀 Testing multi-provider categorization...\n');

  // Test with sample commits
  const testCommits = [
    { sha: 'abc123', message: 'fix: resolve authentication bug in login flow' },
    { sha: 'def456', message: 'feat: add new user dashboard with analytics' },
    { sha: 'ghi789', message: 'docs: update API documentation for v2.0' },
    { sha: 'jkl012', message: 'refactor: optimize database queries for performance' },
    { sha: 'mno345', message: 'test: add unit tests for payment processing' },
    { sha: 'pqr678', message: 'chore: update dependencies to latest versions' },
    { sha: 'stu901', message: 'style: fix code formatting and linting issues' },
    { sha: 'vwx234', message: 'perf: improve loading speed by 40%' },
  ];

  try {
    const result = await multiProviderCategorizeCommits({ commits: testCommits });

    console.log('📈 Results:');
    console.log(`Total: ${result.stats.total}`);
    console.log(`Successful: ${result.stats.successful}`);
    console.log(`Failed: ${result.stats.failed}`);
    console.log(`Processing time: ${(result.stats.totalProcessingTime / 1000).toFixed(1)}s`);
    console.log(`Average per commit: ${(result.stats.averageTimePerCommit / 1000).toFixed(2)}s`);

    console.log('\n🏷️ Provider Breakdown:');
    Object.entries(result.stats.providerBreakdown).forEach(([provider, count]) => {
      console.log(`   ${provider}: ${count} commits`);
    });

    console.log('\n📝 Sample Results:');
    result.categorizedCommits.slice(0, 3).forEach(commit => {
      console.log(`   ${commit.sha.substring(0, 7)}: ${commit.categories.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Multi-provider test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testProviders().catch(console.error);
}

export { testProviders };
