#!/usr/bin/env tsx

// Test to verify the main app data format works with enhanced AI system

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { enhancedMultiProviderCategorizeCommits } from './flows/enhanced-multi-provider-categorize-flow';

// Simulate the exact data format that the main app sends
const mainAppFormatCommits = [
  { sha: 'a1b2c3d', message: 'fix: resolve memory leak in user session management' },
  { sha: 'e4f5g6h', message: 'feat: implement real-time notifications using WebSocket' },
  { sha: 'i7j8k9l', message: 'docs: add comprehensive API documentation for v3.0' },
  { sha: 'm0n1o2p', message: 'refactor: extract payment processing into separate service' },
  { sha: 'q3r4s5t', message: 'test: add integration tests for authentication flow' },
  { sha: 'u6v7w8x', message: 'perf: optimize database queries reducing load time by 60%' },
  { sha: 'y9z0a1b', message: 'security: implement rate limiting for API endpoints' },
  { sha: 'c2d3e4f', message: 'build: update webpack configuration for production builds' },
  { sha: 'g5h6i7j', message: 'ci: add automated testing pipeline with GitHub Actions' },
  { sha: 'k8l9m0n', message: 'deps: upgrade React to v18 and related dependencies' },
];

async function testMainAppFormat() {
  console.log('🧪 Testing Main App Data Format with Enhanced AI System\n');
  console.log('📊 Test Configuration:');
  console.log('   • 10 commits in main app format');
  console.log('   • Testing exact data structure from main app');
  console.log('   • Verifying AI processing works correctly\n');

  try {
    const startTime = Date.now();
    
    console.log('🚀 Starting enhanced categorization...\n');
    
    const result = await enhancedMultiProviderCategorizeCommits({ 
      commits: mainAppFormatCommits 
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n================================================================================');
    console.log('📈 MAIN APP FORMAT TEST RESULTS');
    console.log('================================================================================\n');
    
    console.log('📊 Processing Statistics:');
    console.log(`   Total Commits: ${result.stats.total}`);
    console.log(`   AI Successful: ${result.stats.aiSuccessful}`);
    console.log(`   Keyword Fallback: ${result.stats.keywordFallback}`);
    console.log(`   Failed: ${result.stats.failed}`);
    console.log(`   AI Success Rate: ${((result.stats.aiSuccessful / result.stats.total) * 100).toFixed(1)}%\n`);
    
    console.log('⚡ Performance Metrics:');
    console.log(`   Total Processing Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`   Average Time per Commit: ${(totalTime / result.stats.total / 1000).toFixed(3)}s`);
    console.log(`   Commits per Second: ${(result.stats.total / (totalTime / 1000)).toFixed(1)}\n`);
    
    if (result.stats.providerBreakdown) {
      console.log('🤖 Provider Performance:');
      Object.entries(result.stats.providerBreakdown).forEach(([provider, count]) => {
        const percentage = ((count / result.stats.total) * 100).toFixed(1);
        console.log(`   🤖 ${provider}: ${count} commits (${percentage}%)`);
      });
      console.log('');
    }
    
    console.log('📝 Sample Categorizations:');
    result.categorizedCommits.slice(0, 5).forEach((commit, index) => {
      console.log(`   ${index + 1}. ${commit.sha}: [${commit.categories.join(', ')}]`);
      console.log(`      "${commit.message}"`);
    });
    
    console.log('\n================================================================================');
    if (result.stats.aiSuccessful === result.stats.total) {
      console.log('✅ Main app format test completed successfully!');
    } else {
      console.log('⚠️ Main app format test had some issues - check the results above');
    }
    console.log('================================================================================\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMainAppFormat().catch(console.error);
