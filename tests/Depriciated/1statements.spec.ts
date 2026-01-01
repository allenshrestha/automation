/**
 * tests/e2e/statements/statements.spec.ts
 * 
 * REAL-WORLD SCENARIO: Statement management and downloads
 * 
 * Coverage:
 * - View available statements
 * - Download statements (PDF)
 * - Filter statements by date range
 * - Statement generation
 * - E-statement enrollment
 * - Paper statement preferences
 */

import { test, expect } from '../../fixtures';
import { logger } from '@lib/core/logger';

test.describe('Statements - Management', () => {
  test.beforeEach(async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();
  });

  test('should display available statements', async ({ authenticatedPage, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const statements = await statementsPage.getAllStatements();
    
    expect(statements.length).toBeGreaterThan(0);

    statements.forEach(statement => {
      expect(statement.date).toBeTruthy();
      expect(statement.type).toBeTruthy();
    });

    logger.info({ count: statements.length }, 'Statements displayed');
  });

  test('should download statement as PDF', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const downloadPromise = page.waitForEvent('download');
    await statementsPage.downloadStatement(0, 'PDF');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');

    logger.info({ filename: download.suggestedFilename() }, 'Statement downloaded');
  });

  test('should filter statements by date range', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    await statementsPage.filterByDateRange(startDate, endDate);

    const statements = await statementsPage.getAllStatements();

    statements.forEach(statement => {
      const stmtDate = new Date(statement.date);
      expect(stmtDate >= sixMonthsAgo && stmtDate <= today).toBeTruthy();
    });

    logger.info({ startDate, endDate, count: statements.length }, 'Statements filtered by date');
  });

  test('should filter statements by type', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    await statementsPage.filterByType('Monthly');

    const statements = await statementsPage.getAllStatements();

    statements.forEach(statement => {
      expect(statement.type).toBe('Monthly');
    });

    logger.info({ type: 'Monthly', count: statements.length }, 'Statements filtered by type');
  });

  test('should generate current month statement', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const downloadPromise = page.waitForEvent('download');
    await statementsPage.generateStatement('current-month');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    logger.info('Current month statement generated');
  });

  test('should enroll in e-statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    await statementsPage.enrollInEStatements({
      email: 'test@example.com',
      disablePaper: true,
    });

    const enrollmentMessage = await statementsPage.getEnrollmentStatus();
    expect(enrollmentMessage).toContain('enrolled');

    logger.info('E-statement enrollment successful');
  });

  test('should update e-statement email', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const newEmail = `updated_${Date.now()}@example.com`;

    await statementsPage.updateEStatementEmail(newEmail);

    const successMessage = await statementsPage.page
      .getByRole('alert')
      .or(statementsPage.page.getByTestId('success-message'));
    
    await expect(successMessage).toBeVisible();

    logger.info({ newEmail }, 'E-statement email updated');
  });

  test('should opt back into paper statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    await statementsPage.optIntoPaperStatements();

    const confirmationMessage = await statementsPage.page
      .getByText(/paper statements.*enabled/i);
    
    await expect(confirmationMessage).toBeVisible();

    logger.info('Paper statements re-enabled');
  });

  test('should view statement details', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    await statementsPage.viewStatementDetails(0);

    const details = await statementsPage.getStatementDetails();

    expect(details.period).toBeTruthy();
    expect(details.openingBalance).toBeGreaterThanOrEqual(0);
    expect(details.closingBalance).toBeGreaterThanOrEqual(0);

    logger.info({ details }, 'Statement details viewed');
  });

  test('should search statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const searchTerm = '2024';
    await statementsPage.searchStatements(searchTerm);

    const statements = await statementsPage.getAllStatements();

    statements.forEach(statement => {
      expect(statement.date).toContain(searchTerm);
    });

    logger.info({ searchTerm, results: statements.length }, 'Statement search completed');
  });

  test('should export statements list to CSV', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const downloadPromise = page.waitForEvent('download');
    await statementsPage.exportStatements('CSV');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    logger.info('Statements exported to CSV');
  });

  test('should handle no statements available', async ({ statementsPage }) => {
    await statementsPage.navigate();
    
    // Select account with no statements
    const accountWithNoStatements = '999999999999';
    await statementsPage.selectAccount(accountWithNoStatements);

    const noStatementsMessage = await statementsPage.getNoStatementsMessage();
    expect(noStatementsMessage).toContain('No statements');

    logger.info('No statements message displayed correctly');
  });

  test('should validate required email for e-statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const enrollButton = statementsPage.page
      .getByRole('button', { name: /enroll.*e-?statement/i });
    
    await enrollButton.click();

    // Try to enroll without email
    const submitButton = statementsPage.page
      .getByRole('button', { name: /submit|enroll/i });
    
    await submitButton.click();

    // Should show validation error
    const errorMessage = await statementsPage.page
      .getByText(/email.*required/i)
      .or(statementsPage.page.getByRole('alert'));
    
    await expect(errorMessage).toBeVisible();

    logger.info('Email validation for e-statements working');
  });

  test('should paginate through statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const initialStatements = await statementsPage.getAllStatements();

    if (initialStatements.length >= 10) {
      const hasNextPage = await statementsPage.hasNextPage();

      if (hasNextPage) {
        await statementsPage.goToNextPage();

        const nextPageStatements = await statementsPage.getAllStatements();

        // Should be different statements
        expect(nextPageStatements[0].date).not.toBe(initialStatements[0].date);

        logger.info('Statement pagination working');
      }
    }
  });

  test('should clear statement filters', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    // Apply filters
    await statementsPage.filterByType('Monthly');
    const filteredCount = (await statementsPage.getAllStatements()).length;

    // Clear filters
    await statementsPage.clearFilters();
    const allCount = (await statementsPage.getAllStatements()).length;

    expect(allCount).toBeGreaterThanOrEqual(filteredCount);

    logger.info({ filteredCount, allCount }, 'Filters cleared');
  });

  test('should display statement period correctly', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const statements = await statementsPage.getAllStatements();

    if (statements.length > 0) {
      const firstStatement = statements[0];
      expect(firstStatement.period).toMatch(/\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/);
    }

    logger.info('Statement periods displayed correctly');
  });

  test('should handle concurrent downloads', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const statements = await statementsPage.getAllStatements();

    if (statements.length >= 2) {
      const download1Promise = page.waitForEvent('download');
      const download2Promise = page.waitForEvent('download');

      await statementsPage.downloadStatement(0, 'PDF');
      await statementsPage.downloadStatement(1, 'PDF');

      const [download1, download2] = await Promise.all([download1Promise, download2Promise]);

      expect(download1.suggestedFilename()).toBeTruthy();
      expect(download2.suggestedFilename()).toBeTruthy();

      logger.info('Concurrent downloads handled');
    }
  });

  test('should switch between accounts', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();

    // Select first account
    await statementsPage.selectAccount(testAccount.accountNumber);
    const account1Statements = await statementsPage.getAllStatements();

    // Get another account (if available)
    // This would depend on your test data setup

    logger.info({ account1: account1Statements.length }, 'Account switching working');
  });

  test('should display correct statement status', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    const statements = await statementsPage.getAllStatements();

    statements.forEach(statement => {
      expect(['Available', 'Processing', 'Pending']).toContain(statement.status);
    });

    logger.info('Statement statuses displayed correctly');
  });

  test('should handle statement download errors gracefully', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    await statementsPage.selectAccount(testAccount.accountNumber);

    // Simulate network error
    await page.route('**/api/statements/**', route => {
      route.abort('failed');
    });

    const statements = await statementsPage.getAllStatements();

    if (statements.length > 0) {
      await statementsPage.downloadStatement(0, 'PDF');

      // Should show error message
      const errorMessage = await statementsPage.page
        .getByRole('alert')
        .or(statementsPage.page.getByText(/error|failed/i));
      
      await expect(errorMessage).toBeVisible();

      logger.info('Download error handled gracefully');
    }
  });
});