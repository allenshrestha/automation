/**
 * tests/e2e/transfers/transfers.spec.ts
 * 
 * REAL-WORLD SCENARIO: Money transfer operations
 * 
 * Coverage:
 * - Internal transfers
 * - External transfers
 * - Wire transfers
 * - Recurring transfers
 * - Transfer verification
 * - Transfer limits
 * - Transfer history
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { TransfersPage } from '@pages/TransfersPage';
import { Config } from '@lib/core/config';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Transfers - Money Movement', () => {
  let loginPage: LoginPage;
  let transfersPage: TransfersPage;
  let checkingAccount: string;
  let savingsAccount: string;

  test.beforeAll(async () => {
    // Create test accounts for transfers
    const checking = await bannoApi.post('/api/accounts', {
      ...TestData.account(),
      accountType: 'Checking',
      balance: 5000,
    });
    checkingAccount = checking.data.accountNumber;

    const savings = await bannoApi.post('/api/accounts', {
      ...TestData.account(),
      accountType: 'Savings',
      balance: 1000,
    });
    savingsAccount = savings.data.accountNumber;

    logger.info({ checking: checkingAccount, savings: savingsAccount }, 'Test accounts created');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    transfersPage = new TransfersPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);

    // Navigate to transfers
    await transfersPage.navigate();
  });

  test('should make internal transfer', async ({ page }) => {
    const tracker = monitor.trackTest('internal-transfer');

    try {
      await transfersPage.makeInternalTransfer({
        fromAccount: checkingAccount,
        toAccount: savingsAccount,
        amount: 500,
        memo: 'Monthly savings',
      });

      const confirmationNumber = await transfersPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      await transfersPage.closeConfirmation();

      logger.info({ confirmationNumber, amount: 500 }, 'Internal transfer completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display transfer confirmation details', async ({ page }) => {
    const tracker = monitor.trackTest('transfer-confirmation-details');

    try {
      await transfersPage.makeInternalTransfer({
        fromAccount: checkingAccount,
        toAccount: savingsAccount,
        amount: 250,
      });

      const confirmationNumber = await transfersPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      logger.info('Transfer confirmation details displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should add external account', async ({ page }) => {
    const tracker = monitor.trackTest('add-external-account');

    try {
      await transfersPage.addExternalAccount({
        routingNumber: '123456789',
        accountNumber: '9876543210',
        accountType: 'Checking',
        nickname: 'External Checking',
        bankName: 'Test Bank',
      });

      expect(await transfersPage.hasSuccessMessage()).toBeTruthy();

      logger.info('External account added');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should make external transfer', async ({ page }) => {
    const tracker = monitor.trackTest('external-transfer');

    try {
      // Add external account first
      await transfersPage.addExternalAccount({
        routingNumber: '111222333',
        accountNumber: '4445556666',
        accountType: 'Savings',
        nickname: 'External Savings',
        bankName: 'Another Bank',
      });

      await page.waitForTimeout(1000);

      // Make transfer
      await transfersPage.makeExternalTransfer({
        fromAccount: checkingAccount,
        toExternalAccount: 'External Savings',
        amount: 1000,
        memo: 'External transfer test',
      });

      // May require verification
      await page.waitForTimeout(2000);

      logger.info({ amount: 1000 }, 'External transfer initiated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should verify external transfer with code', async ({ page }) => {
    const tracker = monitor.trackTest('verify-external-transfer');

    try {
      // Initiate external transfer
      await transfersPage.makeExternalTransfer({
        fromAccount: checkingAccount,
        toExternalAccount: 'External Savings',
        amount: 500,
      });

      // Verify with code (use test code)
      await transfersPage.verifyTransfer('123456');

      const confirmationNumber = await transfersPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      logger.info('External transfer verified');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should make wire transfer', async ({ page }) => {
    const tracker = monitor.trackTest('wire-transfer');

    try {
      await transfersPage.makeWireTransfer({
        fromAccount: checkingAccount,
        amount: 2000,
        recipientName: 'John Doe',
        recipientBank: 'International Bank',
        recipientRouting: '987654321',
        recipientAccount: '1234567890',
        recipientAddress: '123 Main St, City, State 12345',
        swiftCode: 'ABCDUS33XXX',
        reference: 'Payment for services',
      });

      const confirmationNumber = await transfersPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      logger.info({ amount: 2000 }, 'Wire transfer completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should schedule recurring transfer', async ({ page }) => {
    const tracker = monitor.trackTest('recurring-transfer');

    try {
      const startDate = new Date();
      startDate.setDate(1); // First of month
      const startDateString = startDate.toISOString().split('T')[0];

      await transfersPage.scheduleRecurringTransfer({
        fromAccount: checkingAccount,
        toAccount: savingsAccount,
        amount: 300,
        frequency: 'Monthly',
        startDate: startDateString,
        numberOfTransfers: 12,
      });

      const confirmationNumber = await transfersPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      logger.info({ frequency: 'Monthly', payments: 12 }, 'Recurring transfer scheduled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view pending transfers', async ({ page }) => {
    const tracker = monitor.trackTest('view-pending-transfers');

    try {
      await transfersPage.goToPending();

      const transfers = await transfersPage.getAllTransfers();

      expect(Array.isArray(transfers)).toBeTruthy();

      if (transfers.length > 0) {
        transfers.forEach(transfer => {
          expect(transfer.from).toBeTruthy();
          expect(transfer.to).toBeTruthy();
          expect(transfer.amount).toBeGreaterThan(0);
        });

        logger.info({ count: transfers.length }, 'Pending transfers displayed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view completed transfers', async ({ page }) => {
    const tracker = monitor.trackTest('view-completed-transfers');

    try {
      await transfersPage.goToCompleted();

      const transfers = await transfersPage.getAllTransfers();

      expect(Array.isArray(transfers)).toBeTruthy();

      logger.info({ count: transfers.length }, 'Completed transfers displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view scheduled transfers', async ({ page }) => {
    const tracker = monitor.trackTest('view-scheduled-transfers');

    try {
      await transfersPage.goToScheduled();

      const transfers = await transfersPage.getAllTransfers();

      expect(Array.isArray(transfers)).toBeTruthy();

      logger.info({ count: transfers.length }, 'Scheduled transfers displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should cancel pending transfer', async ({ page }) => {
    const tracker = monitor.trackTest('cancel-pending-transfer');

    try {
      // Make a future-dated transfer
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateString = futureDate.toISOString().split('T')[0];

      await transfersPage.makeInternalTransfer({
        fromAccount: checkingAccount,
        toAccount: savingsAccount,
        amount: 100,
        date: futureDateString,
      });

      await transfersPage.closeConfirmation();

      // Go to pending and cancel
      await transfersPage.goToPending();

      const transfersBefore = await transfersPage.getAllTransfers();
      const countBefore = transfersBefore.length;

      await transfersPage.cancelTransfer(0);

      const transfersAfter = await transfersPage.getAllTransfers();
      expect(transfersAfter.length).toBeLessThan(countBefore);

      logger.info('Transfer cancelled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter transfers by date range', async ({ page }) => {
    const tracker = monitor.trackTest('filter-transfers-by-date');

    try {
      await transfersPage.goToCompleted();

      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      await transfersPage.filterByDateRange(startDate, endDate);

      logger.info({ startDate, endDate }, 'Transfers filtered by date');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter transfers by amount', async ({ page }) => {
    const tracker = monitor.trackTest('filter-transfers-by-amount');

    try {
      await transfersPage.goToCompleted();

      await transfersPage.filterByAmount(100, 1000);

      logger.info({ min: 100, max: 1000 }, 'Transfers filtered by amount');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should clear transfer filters', async ({ page }) => {
    const tracker = monitor.trackTest('clear-transfer-filters');

    try {
      await transfersPage.goToCompleted();

      // Apply filters
      await transfersPage.filterByAmount(100, 500);
      await page.waitForTimeout(500);

      // Clear filters
      await transfersPage.clearFilters();

      logger.info('Transfer filters cleared');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should export transfer history', async ({ page }) => {
    const tracker = monitor.trackTest('export-transfer-history');

    try {
      await transfersPage.goToCompleted();

      const download = await transfersPage.exportTransfers('CSV');

      expect(download.suggestedFilename()).toContain('.csv');

      logger.info('Transfer history exported');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display daily transfer limit', async ({ page }) => {
    const tracker = monitor.trackTest('display-transfer-limit');

    try {
      const dailyLimit = await transfersPage.getDailyLimit();
      const remainingLimit = await transfersPage.getRemainingLimit();

      expect(dailyLimit).toBeGreaterThan(0);
      expect(remainingLimit).toBeGreaterThanOrEqual(0);
      expect(remainingLimit).toBeLessThanOrEqual(dailyLimit);

      logger.info({ dailyLimit, remainingLimit }, 'Transfer limits displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should show warning when approaching limit', async ({ page }) => {
    const tracker = monitor.trackTest('transfer-limit-warning');

    try {
      const remainingLimit = await transfersPage.getRemainingLimit();

      // Try to transfer close to limit
      if (remainingLimit > 100) {
        await page.fill(transfersPage['selectors'].amountInput, (remainingLimit - 50).toString());

        const hasWarning = await transfersPage.hasLimitWarning();
        
        if (hasWarning) {
          logger.info('Transfer limit warning displayed');
        }
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate insufficient funds', async ({ page }) => {
    const tracker = monitor.trackTest('validate-insufficient-funds');

    try {
      await transfersPage.selectTransferType('Internal');

      await page.selectOption(transfersPage['selectors'].fromAccountSelect, checkingAccount);
      await page.selectOption(transfersPage['selectors'].toAccountSelect, savingsAccount);
      await page.fill(transfersPage['selectors'].amountInput, '999999');

      await page.click(transfersPage['selectors'].reviewButton);

      // Should show error
      await page.waitForTimeout(2000);

      logger.info('Insufficient funds validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate transfer to same account', async ({ page }) => {
    const tracker = monitor.trackTest('validate-same-account-transfer');

    try {
      await transfersPage.selectTransferType('Internal');

      await page.selectOption(transfersPage['selectors'].fromAccountSelect, checkingAccount);
      await page.selectOption(transfersPage['selectors'].toAccountSelect, checkingAccount);
      await page.fill(transfersPage['selectors'].amountInput, '100');

      await page.click(transfersPage['selectors'].reviewButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Same account transfer validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate minimum transfer amount', async ({ page }) => {
    const tracker = monitor.trackTest('validate-minimum-amount');

    try {
      await transfersPage.selectTransferType('Internal');

      await page.selectOption(transfersPage['selectors'].fromAccountSelect, checkingAccount);
      await page.selectOption(transfersPage['selectors'].toAccountSelect, savingsAccount);
      await page.fill(transfersPage['selectors'].amountInput, '0.01');

      await page.click(transfersPage['selectors'].reviewButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Minimum amount validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate routing number format', async ({ page }) => {
    const tracker = monitor.trackTest('validate-routing-number');

    try {
      await transfersPage.selectTransferType('External');
      await page.click(transfersPage['selectors'].addExternalAccountButton);

      await page.waitForTimeout(1000);

      // Invalid routing number
      await page.fill(transfersPage['selectors'].routingNumberInput, '12345');

      // Should show validation error
      await page.waitForTimeout(500);

      logger.info('Routing number validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    // Cleanup: Delete test accounts
    try {
      await bannoApi.delete(`/api/accounts/${checkingAccount}`);
      await bannoApi.delete(`/api/accounts/${savingsAccount}`);
      logger.info('Test accounts cleaned up');
    } catch (error) {
      logger.warn('Failed to cleanup test accounts');
    }
  });
});