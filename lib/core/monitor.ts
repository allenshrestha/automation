import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

interface TestMetrics {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: string;
  retries?: number;
}

/**
 * TEST METRICS MONITOR - MODERNIZED FOR 2025
 * 
 * ⚠️ IMPORTANT CHANGE: No longer use try-catch in tests!
 * 
 * OLD WAY (Anti-Pattern):
 * ```
 * try {
 *   await page.click('button');
 *   tracker.end('passed');
 * } catch (error) {
 *   tracker.end('failed', error);
 *   throw error;
 * }
 * ```
 * 
 * NEW WAY (Use Custom Reporter):
 * ```
 * // In playwright.config.ts
 * reporter: [
 *   ['html'],
 *   ['./lib/reporters/metrics-reporter.ts']
 * ]
 * 
 * // In tests - no manual tracking!
 * test('my test', async ({ page }) => {
 *   await page.click('button'); // Let Playwright handle failures
 * });
 * ```
 * 
 * This module now focuses on:
 * - Aggregating metrics from test runs
 * - Flakiness detection
 * - Report generation
 * - NOT manual try-catch tracking
 * 
 * Features:
 * - Automatic test execution tracking (via reporter)
 * - Flakiness detection
 * - Performance metrics
 * - Beautiful HTML reports
 * 
 * Usage:
 * // Automatic via reporter - no manual calls needed!
 * // Just run: npx playwright test
 * 
 * // Or use programmatically for analysis:
 * const flaky = monitor.getFlakyTests();
 * const stats = monitor.getStats();
 * monitor.generateReport();
 */

class Monitor {
  private metrics: TestMetrics[] = [];
  private flakinessTracker: Map<string, { total: number; failures: number }> = new Map();
  private metricsDir = 'metrics';

  constructor() {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
    this.loadData();
  }

  /**
   * ⚠️ DEPRECATED: Use custom reporter instead
   * 
   * Track test execution - LEGACY METHOD
   * 
   * @deprecated This method encourages try-catch anti-pattern.
   * Use Playwright's custom reporter instead (see lib/reporters/metrics-reporter.ts)
   * 
   * Keeping for backward compatibility, but will log warning.
   */
  trackTest(testName: string) {
    const startTime = Date.now();
    
    logger.warn({ 
      testName,
      message: '⚠️ Using legacy monitor.trackTest(). Consider migrating to custom reporter.' 
    }, 'Deprecated method called');

    return {
      end: (status: 'passed' | 'failed' | 'skipped', error?: Error, retries: number = 0) => {
        const duration = Date.now() - startTime;

        const metric: TestMetrics = {
          testName,
          status,
          duration,
          error: error?.message,
          timestamp: new Date().toISOString(),
          retries,
        };

        this.recordMetric(metric);
      },
    };
  }

  /**
   * ✅ MODERN: Record metric (called by reporter)
   * 
   * This is the modern way - called automatically by custom reporter
   */
  recordMetric(metric: TestMetrics) {
    this.metrics.push(metric);
    this.updateFlakiness(metric.testName, metric.status === 'passed');

    if (metric.status === 'failed') {
      logger.error({ 
        testName: metric.testName, 
        duration: metric.duration, 
        error: metric.error 
      }, 'Test failed');
    } else {
      logger.info({ 
        testName: metric.testName, 
        duration: metric.duration, 
        status: metric.status 
      }, 'Test completed');
    }

    this.save();
  }

  /**
   * Update flakiness tracking
   */
  private updateFlakiness(testName: string, passed: boolean) {
    const current = this.flakinessTracker.get(testName) || { total: 0, failures: 0 };
    current.total++;
    if (!passed) current.failures++;
    this.flakinessTracker.set(testName, current);
  }

  /**
   * Get flaky tests (failure rate > threshold)
   */
  getFlakyTests(threshold: number = 0.1): Array<{ name: string; rate: number; total: number }> {
    const flaky: Array<{ name: string; rate: number; total: number }> = [];

    this.flakinessTracker.forEach((stats, name) => {
      const rate = stats.failures / stats.total;
      // Only consider tests run at least 3 times
      if (rate > threshold && rate < 1.0 && stats.total >= 3) {
        flaky.push({ name, rate, total: stats.total });
      }
    });

    return flaky.sort((a, b) => b.rate - a.rate);
  }

  /**
   * Get test statistics
   */
  getStats() {
    const passed = this.metrics.filter((m) => m.status === 'passed').length;
    const failed = this.metrics.filter((m) => m.status === 'failed').length;
    const skipped = this.metrics.filter((m) => m.status === 'skipped').length;
    const total = this.metrics.length;
    
    const avgDuration = total > 0
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / total
      : 0;

    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      passed,
      failed,
      skipped,
      total,
      avgDuration: Math.round(avgDuration),
      passRate: passRate.toFixed(1),
    };
  }

  /**
   * Get slowest tests
   */
  getSlowestTests(count: number = 10) {
    return this.metrics
      .filter(m => m.status === 'passed')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count)
      .map(m => ({ name: m.testName, duration: m.duration }));
  }

  /**
   * Generate HTML report
   */
  generateReport() {
    const stats = this.getStats();
    const flaky = this.getFlakyTests();
    const slowest = this.getSlowestTests(5);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Metrics Dashboard</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { 
      background: white; 
      padding: 40px; 
      border-radius: 12px; 
      margin-bottom: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header h1 { 
      color: #2d3748; 
      margin-bottom: 8px;
      font-size: 32px;
    }
    .header p { color: #718096; font-size: 14px; }
    .cards { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 20px; 
      margin-bottom: 24px; 
    }
    .card { 
      background: white; 
      padding: 30px; 
      border-radius: 12px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-4px); }
    .card h3 { 
      color: #718096; 
      font-size: 14px; 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px; 
    }
    .card .value { 
      font-size: 42px; 
      font-weight: 700; 
      color: #2d3748; 
    }
    .passed { color: #48bb78; }
    .failed { color: #f56565; }
    .section { 
      background: white; 
      padding: 30px; 
      border-radius: 12px; 
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .section h2 { 
      color: #2d3748; 
      margin-bottom: 20px;
      font-size: 24px;
    }
    .flaky-item, .slow-item { 
      padding: 16px; 
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }
    .flaky-item:hover, .slow-item:hover {
      background: #f7fafc;
    }
    .flaky-item:last-child, .slow-item:last-child { 
      border-bottom: none; 
    }
    .flaky-rate, .duration-badge { 
      padding: 6px 16px; 
      border-radius: 20px; 
      font-size: 13px; 
      font-weight: 600;
    }
    .rate-high { background: #fed7d7; color: #c53030; }
    .rate-medium { background: #feebc8; color: #c05621; }
    .rate-low { background: #c6f6d5; color: #2f855a; }
    .no-data { 
      text-align: center; 
      padding: 60px 20px; 
      color: #a0aec0;
      font-size: 16px;
    }
    .no-data::before {
      content: '✨';
      display: block;
      font-size: 48px;
      margin-bottom: 16px;
    }
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
      transition: width 0.3s;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    .badge-success { background: #c6f6d5; color: #2f855a; }
    .badge-warning { background: #feebc8; color: #c05621; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Test Metrics Dashboard</h1>
      <p>Symitar/Banno Automation Framework</p>
      <p style="font-size: 12px; margin-top: 8px; opacity: 0.6;">
        Generated: ${new Date().toLocaleString()}
      </p>
    </div>

    <div class="cards">
      <div class="card">
        <h3>Total Tests</h3>
        <div class="value">${stats.total}</div>
      </div>
      <div class="card">
        <h3>Passed</h3>
        <div class="value passed">${stats.passed}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.passRate}%"></div>
        </div>
      </div>
      <div class="card">
        <h3>Failed</h3>
        <div class="value failed">${stats.failed}</div>
      </div>
      <div class="card">
        <h3>Pass Rate</h3>
        <div class="value">${stats.passRate}%</div>
      </div>
      <div class="card">
        <h3>Avg Duration</h3>
        <div class="value">${(stats.avgDuration / 1000).toFixed(1)}s</div>
      </div>
      <div class="card">
        <h3>Flaky Tests</h3>
        <div class="value ${flaky.length > 0 ? 'failed' : 'passed'}">${flaky.length}</div>
      </div>
    </div>

    <div class="section">
      <h2>🔴 Flaky Tests
        ${flaky.length === 0 ? '<span class="badge badge-success">All Stable</span>' : 
          flaky.length > 5 ? '<span class="badge badge-warning">Needs Attention</span>' : ''}
      </h2>
      ${
        flaky.length === 0
          ? '<div class="no-data">No flaky tests detected! All tests are stable.</div>'
          : flaky
              .map(
                (test) => `
        <div class="flaky-item">
          <div>
            <strong>${test.name}</strong>
            <div style="font-size: 12px; color: #718096; margin-top: 4px;">
              ${test.total} runs total
            </div>
          </div>
          <span class="flaky-rate ${
            test.rate > 0.3 ? 'rate-high' : test.rate > 0.15 ? 'rate-medium' : 'rate-low'
          }">
            ${(test.rate * 100).toFixed(1)}% failure rate
          </span>
        </div>
      `
              )
              .join('')
      }
    </div>

    <div class="section">
      <h2>🐌 Slowest Tests</h2>
      ${
        slowest.length === 0
          ? '<div class="no-data">No test data available yet.</div>'
          : slowest
              .map(
                (test, index) => `
        <div class="slow-item">
          <div>
            <strong>#${index + 1} ${test.name}</strong>
          </div>
          <span class="duration-badge" style="background: #e2e8f0; color: #2d3748;">
            ${(test.duration / 1000).toFixed(2)}s
          </span>
        </div>
      `
              )
              .join('')
      }
    </div>

    <div class="section">
      <h2>📈 Recent Test Runs (Last 10)</h2>
      ${
        this.metrics.length === 0
          ? '<div class="no-data">No test runs yet. Run your first test!</div>'
          : this.metrics
              .slice(-10)
              .reverse()
              .map(
                (m) => `
        <div class="slow-item">
          <div>
            <strong>${m.testName}</strong>
            <div style="font-size: 12px; color: #718096; margin-top: 4px;">
              ${new Date(m.timestamp).toLocaleString()}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: ${m.status === 'passed' ? '#48bb78' : '#f56565'}; font-weight: 600;">
              ${m.status.toUpperCase()}
            </div>
            <div style="font-size: 12px; color: #718096; margin-top: 2px;">
              ${(m.duration / 1000).toFixed(2)}s
              ${m.retries ? ` • ${m.retries} retries` : ''}
            </div>
          </div>
        </div>
      `
              )
              .join('')
      }
    </div>
  </div>
</body>
</html>`;

    const reportPath = path.join('reports', 'metrics-dashboard.html');
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    fs.writeFileSync(reportPath, html);
    
    logger.info({ path: reportPath }, 'Metrics report generated');
    console.log(`\n📊 Metrics dashboard: ${reportPath}\n`);
  }

  /**
   * Save metrics to disk
   */
  private save() {
    // Save test metrics
    fs.writeFileSync(
      path.join(this.metricsDir, 'test-metrics.json'),
      JSON.stringify(this.metrics, null, 2)
    );

    // Save flakiness data
    const flakinessObj = Object.fromEntries(this.flakinessTracker);
    fs.writeFileSync(
      path.join(this.metricsDir, 'flakiness.json'),
      JSON.stringify(flakinessObj, null, 2)
    );
  }

  /**
   * Load existing data
   */
  private loadData() {
    try {
      // Load metrics
      const metricsFile = path.join(this.metricsDir, 'test-metrics.json');
      if (fs.existsSync(metricsFile)) {
        this.metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      }

      // Load flakiness
      const flakinessFile = path.join(this.metricsDir, 'flakiness.json');
      if (fs.existsSync(flakinessFile)) {
        const data = JSON.parse(fs.readFileSync(flakinessFile, 'utf8'));
        this.flakinessTracker = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.warn('Could not load previous metrics data');
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.flakinessTracker.clear();
    this.save();
    logger.info('All metrics cleared');
  }
}

export const monitor = new Monitor();