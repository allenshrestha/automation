 * Scenario: New member opens account and performs first transaction
 * This tests the entire system end-to-end including:
 * - Member creation (API)
 * - Account opening (E2E)
 * - First deposit (E2E)
 * - Transaction verification (API)
 * - Statement generation (E2E)
 */

import { test, expect } from '@playwright/test';
import { bannoApi } from '@lib/core/api';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { db } from '@lib/core/db';
import { LoginPage } from '@pages/LoginPage';
import { MemberSearchPage } from '@pages/MemberSearchPage';
import { MemberDetailsPage } from '@pages/MemberDetailsPage';
import { AccountOpeningPage } from '@pages/AccountOpeningPage';
import { TransactionPage } from '@pages/TransactionPage';
import { memberSchema } from '@schemas/member.schema';
import { accountSchema } from '@schemas/account.schema';
import { transactionSchema } from '@schemas/transaction.schema';

test.describe('Integration - Complete Member Onboarding', () => {
  let newMember: any;
  let memberId: string;
  let accountNumber: string;
  let authToken: string;

  test.beforeAll(async () => {
    // Generate realistic test data
    newMember = TestData.member();
    
    // Get auth token
    const loginResponse = await bannoApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    bannoApi.setAuthToken(authToken);
    
    logger.info({ member: newMember.email }, 'Integration test setup complete');
  });

  test('STEP 1: Create member via API', async () => {
    const tracker = monitor.trackTest('integration-create-member');

    try {
      const response = await bannoApi.post('/api/members', {
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        email: newMember.email,
        phone: newMember.phone,
        ssn: newMember.ssn,
        dateOfBirth: newMember.dateOfBirth,
        address: newMember.address,
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');

      // Validate schema
      bannoApi.validateSchema(response.data, memberSchema);

      memberId = response.data.id;
      
      logger.info({ memberId }, 'Member created successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 2: Verify member searchable in UI', async ({ page }) => {
    const tracker = monitor.trackTest('integration-verify-member-searchable');

    try {
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);

      // Login
      await loginPage.navigateToLogin();
      await loginPage.login(process.env.USERNAME!, process.env.PASSWORD!);

      // Search for new member
      await searchPage.navigate();
      await searchPage.searchByEmail(newMember.email);

      // Verify found
      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBeGreaterThan(0);

      const firstResult = await searchPage.getFirstResult();
      expect(firstResult.email).toBe(newMember.email);
      expect(firstResult.firstName).toBe(newMember.firstName);

      logger.info('Member searchable in UI');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 3: Open checking account for member', async ({ page }) => {
    const tracker = monitor.trackTest('integration-open-account');

    try {
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);
      const detailsPage = new MemberDetailsPage(page);
      const accountPage = new AccountOpeningPage(page);

      // Login
      await loginPage.navigateToLogin();
      await loginPage.login(process.env.USERNAME!, process.env.PASSWORD!);

      // Navigate to member
      await searchPage.navigate();
      await searchPage.searchByEmail(newMember.email);
      await searchPage.clickFirstResult();

      // Open new account
      await detailsPage.waitForLoad();
      await accountPage.navigate();

      await accountPage.selectAccountType('Checking');
      await accountPage.setInitialDeposit(500);
      await accountPage.agreeToTerms();
      await accountPage.submitApplication();

      // Wait for confirmation
      await accountPage.waitForConfirmation();
      
      // Get account number
      accountNumber = await accountPage.getAccountNumber();
      expect(accountNumber).toBeTruthy();

      logger.info({ accountNumber }, 'Account opened successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 4: Verify account via API', async () => {
    const tracker = monitor.trackTest('integration-verify-account-api');

    try {
      const response = await bannoApi.get(`/api/accounts/${accountNumber}`);

      expect(response.status).toBe(200);
      expect(response.data.accountNumber).toBe(accountNumber);
      expect(response.data.accountType).toBe('Checking');
      expect(response.data.balance).toBeGreaterThanOrEqual(500);

      // Validate schema
      bannoApi.validateSchema(response.data, accountSchema);

      logger.info({ account: response.data }, 'Account verified via API');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 5: Make first deposit', async ({ page }) => {
    const tracker = monitor.trackTest('integration-first-deposit');

    try {
      const loginPage = new LoginPage(page);
      const transactionPage = new TransactionPage(page);

      // Login
      await loginPage.navigateToLogin();
      await loginPage.login(process.env.USERNAME!, process.env.PASSWORD!);

      // Navigate to transactions
      await transactionPage.navigate();
      await transactionPage.selectAccount(accountNumber);

      // Make deposit
      await transactionPage.selectTransactionType('Deposit');
      await transactionPage.enterAmount(1000);
      await transactionPage.enterDescription('Initial deposit');
      await transactionPage.submitTransaction();

      // Wait for confirmation
      await transactionPage.waitForConfirmation();
      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ amount: 1000 }, 'Deposit completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 6: Verify transaction via API', async () => {
    const tracker = monitor.trackTest('integration-verify-transaction');

    try {
      // Get transactions for account
      const response = await bannoApi.get(`/api/accounts/${accountNumber}/transactions`);

      expect(response.status).toBe(200);
      expect(response.data.transactions.length).toBeGreaterThan(0);

      // Find deposit transaction
      const depositTransaction = response.data.transactions.find(
        (t: any) => t.type === 'Deposit' && t.amount === 1000
      );

      expect(depositTransaction).toBeTruthy();
      expect(depositTransaction.status).toBe('Posted');

      // Validate schema
      bannoApi.validateSchema(depositTransaction, transactionSchema);

      logger.info({ transaction: depositTransaction }, 'Transaction verified');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 7: Verify final account balance', async () => {
    const tracker = monitor.trackTest('integration-verify-final-balance');

    try {
      const response = await bannoApi.get(`/api/accounts/${accountNumber}`);

      expect(response.status).toBe(200);
      
      // Balance should be 500 (initial) + 1000 (deposit) = 1500
      expect(response.data.balance).toBe(1500);
      expect(response.data.availableBalance).toBe(1500);

      logger.info({ balance: response.data.balance }, 'Final balance verified');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('STEP 8: Generate and download statement', async ({ page }) => {
    const tracker = monitor.trackTest('integration-generate-statement');

    try {
      const loginPage = new LoginPage(page);
      const statementsPage = new StatementsPage(page);

      // Login
      await loginPage.navigateToLogin();
      await loginPage.login(process.env.USERNAME!, process.env.PASSWORD!);

      // Navigate to statements
      await statementsPage.navigate();
      await statementsPage.selectAccount(accountNumber);

      // Generate statement
      const downloadPromise = page.waitForEvent('download');
      await statementsPage.generateStatement('current-month');

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');

      // Save file
      const filepath = `./test-data/statements/${download.suggestedFilename()}`;
      await download.saveAs(filepath);

      expect(require('fs').existsSync(filepath)).toBeTruthy();

      logger.info({ filepath }, 'Statement generated and downloaded');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });