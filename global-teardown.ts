import { FullConfig } from '@playwright/test';
import { logger } from './lib/core/logger';
import { monitor } from './lib/core/monitor';
import { db } from './lib/core/db';

/**
 * Runs once after all tests
 * - Generate reports
 * - Display summary
 * - Clean up resources
 * - Show flaky tests
 */

async function globalTeardown(config: FullConfig) {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST EXECUTION COMPLETE');
  console.log('='.repeat(60) + '\n');

  // Generate monitoring report
  monitor.generateReport();

  // Get test statistics
  const stats = monitor.getStats();
  
  console.log('📊 Test Summary:');
  console.log(`   Total Tests: ${stats.total}`);
  console.log(`   ✅ Passed: ${stats.passed}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.skipped}`);
  console.log(`   📈 Pass Rate: ${stats.passRate}%`);
  console.log(`   ⏱️  Avg Duration: ${(stats.avgDuration / 1000).toFixed(2)}s`);

  // Show flaky tests
  const flaky = monitor.getFlakyTests(0.1);
  if (flaky.length > 0) {
    console.log('\n⚠️  Flaky Tests Detected:');
    flaky.forEach((test) => {
      console.log(`   • ${test.name}: ${(test.rate * 100).toFixed(1)}% failure rate (${test.total} runs)`);
    });
    console.log('\n   💡 Tip: Fix flaky tests to improve reliability');
  } else {
    console.log('\n✅ No flaky tests detected - excellent stability!');
  }

  // Show slowest tests
  const slowest = monitor.getSlowestTests(3);
  if (slowest.length > 0) {
    console.log('\n🐌 Slowest Tests:');
    slowest.forEach((test, i) => {
      console.log(`   ${i + 1}. ${test.name}: ${(test.duration / 1000).toFixed(2)}s`);
    });
  }

  // Display reports location
  console.log('\n📂 Reports Generated:');
  console.log('   • Playwright: reports/playwright/index.html');
  console.log('   • Metrics: reports/metrics-dashboard.html');
  console.log('   • JSON: reports/results.json');
  console.log('\n💡 Quick Commands:');
  console.log('   npm run report    - View Playwright report');
  console.log('   npm run metrics   - View metrics dashboard');
  console.log('\n' + '='.repeat(60));
  console.log('✨ Thank you for using Symitar/Banno Automation!');
  console.log('='.repeat(60) + '\n');

  await db.close();
  logger.info({ stats }, 'Test execution completed');
}

export default globalTeardown;