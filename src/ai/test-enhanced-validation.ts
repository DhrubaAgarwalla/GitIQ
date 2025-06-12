/**
 * Enhanced validation test with improved prompting
 * - Diverse commit types to test categorization accuracy
 * - Manual validation of results
 * - Teaching AI with better examples and guidance
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { enhancedMultiProviderCategorizeCommits } from './flows/enhanced-multi-provider-categorize-flow';

// 50 carefully selected commits representing different categories
const validationCommits = [
  // Clear bugfix examples
  { sha: 'bug001', message: 'fix: resolve memory leak in user session management' },
  { sha: 'bug002', message: 'fix: correct timezone handling in date picker component' },
  { sha: 'bug003', message: 'fix: handle edge case in user registration validation' },
  { sha: 'bug004', message: 'fix: resolve infinite loop in data fetching hook' },
  { sha: 'bug005', message: 'fix: correct calculation error in pricing component' },
  
  // Clear feature examples
  { sha: 'feat001', message: 'feat: implement real-time notifications using WebSocket' },
  { sha: 'feat002', message: 'feat: add dark mode support with theme switching' },
  { sha: 'feat003', message: 'feat: implement advanced search with filters and sorting' },
  { sha: 'feat004', message: 'feat: add export functionality for user data (GDPR)' },
  { sha: 'feat005', message: 'feat: implement user profile customization options' },
  
  // Clear refactor examples
  { sha: 'ref001', message: 'refactor: extract payment processing into separate service' },
  { sha: 'ref002', message: 'refactor: migrate from class components to React hooks' },
  { sha: 'ref003', message: 'refactor: simplify state management using Redux Toolkit' },
  { sha: 'ref004', message: 'refactor: extract common UI components into library' },
  { sha: 'ref005', message: 'refactor: improve error handling throughout application' },
  
  // Clear documentation examples
  { sha: 'doc001', message: 'docs: add comprehensive API documentation for v3.0' },
  { sha: 'doc002', message: 'docs: create getting started guide for new developers' },
  { sha: 'doc003', message: 'docs: update README with installation instructions' },
  { sha: 'doc004', message: 'docs: add code examples to component documentation' },
  { sha: 'doc005', message: 'docs: create troubleshooting guide for common issues' },
  
  // Clear test examples
  { sha: 'test001', message: 'test: add integration tests for authentication flow' },
  { sha: 'test002', message: 'test: increase test coverage to 85% for core modules' },
  { sha: 'test003', message: 'test: add unit tests for utility functions' },
  { sha: 'test004', message: 'test: add end-to-end tests using Cypress' },
  { sha: 'test005', message: 'test: add performance tests for critical user paths' },
  
  // Clear performance examples
  { sha: 'perf001', message: 'perf: optimize database queries reducing load time by 60%' },
  { sha: 'perf002', message: 'perf: lazy load components to improve initial page load' },
  { sha: 'perf003', message: 'perf: implement caching strategy for API responses' },
  { sha: 'perf004', message: 'perf: reduce JavaScript bundle size by 40%' },
  { sha: 'perf005', message: 'perf: implement virtual scrolling for large lists' },
  
  // Clear security examples
  { sha: 'sec001', message: 'security: implement rate limiting for API endpoints' },
  { sha: 'sec002', message: 'security: add input validation and sanitization' },
  { sha: 'sec003', message: 'security: implement two-factor authentication' },
  { sha: 'sec004', message: 'security: add CSRF protection to all forms' },
  { sha: 'sec005', message: 'security: implement content security policy (CSP)' },
  
  // Clear styling examples
  { sha: 'style001', message: 'style: implement responsive design for mobile devices' },
  { sha: 'style002', message: 'style: fix inconsistent button styling across pages' },
  { sha: 'style003', message: 'style: implement design system with consistent colors' },
  { sha: 'style004', message: 'style: update typography and spacing for better readability' },
  { sha: 'style005', message: 'style: implement CSS-in-JS with styled-components' },
  
  // Clear build examples
  { sha: 'build001', message: 'build: update webpack configuration for production builds' },
  { sha: 'build002', message: 'build: configure Docker containers for development' },
  { sha: 'build003', message: 'build: optimize bundle size using tree shaking' },
  { sha: 'build004', message: 'build: add source maps for better debugging' },
  { sha: 'build005', message: 'build: implement progressive web app features' },
  
  // Clear CI/CD examples
  { sha: 'ci001', message: 'ci: add automated testing pipeline with GitHub Actions' },
  { sha: 'ci002', message: 'ci: implement blue-green deployment strategy' },
  { sha: 'ci003', message: 'ci: add code quality checks with SonarQube' },
  { sha: 'ci004', message: 'ci: implement automated security scanning' },
  { sha: 'ci005', message: 'ci: add automated performance monitoring' },
];

// Expected results for validation
const expectedResults = {
  'bug001': ['bugfix'], 'bug002': ['bugfix'], 'bug003': ['bugfix'], 'bug004': ['bugfix'], 'bug005': ['bugfix'],
  'feat001': ['feature'], 'feat002': ['feature'], 'feat003': ['feature'], 'feat004': ['feature'], 'feat005': ['feature'],
  'ref001': ['refactor'], 'ref002': ['refactor'], 'ref003': ['refactor'], 'ref004': ['refactor'], 'ref005': ['refactor'],
  'doc001': ['documentation'], 'doc002': ['documentation'], 'doc003': ['documentation'], 'doc004': ['documentation'], 'doc005': ['documentation'],
  'test001': ['test'], 'test002': ['test'], 'test003': ['test'], 'test004': ['test'], 'test005': ['test'],
  'perf001': ['performance'], 'perf002': ['performance'], 'perf003': ['performance'], 'perf004': ['performance'], 'perf005': ['performance'],
  'sec001': ['security'], 'sec002': ['security'], 'sec003': ['security'], 'sec004': ['security'], 'sec005': ['security'],
  'style001': ['styling'], 'style002': ['styling'], 'style003': ['styling'], 'style004': ['styling'], 'style005': ['styling'],
  'build001': ['build'], 'build002': ['build'], 'build003': ['build'], 'build004': ['build'], 'build005': ['build'],
  'ci001': ['ci/cd'], 'ci002': ['ci/cd'], 'ci003': ['ci/cd'], 'ci004': ['ci/cd'], 'ci005': ['ci/cd'],
};

async function testEnhancedValidation() {
  console.log('🧪 Enhanced Validation Test with Improved Prompting\n');
  console.log('📊 Test Configuration:');
  console.log('   • 50 carefully selected commits (5 per category)');
  console.log('   • Enhanced prompting with examples and guidance');
  console.log('   • Manual validation against expected results');
  console.log('   • Accuracy measurement and analysis\n');
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting enhanced validation categorization...\n');
    
    const result = await enhancedMultiProviderCategorizeCommits({ 
      commits: validationCommits 
    });
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 ENHANCED VALIDATION RESULTS');
    console.log('='.repeat(80));
    
    // Accuracy Analysis
    console.log('\n🎯 Accuracy Analysis:');
    let correctPrimary = 0;
    let correctAny = 0;
    let totalCommits = result.categorizedCommits.length;
    
    const detailedResults: Array<{
      sha: string;
      message: string;
      expected: string[];
      actual: string[];
      primaryMatch: boolean;
      anyMatch: boolean;
    }> = [];
    
    result.categorizedCommits.forEach(commit => {
      const expected = expectedResults[commit.sha as keyof typeof expectedResults] || [];
      const actual = commit.categories;
      
      // Check if primary category matches
      const primaryMatch = expected.length > 0 && actual.length > 0 && expected[0] === actual[0];
      
      // Check if any category matches
      const anyMatch = expected.some(exp => actual.includes(exp));
      
      if (primaryMatch) correctPrimary++;
      if (anyMatch) correctAny++;
      
      detailedResults.push({
        sha: commit.sha,
        message: commit.message.substring(0, 60) + '...',
        expected,
        actual,
        primaryMatch,
        anyMatch
      });
    });
    
    const primaryAccuracy = (correctPrimary / totalCommits) * 100;
    const anyAccuracy = (correctAny / totalCommits) * 100;
    
    console.log(`   Primary Category Accuracy: ${correctPrimary}/${totalCommits} (${primaryAccuracy.toFixed(1)}%)`);
    console.log(`   Any Category Accuracy: ${correctAny}/${totalCommits} (${anyAccuracy.toFixed(1)}%)`);
    
    // Performance Stats
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Total Processing Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`   Average Time per Commit: ${(totalTime / totalCommits / 1000).toFixed(3)}s`);
    console.log(`   Commits per Second: ${(totalCommits / (totalTime / 1000)).toFixed(1)}`);
    
    // Provider Breakdown
    console.log('\n🤖 Provider Performance:');
    Object.entries(result.stats.providerBreakdown).forEach(([provider, count]) => {
      const percentage = ((count / totalCommits) * 100).toFixed(1);
      console.log(`   ${provider}: ${count} commits (${percentage}%)`);
    });
    
    // Category Distribution
    console.log('\n🏷️ Category Distribution:');
    const categoryCount: Record<string, number> = {};
    result.categorizedCommits.forEach(commit => {
      commit.categories.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });
    
    Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / totalCommits) * 100).toFixed(1);
        console.log(`   ${category}: ${count} commits (${percentage}%)`);
      });
    
    // Detailed Results (first 10)
    console.log('\n📝 Sample Results (First 10):');
    detailedResults.slice(0, 10).forEach((result, index) => {
      const status = result.primaryMatch ? '✅' : result.anyMatch ? '⚠️' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.sha}`);
      console.log(`      Expected: [${result.expected.join(', ')}]`);
      console.log(`      Actual: [${result.actual.join(', ')}]`);
      console.log(`      "${result.message}"`);
    });
    
    // Error Analysis
    console.log('\n🔍 Error Analysis:');
    const errors = detailedResults.filter(r => !r.primaryMatch);
    if (errors.length > 0) {
      console.log(`   Found ${errors.length} primary category mismatches:`);
      errors.slice(0, 5).forEach(error => {
        console.log(`   ❌ ${error.sha}: Expected [${error.expected.join(', ')}], Got [${error.actual.join(', ')}]`);
      });
    } else {
      console.log('   🎉 Perfect primary category accuracy!');
    }
    
    // Quality Assessment
    console.log('\n📊 Quality Assessment:');
    const multiCategoryCommits = result.categorizedCommits.filter(c => c.categories.length > 1);
    const singleCategoryCommits = result.categorizedCommits.filter(c => c.categories.length === 1);
    const otherCategoryCommits = result.categorizedCommits.filter(c => c.categories.includes('other'));
    
    console.log(`   Single Category: ${singleCategoryCommits.length} commits (${((singleCategoryCommits.length / totalCommits) * 100).toFixed(1)}%)`);
    console.log(`   Multi Category: ${multiCategoryCommits.length} commits (${((multiCategoryCommits.length / totalCommits) * 100).toFixed(1)}%)`);
    console.log(`   "Other" Category: ${otherCategoryCommits.length} commits (${((otherCategoryCommits.length / totalCommits) * 100).toFixed(1)}%)`);
    
    console.log('\n' + '='.repeat(80));
    if (primaryAccuracy >= 90) {
      console.log('✅ Enhanced validation test: EXCELLENT accuracy!');
    } else if (primaryAccuracy >= 80) {
      console.log('✅ Enhanced validation test: GOOD accuracy!');
    } else if (primaryAccuracy >= 70) {
      console.log('⚠️ Enhanced validation test: FAIR accuracy - needs improvement');
    } else {
      console.log('❌ Enhanced validation test: POOR accuracy - major improvements needed');
    }
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Enhanced validation test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEnhancedValidation().catch(console.error);
}

export { testEnhancedValidation };
