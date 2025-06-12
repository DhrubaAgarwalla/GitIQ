#!/usr/bin/env tsx

// Debug script to find the exact issue with main app vs tests

// Load environment variables exactly like the main app
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { enhancedMultiProviderCategorizeCommits } from './flows/enhanced-multi-provider-categorize-flow';

// Simulate the exact same commits that would come from a real GitHub repo
const realGitHubCommits = [
  { sha: 'abc123def456', message: 'fix: resolve memory leak in user session management' },
  { sha: 'def456ghi789', message: 'feat: implement real-time notifications using WebSocket' },
  { sha: 'ghi789jkl012', message: 'docs: add comprehensive API documentation for v3.0' },
];

async function debugMainAppIssue() {
  console.log('🔍 DEBUGGING MAIN APP ISSUE\n');
  console.log('📊 Environment Check:');
  console.log('   GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  console.log('📝 Input commits:');
  realGitHubCommits.forEach((commit, index) => {
    console.log(`   ${index + 1}. ${commit.sha}: "${commit.message}"`);
  });
  console.log('');

  try {
    console.log('🚀 Starting enhanced categorization with debugging...\n');
    
    const result = await enhancedMultiProviderCategorizeCommits({ 
      commits: realGitHubCommits 
    });
    
    console.log('\n================================================================================');
    console.log('📈 DEBUG RESULTS');
    console.log('================================================================================\n');
    
    console.log('📊 Final Statistics:');
    console.log(`   Total Commits: ${result.stats.total}`);
    console.log(`   AI Successful: ${result.stats.aiSuccessful}`);
    console.log(`   Keyword Fallback: ${result.stats.keywordFallback}`);
    console.log(`   Failed: ${result.stats.failed}`);
    console.log(`   AI Success Rate: ${((result.stats.aiSuccessful / result.stats.total) * 100).toFixed(1)}%\n`);
    
    if (result.stats.providerBreakdown) {
      console.log('🤖 Provider Breakdown:');
      Object.entries(result.stats.providerBreakdown).forEach(([provider, count]) => {
        console.log(`   ${provider}: ${count} commits`);
      });
      console.log('');
    }
    
    console.log('📝 Final Categorized Commits:');
    result.categorizedCommits.forEach((commit, index) => {
      console.log(`   ${index + 1}. ${commit.sha}: [${commit.categories.join(', ')}]`);
      console.log(`      "${commit.message}"`);
    });
    
    console.log('\n================================================================================');
    if (result.stats.aiSuccessful > 0) {
      console.log('✅ AI processing worked! Issue might be elsewhere.');
    } else {
      console.log('❌ AI processing failed - this is the issue we need to fix.');
    }
    console.log('================================================================================\n');
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the debug
debugMainAppIssue().catch(console.error);
