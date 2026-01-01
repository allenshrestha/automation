/**
 * Coverage:
 * - Account information display
 * - Transaction history viewing
 * - Transaction filtering and export
 * - Account settings management
 * - Document management
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { AccountDetailsPage } from '@pages/AccountDetailsPage';
import { Config } from '@lib/core/config';
import { TestData } from 'test-data'; 
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Account Management - Account Details', () => {
  let loginPage: LoginPage;
  let accountDetailsPage: AccountDetailsPage;
  let testAccountNumber: string;

  test.beforeAll(async () => {
    // Create test account with transactions using TestData.generate
    const accountData = TestData.generate.account();
    const response = await bannoApi.post('/api/accounts', accountData);
    testAccountNumber = response.data.accountNumber;

    // Create some transactions
    await bannoApi.post(`/api/accounts/${testAccountNumber}/transactions`, {
      type: 'Deposit',
      amount: 1000,
      description: 'Initial deposit',
    });

    await bannoApi.post(`/api/accounts/${testAccountNumber}/transactions`, {
      type: 'Withdrawal',
      amount: 200,
      description: 'ATM withdrawal',
    });

    logger.info({ testAccountNumber }, 'Test account created with transactions');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    accountDetailsPage = new AccountDetailsPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);
  });

  test('should display account information correctly', async ({ page }) => {
    const tracker = monitor.trackTest('display-account-info');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const accountInfo = await accountDetailsPage.getAccountInfo();

      expect(accountInfo.accountNumber).toBeTruthy();
      expect(accountInfo.accountType).toBeTruthy();
      expect(accountInfo.currentBalance).toBeGreaterThanOrEqual(0);
      expect(accountInfo.availableBalance).toBeGreaterThanOrEqual(0);

      logger.info({ accountInfo }, 'Account information displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display current and available balances', async ({ page }) => {
    const tracker = monitor.trackTest('display-balances');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const currentBalance = await accountDetailsPage.getCurrentBalance();
      const availableBalance = await accountDetailsPage.getAvailableBalance();

      expect(currentBalance).toBeGreaterThanOrEqual(0);
      expect(availableBalance).toBeGreaterThanOrEqual(0);
      expect(availableBalance).toBeLessThanOrEqual(currentBalance);

      logger.info({ currentBalance, availableBalance }, 'Balances displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to make deposit', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-make-deposit');

    try {
      await accountDetailsPage.navigate(testAccountNumber);
      await accountDetailsPage.makeDeposit();

      await Wait.forUrl(page, /deposit|transaction/, 5000);

      logger.info('Navigated to make deposit');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to make withdrawal', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-make-withdrawal');

    try {
      await accountDetailsPage.navigate(testAccountNumber);
      await accountDetailsPage.makeWithdrawal();

      await Wait.forUrl(page, /withdrawal|transaction/, 5000);

      logger.info('Navigated to make withdrawal');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to transfer funds', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-transfer-funds');

    try {
      await accountDetailsPage.navigate(testAccountNumber);
      await accountDetailsPage.transferFunds();

      await Wait.forUrl(page, /transfer/, 5000);

      logger.info('Navigated to transfer funds');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display transaction history', async ({ page }) => {
    const tracker = monitor.trackTest('display-transaction-history');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const transactions = await accountDetailsPage.getAllTransactions();

      expect(transactions.length).toBeGreaterThan(0);

      transactions.forEach(tx => {
        expect(tx.date).toBeTruthy();
        expect(tx.description).toBeTruthy();
        expect(tx).toHaveProperty('amount');
        expect(tx).toHaveProperty('balance');
      });

      logger.info({ count: transactions.length }, 'Transaction history displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter transactions by date range', async ({ page }) => {
    const tracker = monitor.trackTest('filter-transactions-by-date');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      await accountDetailsPage.filterTransactionsByDate(startDate, endDate);

      const transactions = await accountDetailsPage.getAllTransactions();

      transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        expect(txDate >= thirtyDaysAgo && txDate <= today).toBeTruthy();
      });

      logger.info({ startDate, endDate, count: transactions.length }, 'Transactions filtered by date');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter transactions by type', async ({ page }) => {
    const tracker = monitor.trackTest('filter-transactions-by-type');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      await accountDetailsPage.filterTransactionsByType('Deposit');

      const transactions = await accountDetailsPage.getAllTransactions();

      logger.info({ count: transactions.length }, 'Transactions filtered by type');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter transactions by amount range', async ({ page }) => {
    const tracker = monitor.trackTest('filter-transactions-by-amount');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const minAmount = 100;
      const maxAmount = 1000;

      await accountDetailsPage.filterTransactionsByAmount(minAmount, maxAmount);

      const transactions = await accountDetailsPage.getAllTransactions();

      transactions.forEach(tx => {
        const absAmount = Math.abs(tx.amount);
        expect(absAmount >= minAmount && absAmount <= maxAmount).toBeTruthy();
      });

      logger.info({ minAmount, maxAmount, count: transactions.length }, 'Transactions filtered by amount');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should clear transaction filters', async ({ page }) => {
    const tracker = monitor.trackTest('clear-transaction-filters');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      await accountDetailsPage.filterTransactionsByType('Deposit');
      const filteredCount = (await accountDetailsPage.getAllTransactions()).length;

      await accountDetailsPage.clearFilters();
      const allCount = (await accountDetailsPage.getAllTransactions()).length;

      expect(allCount).toBeGreaterThanOrEqual(filteredCount);

      logger.info({ filteredCount, allCount }, 'Filters cleared');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should export transactions to CSV', async ({ page }) => {
    const tracker = monitor.trackTest('export-transactions-csv');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const download = await accountDetailsPage.exportTransactions('CSV');

      expect(download.suggestedFilename()).toContain('.csv');

      const filepath = `./test-data/exports/${download.suggestedFilename()}`;
      await download.saveAs(filepath);

      logger.info({ filepath }, 'Transactions exported to CSV');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should export transactions to PDF', async ({ page }) => {
    const tracker = monitor.trackTest('export-transactions-pdf');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const download = await accountDetailsPage.exportTransactions('PDF');

      expect(download.suggestedFilename()).toContain('.pdf');

      logger.info('Transactions exported to PDF');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display routing number in details tab', async ({ page }) => {
    const tracker = monitor.trackTest('display-routing-number');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const routingNumber = await accountDetailsPage.getRoutingNumber();

      expect(routingNumber).toBeTruthy();
      expect(routingNumber).toMatch(/^\d{9}$/);

      logger.info({ routingNumber }, 'Routing number displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display account owner', async ({ page }) => {
    const tracker = monitor.trackTest('display-account-owner');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const owner = await accountDetailsPage.getAccountOwner();

      expect(owner).toBeTruthy();

      logger.info({ owner }, 'Account owner displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should update account nickname', async ({ page }) => {
    const tracker = monitor.trackTest('update-account-nickname');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const newNickname = 'My Primary Checking';
      await accountDetailsPage.updateNickname(newNickname);

      expect(await accountDetailsPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ newNickname }, 'Account nickname updated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should enable low balance alert', async ({ page }) => {
    const tracker = monitor.trackTest('enable-low-balance-alert');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const threshold = 100;
      await accountDetailsPage.enableLowBalanceAlert(threshold);

      expect(await accountDetailsPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ threshold }, 'Low balance alert enabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should enable large transaction alert', async ({ page }) => {
    const tracker = monitor.trackTest('enable-large-transaction-alert');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const amount = 1000;
      await accountDetailsPage.enableLargeTransactionAlert(amount);

      expect(await accountDetailsPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ amount }, 'Large transaction alert enabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display documents if available', async ({ page }) => {
    const tracker = monitor.trackTest('display-documents');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const documents = await accountDetailsPage.getDocuments();

      if (documents.length > 0) {
        documents.forEach(doc => {
          expect(doc.name).toBeTruthy();
          expect(doc.date).toBeTruthy();
        });

        logger.info({ count: documents.length }, 'Documents displayed');
      } else {
        logger.info('No documents available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download document', async ({ page }) => {
    const tracker = monitor.trackTest('download-document');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const documents = await accountDetailsPage.getDocuments();

      if (documents.length > 0) {
        const download = await accountDetailsPage.downloadDocument(0);
        expect(download).toBeTruthy();

        logger.info('Document downloaded');
      } else {
        logger.info('No documents to download');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should paginate through transactions', async ({ page }) => {
    const tracker = monitor.trackTest('paginate-transactions');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      const initialTransactions = await accountDetailsPage.getAllTransactions();

      if (initialTransactions.length >= 10) {
        await accountDetailsPage.goToNextTransactionsPage();

        const nextPageTransactions = await accountDetailsPage.getAllTransactions();

        expect(nextPageTransactions[0].date).not.toBe(initialTransactions[0].date);

        await accountDetailsPage.goToPreviousTransactionsPage();

        logger.info('Transaction pagination working');
      } else {
        logger.info('Not enough transactions to test pagination');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to statements', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-to-statements');

    try {
      await accountDetailsPage.navigate(testAccountNumber);
      await accountDetailsPage.viewStatements();

      await Wait.forUrl(page, /statements/, 5000);

      logger.info('Navigated to statements');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle account closure request', async ({ page }) => {
    const tracker = monitor.trackTest('request-account-closure');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      await accountDetailsPage.closeAccount('No longer needed');

      await page.waitForTimeout(2000);

      logger.info('Account closure requested');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    const tracker = monitor.trackTest('switch-tabs');

    try {
      await accountDetailsPage.navigate(testAccountNumber);

      await accountDetailsPage.goToTransactionsTab();
      await page.waitForTimeout(500);

      await accountDetailsPage.goToDetailsTab();
      await page.waitForTimeout(500);

      await accountDetailsPage.goToDocumentsTab();
      await page.waitForTimeout(500);

      await accountDetailsPage.goToSettingsTab();
      await page.waitForTimeout(500);

      logger.info('Tab switching working correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    try {
      await bannoApi.delete(`/api/accounts/${testAccountNumber}`);
      logger.info({ testAccountNumber }, 'Test account cleaned up');
    } catch (error) {
      logger.warn('Failed to cleanup test account');
    }
  });
});