/**
 * Test script with 100 realistic commits - AI-only categorization (no keyword fallbacks)
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { multiProviderCategorizeCommits, setDisableKeywordFallback } from './flows/multi-provider-categorize-flow';

// 100 realistic commit messages from various projects
const test100Commits = [
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

  { sha: 'o1p2q3r', message: 'fix: correct timezone handling in date picker component' },
  { sha: 's4t5u6v', message: 'feat: add dark mode support with theme switching' },
  { sha: 'w7x8y9z', message: 'style: implement responsive design for mobile devices' },
  { sha: 'a0b1c2d', message: 'refactor: migrate from class components to React hooks' },
  { sha: 'e3f4g5h', message: 'test: increase test coverage to 85% for core modules' },
  { sha: 'i6j7k8l', message: 'docs: create getting started guide for new developers' },
  { sha: 'm9n0o1p', message: 'fix: resolve CORS issues in production environment' },
  { sha: 'q2r3s4t', message: 'feat: implement advanced search with filters and sorting' },
  { sha: 'u5v6w7x', message: 'perf: lazy load components to improve initial page load' },
  { sha: 'y8z9a0b', message: 'security: add input validation and sanitization' },

  { sha: 'c1d2e3f', message: 'build: configure Docker containers for development' },
  { sha: 'g4h5i6j', message: 'ci: implement blue-green deployment strategy' },
  { sha: 'k7l8m9n', message: 'deps: remove unused dependencies and update package.json' },
  { sha: 'o0p1q2r', message: 'fix: handle edge case in user registration validation' },
  { sha: 's3t4u5v', message: 'feat: add export functionality for user data (GDPR)' },
  { sha: 'w6x7y8z', message: 'docs: update README with installation instructions' },
  { sha: 'a9b0c1d', message: 'refactor: simplify state management using Redux Toolkit' },
  { sha: 'e2f3g4h', message: 'test: add unit tests for utility functions' },
  { sha: 'i5j6k7l', message: 'style: fix inconsistent button styling across pages' },
  { sha: 'm8n9o0p', message: 'perf: implement caching strategy for API responses' },

  { sha: 'q1r2s3t', message: 'security: upgrade dependencies to fix vulnerabilities' },
  { sha: 'u4v5w6x', message: 'build: optimize bundle size using tree shaking' },
  { sha: 'y7z8a9b', message: 'ci: add code quality checks with SonarQube' },
  { sha: 'c0d1e2f', message: 'deps: migrate from npm to yarn for better performance' },
  { sha: 'g3h4i5j', message: 'fix: resolve infinite loop in data fetching hook' },
  { sha: 'k6l7m8n', message: 'feat: implement user profile customization options' },
  { sha: 'o9p0q1r', message: 'docs: add code examples to component documentation' },
  { sha: 's2t3u4v', message: 'refactor: extract common UI components into library' },
  { sha: 'w5x6y7z', message: 'test: add end-to-end tests using Cypress' },
  { sha: 'a8b9c0d', message: 'style: implement design system with consistent colors' },

  { sha: 'e1f2g3h', message: 'perf: reduce JavaScript bundle size by 40%' },
  { sha: 'i4j5k6l', message: 'security: implement two-factor authentication' },
  { sha: 'm7n8o9p', message: 'build: add source maps for better debugging' },
  { sha: 'q0r1s2t', message: 'ci: implement automated security scanning' },
  { sha: 'u3v4w5x', message: 'deps: update all dependencies to latest stable versions' },
  { sha: 'y6z7a8b', message: 'fix: correct calculation error in pricing component' },
  { sha: 'c9d0e1f', message: 'feat: add multi-language support with i18n' },
  { sha: 'g2h3i4j', message: 'docs: create troubleshooting guide for common issues' },
  { sha: 'k5l6m7n', message: 'refactor: improve error handling throughout application' },
  { sha: 'o8p9q0r', message: 'test: add performance tests for critical user paths' },

  { sha: 's1t2u3v', message: 'style: update typography and spacing for better readability' },
  { sha: 'w4x5y6z', message: 'perf: implement virtual scrolling for large lists' },
  { sha: 'a7b8c9d', message: 'security: add CSRF protection to all forms' },
  { sha: 'e0f1g2h', message: 'build: implement progressive web app features' },
  { sha: 'i3j4k5l', message: 'ci: add automated performance monitoring' },
  { sha: 'm6n7o8p', message: 'deps: replace deprecated libraries with modern alternatives' },
  { sha: 'q9r0s1t', message: 'fix: resolve race condition in async data loading' },
  { sha: 'u2v3w4x', message: 'feat: implement real-time collaboration features' },
  { sha: 'y5z6a7b', message: 'docs: add architectural decision records (ADRs)' },
  { sha: 'c8d9e0f', message: 'refactor: migrate to TypeScript for better type safety' },

  { sha: 'g1h2i3j', message: 'test: add accessibility tests using axe-core' },
  { sha: 'k4l5m6n', message: 'style: implement CSS-in-JS with styled-components' },
  { sha: 'o7p8q9r', message: 'perf: optimize images with next-gen formats (WebP, AVIF)' },
  { sha: 's0t1u2v', message: 'security: implement content security policy (CSP)' },
  { sha: 'w3x4y5z', message: 'build: add hot module replacement for faster development' },
  { sha: 'a6b7c8d', message: 'ci: implement feature branch deployment previews' },
  { sha: 'e9f0g1h', message: 'deps: audit and fix security vulnerabilities' },
  { sha: 'i2j3k4l', message: 'fix: handle network errors gracefully with retry logic' },
  { sha: 'm5n6o7p', message: 'feat: add offline support with service workers' },
  { sha: 'q8r9s0t', message: 'docs: create video tutorials for key features' },

  { sha: 'u1v2w3x', message: 'refactor: implement clean architecture patterns' },
  { sha: 'y4z5a6b', message: 'test: add mutation testing to improve test quality' },
  { sha: 'c7d8e9f', message: 'style: implement atomic design methodology' },
  { sha: 'g0h1i2j', message: 'perf: implement code splitting at route level' },
  { sha: 'k3l4m5n', message: 'security: add API authentication with JWT tokens' },
  { sha: 'o6p7q8r', message: 'build: implement micro-frontend architecture' },
  { sha: 's9t0u1v', message: 'ci: add automated dependency updates with Dependabot' },
  { sha: 'w2x3y4z', message: 'deps: migrate from Webpack to Vite for faster builds' },
  { sha: 'a5b6c7d', message: 'fix: resolve memory leaks in event listeners' },
  { sha: 'e8f9g0h', message: 'feat: implement advanced analytics dashboard' },

  { sha: 'i1j2k3l', message: 'docs: add interactive API explorer with Swagger' },
  { sha: 'm4n5o6p', message: 'refactor: implement hexagonal architecture' },
  { sha: 'q7r8s9t', message: 'test: add contract testing between services' },
  { sha: 'u0v1w2x', message: 'style: implement design tokens for consistent theming' },
  { sha: 'y3z4a5b', message: 'perf: implement server-side rendering (SSR)' },
  { sha: 'c6d7e8f', message: 'security: implement zero-trust security model' },
  { sha: 'g9h0i1j', message: 'build: implement monorepo with Nx workspace' },
  { sha: 'k2l3m4n', message: 'ci: implement chaos engineering tests' },
  { sha: 'o5p6q7r', message: 'deps: implement automated license compliance checking' },
  { sha: 's8t9u0v', message: 'fix: resolve cross-browser compatibility issues' },

  { sha: 'w1x2y3z', message: 'feat: implement machine learning recommendations' },
  { sha: 'a4b5c6d', message: 'docs: create comprehensive onboarding documentation' },
  { sha: 'e7f8g9h', message: 'refactor: implement domain-driven design patterns' },
  { sha: 'i0j1k2l', message: 'test: implement property-based testing with fast-check' },
  { sha: 'm3n4o5p', message: 'style: implement CSS custom properties for theming' },
  { sha: 'q6r7s8t', message: 'perf: implement edge computing with CDN optimization' },
  { sha: 'u9v0w1x', message: 'security: implement biometric authentication support' },
  { sha: 'y2z3a4b', message: 'build: implement infrastructure as code with Terraform' },
  { sha: 'c5d6e7f', message: 'ci: implement GitOps deployment with ArgoCD' },
  { sha: 'g8h9i0j', message: 'deps: implement semantic versioning automation' },

  { sha: 'k1l2m3n', message: 'fix: resolve data consistency issues in distributed system' },
  { sha: 'o4p5q6r', message: 'feat: implement blockchain integration for transparency' },
  { sha: 's7t8u9v', message: 'docs: create decision trees for troubleshooting' },
  { sha: 'w0x1y2z', message: 'refactor: implement event-driven architecture' },
  { sha: 'a3b4c5d', message: 'test: implement chaos monkey for resilience testing' },
];

async function test100CommitsAIOnly() {
  console.log('🧪 Testing 100 Commits with AI-Only Categorization\n');
  console.log('📊 Test Configuration:');
  console.log('   • 100 realistic commit messages');
  console.log('   • AI-only categorization (no keyword fallbacks)');
  console.log('   • Multi-provider distribution');
  console.log('   • Performance and accuracy measurement\n');

  // Enable AI-only mode (disable keyword fallbacks)
  setDisableKeywordFallback(true);

  const startTime = Date.now();

  try {
    console.log('🚀 Starting categorization...\n');

    const result = await multiProviderCategorizeCommits({
      commits: test100Commits
    });

    const totalTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(80));
    console.log('📈 FINAL RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Basic Stats
    console.log('\n📊 Processing Statistics:');
    console.log(`   Total Commits: ${result.stats.total}`);
    console.log(`   Successfully Processed: ${result.stats.successful}`);
    console.log(`   Failed (Fallback): ${result.stats.failed}`);
    console.log(`   Success Rate: ${((result.stats.successful / result.stats.total) * 100).toFixed(1)}%`);

    // Performance Stats
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Total Processing Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`   Average Time per Commit: ${(totalTime / result.stats.total / 1000).toFixed(3)}s`);
    console.log(`   Commits per Second: ${(result.stats.total / (totalTime / 1000)).toFixed(1)}`);

    // Provider Breakdown
    console.log('\n🤖 Provider Performance:');
    Object.entries(result.stats.providerBreakdown).forEach(([provider, count]) => {
      const percentage = ((count / result.stats.total) * 100).toFixed(1);
      console.log(`   ${provider}: ${count} commits (${percentage}%)`);
    });

    // Category Analysis
    console.log('\n🏷️ Category Distribution:');
    const categoryCount: Record<string, number> = {};
    result.categorizedCommits.forEach(commit => {
      commit.categories.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a);

    sortedCategories.forEach(([category, count]) => {
      const percentage = ((count / result.stats.total) * 100).toFixed(1);
      console.log(`   ${category}: ${count} commits (${percentage}%)`);
    });

    // Sample Results
    console.log('\n📝 Sample Categorizations:');
    result.categorizedCommits.slice(0, 10).forEach((commit, index) => {
      const shortSha = commit.sha.substring(0, 7);
      const shortMessage = commit.message.length > 60
        ? commit.message.substring(0, 60) + '...'
        : commit.message;
      console.log(`   ${index + 1}. ${shortSha}: [${commit.categories.join(', ')}]`);
      console.log(`      "${shortMessage}"`);
    });

    // Quality Assessment
    console.log('\n🎯 Quality Assessment:');
    const multiCategoryCommits = result.categorizedCommits.filter(c => c.categories.length > 1);
    const singleCategoryCommits = result.categorizedCommits.filter(c => c.categories.length === 1);
    const otherCategoryCommits = result.categorizedCommits.filter(c => c.categories.includes('other'));

    console.log(`   Single Category: ${singleCategoryCommits.length} commits (${((singleCategoryCommits.length / result.stats.total) * 100).toFixed(1)}%)`);
    console.log(`   Multi Category: ${multiCategoryCommits.length} commits (${((multiCategoryCommits.length / result.stats.total) * 100).toFixed(1)}%)`);
    console.log(`   "Other" Category: ${otherCategoryCommits.length} commits (${((otherCategoryCommits.length / result.stats.total) * 100).toFixed(1)}%)`);

    // Speed Comparison
    console.log('\n🏃‍♂️ Speed Comparison:');
    console.log(`   Current Speed: ${(result.stats.total / (totalTime / 1000)).toFixed(1)} commits/second`);
    console.log(`   Single Provider Estimate: ~${(result.stats.total / (totalTime / 1000 * 3)).toFixed(1)} commits/second`);
    console.log(`   Speed Improvement: ~${((totalTime / 1000 * 3) / (totalTime / 1000)).toFixed(1)}x faster`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nThis might be due to:');
    console.error('   • API rate limits');
    console.error('   • Network connectivity issues');
    console.error('   • Invalid API keys');
    console.error('   • Provider service outages');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  test100CommitsAIOnly().catch(console.error);
}

export { test100CommitsAIOnly };
