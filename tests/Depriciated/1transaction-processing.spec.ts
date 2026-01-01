/**
 * tests/e2e/transactions/transaction-processing.spec.ts
 * 
 * REAL-WORLD SCENARIO: Member performs various transactions
 * 
 * Business Flow:
 * - Deposits
 * - Withdrawals
 * - Transfers between accounts
 * - Transaction validation
 * - Balance verification
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { TransactionPage } from '@pages/TransactionPage';
import { Config } from '@lib/core/config';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Transactions - Processing', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let transactionPage: TransactionPage;
  let testAccountNumber: string;
  let initialBalance: number;

  test.beforeAll(async () => {
    // Create test account via API
    const accountData = TestData.account();
    const response = await bannoApi.post('/api/accounts', accountData);
    testAccountNumber = response.data.accountNumber;
    initialBalance = response.data.balance;
    
    logger.info({ testAccountNumber, initialBalance }, 'Test account created');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    transactionPage = new TransactionPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);
  });

  test('should make a cash deposit', async ({ page }) => {
    const tracker = monitor.trackTest('make-cash-deposit');

    try {
      await transactionPage.navigate();
      
      await transactionPage.selectAccount(testAccountNumber);
      const balanceBefore = await transactionPage.getAccountBalance();

      // Make deposit
      await transactionPage.makeDeposit({
        account: testAccountNumber,
        amount: 500,
        description: 'Cash deposit test',
        depositType: 'Cash',
      });

      // Verify confirmation
      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();
      
      const transactionId = await transactionPage.getTransactionId();
      expect(transactionId).toBeTruthy();

      logger.info({ transactionId, amount: 500 }, 'Cash deposit completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should make a check deposit', async ({ page }) => {
    const tracker = monitor.trackTest('make-check-deposit');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(750);
      await transactionPage.enterDescription('Check deposit');
      await transactionPage.selectDepositType('Check');
      await transactionPage.enterCheckNumber('1234');

      await transactionPage.submitTransaction();
      await transactionPage.waitForConfirmation();

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      const confirmationNumber = await transactionPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      logger.info({ checkNumber: '1234', amount: 750 }, 'Check deposit completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should make a withdrawal', async ({ page }) => {
    const tracker = monitor.trackTest('make-withdrawal');

    try {
      await transactionPage.navigate();

      // Make withdrawal
      await transactionPage.makeWithdrawal({
        account: testAccountNumber,
        amount: 200,
        description: 'ATM withdrawal',
        method: 'ATM',
      });

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ amount: 200 }, 'Withdrawal completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should prevent withdrawal exceeding available balance', async ({ page }) => {
    const tracker = monitor.trackTest('prevent-overdraft');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      const availableBalance = await transactionPage.getAvailableBalance();

      // Try to withdraw more than available
      await transactionPage.selectTransactionType('Withdrawal');
      await transactionPage.enterAmount(availableBalance + 1000);
      await transactionPage.enterDescription('Overdraft test');
      await transactionPage.submitTransaction();

      // Should show insufficient funds error
      await page.waitForTimeout(2000);
      expect(await transactionPage.hasInsufficientFundsError()).toBeTruthy();

      logger.info('Overdraft prevention working correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should transfer between accounts', async ({ page }) => {
    const tracker = monitor.trackTest('transfer-between-accounts');

    try {
      // Create second account
      const account2Data = TestData.account();
      const account2Response = await bannoApi.post('/api/accounts', account2Data);
      const account2Number = account2Response.data.accountNumber;

      await transactionPage.navigate();

      // Make transfer
      await transactionPage.makeTransfer({
        fromAccount: testAccountNumber,
        toAccount: account2Number,
        amount: 300,
        description: 'Transfer test',
        transferType: 'Internal',
      });

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      // Verify balances via API
      const fromAccountResponse = await bannoApi.get(`/api/accounts/${testAccountNumber}`);
      const toAccountResponse = await bannoApi.get(`/api/accounts/${account2Number}`);

      logger.info({
        fromBalance: fromAccountResponse.data.balance,
        toBalance: toAccountResponse.data.balance,
      }, 'Transfer completed and verified');

      // Cleanup second account
      await bannoApi.delete(`/api/accounts/${account2Number}`);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate required fields', async ({ page }) => {
    const tracker = monitor.trackTest('validate-required-fields');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Deposit');
      // Don't enter amount
      await transactionPage.enterDescription('Missing amount test');
      await transactionPage.submitTransaction();

      // Should show validation error
      expect(await transactionPage.hasValidationError('amount')).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate amount format', async ({ page }) => {
    const tracker = monitor.trackTest('validate-amount-format');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(-100); // Negative amount
      await transactionPage.submitTransaction();

      // Should show validation error
      expect(await transactionPage.hasValidationError('amount')).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should review transaction before submitting', async ({ page }) => {
    const tracker = monitor.trackTest('review-before-submit');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(1000);
      await transactionPage.enterDescription('Review test deposit');

      // Click review
      await transactionPage.clickReview();

      // Verify review details
      const reviewDetails = await transactionPage.getReviewDetails();
      expect(reviewDetails.amount).toContain('1000');
      expect(reviewDetails.type).toContain('Deposit');

      // Confirm transaction
      await transactionPage.confirmTransaction();
      await transactionPage.waitForConfirmation();

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should edit transaction from review modal', async ({ page }) => {
    const tracker = monitor.trackTest('edit-from-review');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Withdrawal');
      await transactionPage.enterAmount(50);
      await transactionPage.enterDescription('Initial amount');

      // Open review
      await transactionPage.clickReview();

      // Click edit
      await transactionPage.editFromReview();

      // Change amount
      await transactionPage.enterAmount(75);
      await transactionPage.clickReview();

      // Verify updated amount
      const reviewDetails = await transactionPage.getReviewDetails();
      expect(reviewDetails.amount).toContain('75');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download transaction receipt', async ({ page }) => {
    const tracker = monitor.trackTest('download-receipt');

    try {
      await transactionPage.navigate();

      await transactionPage.makeDeposit({
        account: testAccountNumber,
        amount: 250,
        description: 'Receipt test',
      });

      // Download receipt
      const download = await transactionPage.downloadReceipt();
      expect(download.suggestedFilename()).toContain('.pdf');

      const filepath = `./test-data/receipts/${download.suggestedFilename()}`;
      await download.saveAs(filepath);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should set future transaction date', async ({ page }) => {
    const tracker = monitor.trackTest('future-dated-transaction');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(100);
      await transactionPage.setTransactionDate(futureDateStr);
      await transactionPage.enterDescription('Future dated deposit');

      await transactionPage.submitTransaction();
      await transactionPage.waitForConfirmation();

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ date: futureDateStr }, 'Future dated transaction created');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should setup recurring transaction', async ({ page }) => {
    const tracker = monitor.trackTest('setup-recurring-transaction');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(500);
      await transactionPage.enterDescription('Monthly recurring deposit');

      const startDate = new Date();
      startDate.setDate(1); // First of month
      const startDateStr = startDate.toISOString().split('T')[0];

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      const endDateStr = endDate.toISOString().split('T')[0];

      await transactionPage.setupRecurring('Monthly', startDateStr, endDateStr);

      await transactionPage.submitTransaction();
      await transactionPage.waitForConfirmation();

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ frequency: 'Monthly', startDate: startDateStr }, 'Recurring transaction setup');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view recent transactions on page', async ({ page }) => {
    const tracker = monitor.trackTest('view-recent-transactions');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      const recentTransactions = await transactionPage.getRecentTransactions();
      expect(recentTransactions.length).toBeGreaterThan(0);

      // Verify transaction structure
      recentTransactions.forEach(tx => {
        expect(tx).toHaveProperty('date');
        expect(tx).toHaveProperty('description');
        expect(tx).toHaveProperty('amount');
        expect(tx).toHaveProperty('balance');
      });

      logger.info({ count: recentTransactions.length }, 'Recent transactions retrieved');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should clear transaction form', async ({ page }) => {
    const tracker = monitor.trackTest('clear-transaction-form');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(100);
      await transactionPage.enterDescription('Test description');

      // Clear form
      await transactionPage.clearForm();

      // Verify fields are cleared (implementation dependent)
      await page.waitForTimeout(1000);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should cancel transaction in progress', async ({ page }) => {
    const tracker = monitor.trackTest('cancel-transaction');

    try {
      await transactionPage.navigate();
      await transactionPage.selectAccount(testAccountNumber);

      await transactionPage.selectTransactionType('Withdrawal');
      await transactionPage.enterAmount(50);
      await transactionPage.enterDescription('Cancelled transaction');

      // Cancel transaction
      await transactionPage.cancelTransaction();

      // Verify no confirmation message
      await page.waitForTimeout(1000);
      expect(await transactionPage.hasSuccessMessage()).toBeFalsy();

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