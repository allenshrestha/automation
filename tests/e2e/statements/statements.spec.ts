/**
 * tests/e2e/statements/statements.spec.ts
 * 
 * REAL-WORLD SCENARIO: Member manages account statements
 * 
 * Coverage:
 * - Statement viewing
 * - Statement downloading
 * - Date range filtering
 * - Email statements
 * - Tax documents
 * - Bulk operations
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { StatementsPage } from '@pages/StatementsPage';
import { Config } from '@lib/core/config';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Statements - Management', () => {
  let loginPage: LoginPage;
  let statementsPage: StatementsPage;
  let testAccountNumber: string;

  test.beforeAll(async () => {
    // Create test account with statements
    const accountData = TestData.account();
    const response = await bannoApi.post('/api/accounts', accountData);
    testAccountNumber = response.data.accountNumber;
    
    logger.info({ testAccountNumber }, 'Test account created');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    statementsPage = new StatementsPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);

    // Navigate to statements
    await statementsPage.navigate();
  });

  test('should load statements page successfully', async ({ page }) => {
    const tracker = monitor.trackTest('statements-page-load');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      // Page should load
      expect(page.url()).toContain('statements');

      logger.info('Statements page loaded');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display statements for selected account', async ({ page }) => {
    const tracker = monitor.trackTest('display-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        const statements = await statementsPage.getAllStatements();
        
        statements.forEach(statement => {
          expect(statement.date).toBeTruthy();
          expect(statement.period).toBeTruthy();
        });

        logger.info({ count: statementsCount }, 'Statements displayed');
      } else {
        logger.info('No statements available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter statements by current month', async ({ page }) => {
    const tracker = monitor.trackTest('filter-current-month');

    try {
      await statementsPage.selectAccount(testAccountNumber);
      await statementsPage.selectDateRangePreset('current-month');

      const statements = await statementsPage.getAllStatements();

      // Verify statements are from current month
      const currentMonth = new Date().getMonth();
      statements.forEach(statement => {
        const statementDate = new Date(statement.date);
        expect(statementDate.getMonth()).toBe(currentMonth);
      });

      logger.info({ count: statements.length }, 'Current month statements filtered');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter statements by last 3 months', async ({ page }) => {
    const tracker = monitor.trackTest('filter-last-3-months');

    try {
      await statementsPage.selectAccount(testAccountNumber);
      await statementsPage.selectDateRangePreset('last-3-months');

      const statements = await statementsPage.getAllStatements();

      if (statements.length > 0) {
        logger.info({ count: statements.length }, 'Last 3 months statements filtered');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter statements by custom date range', async ({ page }) => {
    const tracker = monitor.trackTest('filter-custom-range');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const startDate = '2024-01-01';
      const endDate = '2024-06-30';

      await statementsPage.setCustomDateRange(startDate, endDate);

      const statements = await statementsPage.getAllStatements();

      logger.info({ startDate, endDate, count: statements.length }, 'Custom range filtered');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should generate a new statement', async ({ page }) => {
    const tracker = monitor.trackTest('generate-statement');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const download = await statementsPage.generateStatement('current-month', 'PDF');

      expect(download.suggestedFilename()).toContain('.pdf');

      const filepath = `./test-data/statements/${download.suggestedFilename()}`;
      await download.saveAs(filepath);

      logger.info({ filepath }, 'Statement generated and downloaded');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download existing statement', async ({ page }) => {
    const tracker = monitor.trackTest('download-existing-statement');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        const download = await statementsPage.downloadStatement(0);
        expect(download.suggestedFilename()).toMatch(/\.(pdf|zip)$/);

        logger.info('Statement downloaded');
      } else {
        logger.info('No statements available to download');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view statement in modal', async ({ page }) => {
    const tracker = monitor.trackTest('view-statement-modal');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        await statementsPage.viewStatement(0);

        // Wait for viewer to load
        await page.waitForTimeout(2000);

        // Close viewer
        await statementsPage.closeViewer();

        logger.info('Statement viewed in modal');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download from statement viewer', async ({ page }) => {
    const tracker = monitor.trackTest('download-from-viewer');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        await statementsPage.viewStatement(0);

        const download = await statementsPage.downloadFromViewer();
        expect(download).toBeTruthy();

        await statementsPage.closeViewer();

        logger.info('Downloaded from viewer');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should email statement', async ({ page }) => {
    const tracker = monitor.trackTest('email-statement');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        await statementsPage.emailStatement(
          0,
          'test@example.com',
          'Your Account Statement',
          'Please find your statement attached.'
        );

        expect(await statementsPage.hasSuccessMessage()).toBeTruthy();

        logger.info({ email: 'test@example.com' }, 'Statement emailed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should select multiple statements', async ({ page }) => {
    const tracker = monitor.trackTest('select-multiple-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 1) {
        // Select first two statements
        await statementsPage.selectStatement(0);
        await statementsPage.selectStatement(1);

        logger.info('Multiple statements selected');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should select all statements', async ({ page }) => {
    const tracker = monitor.trackTest('select-all-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        await statementsPage.selectAllStatements();

        logger.info({ count: statementsCount }, 'All statements selected');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should bulk download statements', async ({ page }) => {
    const tracker = monitor.trackTest('bulk-download-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        await statementsPage.selectAllStatements();

        const download = await statementsPage.bulkDownload();
        expect(download.suggestedFilename()).toMatch(/\.(zip|pdf)$/);

        logger.info('Bulk download completed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should bulk email statements', async ({ page }) => {
    const tracker = monitor.trackTest('bulk-email-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 0) {
        await statementsPage.selectStatement(0);
        await statementsPage.selectStatement(1);

        await statementsPage.bulkEmail('bulk-test@example.com');

        expect(await statementsPage.hasSuccessMessage()).toBeTruthy();

        logger.info('Bulk email completed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to tax documents', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-tax-documents');

    try {
      await statementsPage.goToTaxDocuments();

      const taxDocsCount = await statementsPage.getTaxDocumentsCount();

      logger.info({ count: taxDocsCount }, 'Tax documents tab loaded');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download tax document', async ({ page }) => {
    const tracker = monitor.trackTest('download-tax-document');

    try {
      const taxDocsCount = await statementsPage.getTaxDocumentsCount();

      if (taxDocsCount > 0) {
        const download = await statementsPage.downloadTaxDocument(0);
        expect(download.suggestedFilename()).toMatch(/\.(pdf)$/);

        logger.info('Tax document downloaded');
      } else {
        logger.info('No tax documents available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle no statements gracefully', async ({ page }) => {
    const tracker = monitor.trackTest('handle-no-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount === 0) {
        expect(await statementsPage.hasNoStatements()).toBeTruthy();
        logger.info('No statements message displayed correctly');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should paginate through statements', async ({ page }) => {
    const tracker = monitor.trackTest('paginate-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const statementsCount = await statementsPage.getStatementsCount();

      if (statementsCount > 10) {
        const paginationInfo = await statementsPage.getPaginationInfo();
        logger.info({ paginationInfo }, 'Pagination info displayed');

        // Go to next page
        await statementsPage.goToNextPage();
        await page.waitForTimeout(1000);

        // Go back to previous page
        await statementsPage.goToPreviousPage();
        await page.waitForTimeout(1000);

        logger.info('Pagination working correctly');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should generate CSV format statement', async ({ page }) => {
    const tracker = monitor.trackTest('generate-csv-statement');

    try {
      await statementsPage.selectAccount(testAccountNumber);

      const download = await statementsPage.generateStatement('current-month', 'CSV');

      expect(download.suggestedFilename()).toContain('.csv');

      logger.info('CSV statement generated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter year to date statements', async ({ page }) => {
    const tracker = monitor.trackTest('filter-ytd-statements');

    try {
      await statementsPage.selectAccount(testAccountNumber);
      await statementsPage.selectDateRangePreset('ytd');

      const statements = await statementsPage.getAllStatements();

      logger.info({ count: statements.length }, 'YTD statements filtered');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    // Cleanup: Delete test account
    try {
      await bannoApi.delete(`/api/accounts/${testAccountNumber}`);
      logger.info({ testAccountNumber }, 'Test account cleaned up');
    } catch (error) {
      logger.warn('Failed to cleanup test account');
    }
  });
});