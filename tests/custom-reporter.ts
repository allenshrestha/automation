/**
 * tests/custom-reporter.ts
 * 
 * MODERN PLAYWRIGHT REPORTER (2025)
 * 
 * Replaces the try-catch + monitor.trackTest() anti-pattern
 * 
 * Usage in playwright.config.ts:
 * ```
 * reporter: [
 *   ['html'],
 *   ['./tests/custom-reporter.ts']
 * ]
 * ```
 */

import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { logger } from '@lib/core/logger';
import { db } from '@lib/core/db';

class CustomReporter implements Reporter {
  private startTime: number = 0;
  private testResults: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }> = [];

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    logger.info({ 
      workers: config.workers,
      projects: config.projects.length 
    }, 'Test run started');
  }

  onTestBegin(test: TestCase) {
    logger.debug({ 
      test: test.title,
      file: test.location.file 
    }, 'Test started');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const testInfo = {
      name: test.title,
      status: result.status as 'passed' | 'failed' | 'skipped',
      duration: result.duration,
      error: result.error?.message,
    };

    this.testResults.push(testInfo);

    // Log based on status
    if (result.status === 'passed') {
      logger.info({ 
        test: test.title,
        duration: result.duration 
      }, 'Test passed');
    } else if (result.status === 'failed') {
      logger.error({ 
        test: test.title,
        duration: result.duration,
        error: result.error?.message,
        stack: result.error?.stack 
      }, 'Test failed');
    } else {
      logger.warn({ test: test.title }, 'Test skipped');
    }

    // Optional: Store in database
    this.storeTestResult(testInfo).catch(err => {
      logger.warn({ err }, 'Failed to store test result');
    });
  }

  async onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(t => t.status === 'passed').length,
      failed: this.testResults.filter(t => t.status === 'failed').length,
      skipped: this.testResults.filter(t => t.status === 'skipped').length,
      duration,
      status: result.status,
    };

    logger.info(summary, 'Test run completed');

    // Optional: Store summary in database
    await this.storeSummary(summary).catch(err => {
      logger.warn({ err }, 'Failed to store test summary');
    });
  }

  private async storeTestResult(testInfo: {
    name: string;
    status: string;
    duration: number;
    error?: string;
  }) {
    try {
      await db.query(
        `INSERT INTO test_results (name, status, duration, error, timestamp) 
         VALUES ($1, $2, $3, $4, $5)`,
        [testInfo.name, testInfo.status, testInfo.duration, testInfo.error, new Date()]
      );
    } catch (err) {
      // Silent fail - don't break tests
    }
  }

  private async storeSummary(summary: any) {
    try {
      await db.query(
        `INSERT INTO test_summaries (total, passed, failed, skipped, duration, status, timestamp) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          summary.total,
          summary.passed,
          summary.failed,
          summary.skipped,
          summary.duration,
          summary.status,
          new Date(),
        ]
      );
    } catch (err) {
      // Silent fail
    }
  }
}

export default CustomReporter;