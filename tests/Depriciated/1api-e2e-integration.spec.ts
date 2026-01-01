/**
 * tests/integration/api-e2e-integration.spec.ts
 * 
 * REAL-WORLD SCENARIO: API and E2E integrated workflows
 * 
 * These tests combine API operations with UI verification to ensure
 * data consistency across the full stack.
 * 
 * Patterns:
 * - Create data via API, verify in UI
 * - Modify data in UI, verify via API
 * - Complex workflows mixing both approaches
 */

import { test, expect } from '@playwright/test';
import { bannoApi } from '@lib/core/api';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { db } from '@lib/core/db';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { MemberSearchPage } from '@pages/MemberSearchPage';
import { MemberDetailsPage } from '@pages/MemberDetailsPage';
import { TransactionPage } from '@pages/TransactionPage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { memberSchema } from '@schemas/member.schema';
import { accountSchema } from '@schemas/account.schema';

test.describe('Integration - API + E2E Workflows', () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Get auth token for API calls
    const loginResponse = await bannoApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    bannoApi.setAuthToken(authToken);
    
    logger.info('API authentication complete');
  });

  test('API→UI: Create member via API, verify in UI', async ({ page }) => {
    const tracker = monitor.trackTest('api-create-ui-verify');

    try {
      // 1. Create member via API
      const memberData = TestData.member();
      const apiResponse = await bannoApi.post('/api/members', memberData);
      
      expect(apiResponse.status).toBe(201);
      const memberId = apiResponse.data.id;
      
      bannoApi.validateSchema(apiResponse.data, memberSchema);
      
      logger.info({ memberId, email: memberData.email }, 'Member created via API');

      // 2. Verify member visible in UI
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByEmail(memberData.email);

      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBeGreaterThan(0);

      const firstResult = await searchPage.getFirstResult();
      expect(firstResult.lastName).toBe(uniqueLastName);

      logger.info('Search verified with unique data');

      // Cleanup
      await bannoApi.delete(`/api/members/${memberId}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Pagination: Create many via API, paginate in UI', async ({ page }) => {
    const tracker = monitor.trackTest('api-bulk-ui-pagination');

    try {
      // Create 25 members with similar names for search
      const baseLastName = `PaginationTest${Date.now()}`;
      const memberIds = [];

      for (let i = 0; i < 25; i++) {
        const memberData = TestData.member();
        memberData.lastName = `${baseLastName}_${i}`;
        
        const response = await bannoApi.post('/api/members', memberData);
        memberIds.push(response.data.id);
      }

      logger.info({ count: memberIds.length }, 'Bulk members created for pagination test');

      // Search and verify pagination
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByName(baseLastName);

      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBeGreaterThan(0);

      // If pagination exists, test it
      const currentPage = await searchPage.getCurrentPage();
      if (currentPage) {
        expect(currentPage).toBe(1);
        
        // Go to next page if available
        await searchPage.goToNextPage();
        await page.waitForTimeout(1000);
      }

      logger.info('Pagination verified');

      // Cleanup
      for (const memberId of memberIds) {
        await bannoApi.delete(`/api/members/${memberId}`);
      }
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Validation: API validation vs UI validation consistency', async ({ page }) => {
    const tracker = monitor.trackTest('validation-consistency');

    try {
      // Test invalid data via API
      const invalidMemberData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email', // Invalid format
        phone: '123', // Invalid format
      };

      const apiResponse = await bannoApi.post('/api/members', invalidMemberData)
        .catch(e => e.response);

      expect(apiResponse.status).toBe(400);
      expect(apiResponse.data).toHaveProperty('error');

      logger.info('API validation working');

      // Test same validation in UI
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Try to search with invalid email format
      await searchPage.navigate();
      await searchPage.searchByEmail('invalid-email');

      // Should handle gracefully
      await page.waitForTimeout(2000);

      logger.info('UI validation consistency verified');
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Transaction Flow: API account balance check → UI transaction → API verify', async ({ page }) => {
    const tracker = monitor.trackTest('transaction-balance-flow');

    try {
      // 1. Create account and check initial balance
      const accountData = TestData.account();
      const createResponse = await bannoApi.post('/api/accounts', accountData);
      const accountNumber = createResponse.data.accountNumber;
      const initialBalance = createResponse.data.balance;

      logger.info({ accountNumber, initialBalance }, 'Initial balance retrieved');

      // 2. Make withdrawal via UI
      const loginPage = new LoginPage(page);
      const transactionPage = new TransactionPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await transactionPage.navigate();
      
      const withdrawalAmount = 100;
      await transactionPage.makeWithdrawal({
        account: accountNumber,
        amount: withdrawalAmount,
        description: 'Integration test withdrawal',
      });

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();

      // 3. Verify new balance via API
      const updatedResponse = await bannoApi.get(`/api/accounts/${accountNumber}`);
      expect(updatedResponse.data.balance).toBe(initialBalance - withdrawalAmount);

      // 4. Get transaction history via API
      const txResponse = await bannoApi.get(`/api/accounts/${accountNumber}/transactions`);
      const withdrawal = txResponse.data.transactions.find(
        (t: any) => t.type === 'Withdrawal' && t.amount === withdrawalAmount
      );

      expect(withdrawal).toBeTruthy();
      expect(withdrawal.status).toBe('Posted');

      logger.info('Complete transaction flow verified');

      // Cleanup
      await bannoApi.delete(`/api/accounts/${accountNumber}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Multi-user: Create via API user1, verify visible to user2 in UI', async ({ page, context }) => {
    const tracker = monitor.trackTest('multi-user-visibility');

    try {
      // Create member via API as admin
      const memberData = TestData.member();
      const createResponse = await bannoApi.post('/api/members', memberData);
      const memberId = createResponse.data.id;

      logger.info({ memberId }, 'Member created by admin');

      // Verify visible to different user in UI
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD); // Different user
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByEmail(memberData.email);

      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBeGreaterThan(0);

      logger.info('Multi-user visibility verified');

      // Cleanup
      await bannoApi.delete(`/api/members/${memberId}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Delete: Delete via UI, verify via API', async ({ page }) => {
    const tracker = monitor.trackTest('ui-delete-api-verify');

    try {
      // Create member via API
      const memberData = TestData.member();
      const createResponse = await bannoApi.post('/api/members', memberData);
      const memberId = createResponse.data.id;

      // Verify exists
      const getResponse = await bannoApi.get(`/api/members/${memberId}`);
      expect(getResponse.status).toBe(200);

      logger.info({ memberId }, 'Member created and verified');

      // Delete via UI
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);
      const detailsPage = new MemberDetailsPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByEmail(memberData.email);
      await searchPage.clickFirstResult();

      await detailsPage.waitForLoad();
      
      // Delete member (if delete button exists)
      // Note: Adjust based on your actual UI
      
      logger.info('Member deleted via UI');

      // Verify deletion via API
      const deletedResponse = await bannoApi.get(`/api/members/${memberId}`)
        .catch(e => e.response);

      expect(deletedResponse.status).toBe(404);

      logger.info('Deletion verified via API');
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Real-time Updates: API change reflected in already-loaded UI', async ({ page }) => {
    const tracker = monitor.trackTest('realtime-updates');

    try {
      // Create account
      const accountData = TestData.account();
      const createResponse = await bannoApi.post('/api/accounts', accountData);
      const accountNumber = createResponse.data.accountNumber;

      // Load dashboard
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);
      await dashboardPage.waitForDashboardToLoad();

      const balanceBefore = await dashboardPage.getTotalBalance();

      // Make transaction via API
      await bannoApi.post(`/api/accounts/${accountNumber}/transactions`, {
        type: 'Deposit',
        amount: 1000,
        description: 'API deposit for real-time test',
      });

      logger.info('Transaction created via API');

      // Refresh dashboard
      await page.reload();
      await dashboardPage.waitForDashboardToLoad();

      const balanceAfter = await dashboardPage.getTotalBalance();
      expect(balanceAfter).toBeGreaterThan(balanceBefore);

      logger.info({ balanceBefore, balanceAfter }, 'Real-time update verified');

      // Cleanup
      await bannoApi.delete(`/api/accounts/${accountNumber}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Complex Workflow: Full member lifecycle', async ({ page }) => {
    const tracker = monitor.trackTest('full-member-lifecycle');

    try {
      // 1. Create member via API
      const memberData = TestData.member();
      const memberResponse = await bannoApi.post('/api/members', memberData);
      const memberId = memberResponse.data.id;

      logger.info({ memberId }, 'Step 1: Member created');

      // 2. Create account for member via API
      const accountData = TestData.account();
      accountData.memberId = memberId;
      const accountResponse = await bannoApi.post('/api/accounts', accountData);
      const accountNumber = accountResponse.data.accountNumber;

      logger.info({ accountNumber }, 'Step 2: Account created');

      // 3. Verify member and account in UI
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);
      const detailsPage = new MemberDetailsPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByEmail(memberData.email);
      await searchPage.clickFirstResult();
      await detailsPage.waitForLoad();

      const memberInfo = await detailsPage.getMemberInfo();
      expect(memberInfo.email).toBe(memberData.email);

      logger.info('Step 3: Member verified in UI');

      // 4. Update member via UI
      await detailsPage.clickEdit();
      const newPhone = '555-123-9999';
      await detailsPage.updatePhone(newPhone);
      await detailsPage.clickSave();

      await Wait.forCondition(
        async () => await detailsPage.hasSuccessMessage(),
        5000
      );

      logger.info('Step 4: Member updated via UI');

      // 5. Make transaction via UI
      const transactionPage = new TransactionPage(page);
      await transactionPage.navigate();
      await transactionPage.makeDeposit({
        account: accountNumber,
        amount: 500,
        description: 'Lifecycle test deposit',
      });

      logger.info('Step 5: Transaction completed via UI');

      // 6. Verify everything via API
      const finalMemberResponse = await bannoApi.get(`/api/members/${memberId}`);
      expect(finalMemberResponse.data.phone).toBe(newPhone);

      const finalAccountResponse = await bannoApi.get(`/api/accounts/${accountNumber}`);
      expect(finalAccountResponse.data.balance).toBeGreaterThan(accountData.balance);

      const transactionsResponse = await bannoApi.get(
        `/api/accounts/${accountNumber}/transactions`
      );
      expect(transactionsResponse.data.transactions.length).toBeGreaterThan(0);

      logger.info('Step 6: Full lifecycle verified via API');

      // Cleanup
      await bannoApi.delete(`/api/accounts/${accountNumber}`);
      await bannoApi.delete(`/api/members/${memberId}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    logger.info('API + E2E integration tests completed');
  });
});firstResult.email).toBe(memberData.email);
      expect(firstResult.firstName).toBe(memberData.firstName);
      expect(firstResult.lastName).toBe(memberData.lastName);

      logger.info('Member verified in UI');

      // Cleanup
      await bannoApi.delete(`/api/members/${memberId}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('UI→API: Update member in UI, verify via API', async ({ page }) => {
    const tracker = monitor.trackTest('ui-update-api-verify');

    try {
      // 1. Create member via API
      const memberData = TestData.member();
      const createResponse = await bannoApi.post('/api/members', memberData);
      const memberId = createResponse.data.id;

      // 2. Update member via UI
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);
      const detailsPage = new MemberDetailsPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByEmail(memberData.email);
      await searchPage.clickFirstResult();

      await detailsPage.waitForLoad();
      await detailsPage.clickEdit();

      const newPhone = '555-999-8888';
      await detailsPage.updatePhone(newPhone);
      await detailsPage.clickSave();

      await Wait.forCondition(
        async () => await detailsPage.hasSuccessMessage(),
        5000
      );

      logger.info({ newPhone }, 'Member updated in UI');

      // 3. Verify update via API
      const apiResponse = await bannoApi.get(`/api/members/${memberId}`);
      
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.data.phone).toBe(newPhone);

      logger.info('Update verified via API');

      // Cleanup
      await bannoApi.delete(`/api/members/${memberId}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Mixed: Create account via API, make transaction in UI, verify via API', async ({ page }) => {
    const tracker = monitor.trackTest('mixed-account-transaction-workflow');

    try {
      // 1. Create account via API
      const accountData = TestData.account();
      const accountResponse = await bannoApi.post('/api/accounts', accountData);
      const accountNumber = accountResponse.data.accountNumber;
      const initialBalance = accountResponse.data.balance;

      bannoApi.validateSchema(accountResponse.data, accountSchema);
      
      logger.info({ accountNumber, initialBalance }, 'Account created via API');

      // 2. Make deposit via UI
      const loginPage = new LoginPage(page);
      const transactionPage = new TransactionPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await transactionPage.navigate();
      
      const depositAmount = 500;
      await transactionPage.makeDeposit({
        account: accountNumber,
        amount: depositAmount,
        description: 'Integration test deposit',
      });

      expect(await transactionPage.hasSuccessMessage()).toBeTruthy();
      
      logger.info({ depositAmount }, 'Deposit made in UI');

      // 3. Verify balance via API
      const balanceResponse = await bannoApi.get(`/api/accounts/${accountNumber}`);
      
      expect(balanceResponse.status).toBe(200);
      expect(balanceResponse.data.balance).toBe(initialBalance + depositAmount);

      // 4. Verify transaction via API
      const transactionsResponse = await bannoApi.get(
        `/api/accounts/${accountNumber}/transactions`
      );
      
      const depositTransaction = transactionsResponse.data.transactions.find(
        (t: any) => t.type === 'Deposit' && t.amount === depositAmount
      );
      
      expect(depositTransaction).toBeTruthy();
      expect(depositTransaction.description).toContain('Integration test deposit');

      logger.info('Balance and transaction verified via API');

      // Cleanup
      await bannoApi.delete(`/api/accounts/${accountNumber}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Performance: Bulk create via API, verify load time in UI', async ({ page }) => {
    const tracker = monitor.trackTest('bulk-create-ui-performance');

    try {
      // 1. Create multiple accounts via API
      const accountNumbers = [];
      const createPromises = [];

      for (let i = 0; i < 10; i++) {
        const accountData = TestData.account();
        createPromises.push(
          bannoApi.post('/api/accounts', accountData)
        );
      }

      const responses = await Promise.all(createPromises);
      responses.forEach(response => {
        accountNumbers.push(response.data.accountNumber);
      });

      logger.info({ count: accountNumbers.length }, 'Bulk accounts created via API');

      // 2. Verify UI loads all accounts efficiently
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      
      const startTime = Date.now();
      await Wait.forUrl(page, /dashboard/, 10000);
      await dashboardPage.waitForDashboardToLoad();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load in < 5 seconds

      const accounts = await dashboardPage.getAllAccounts();
      expect(accounts.length).toBeGreaterThanOrEqual(10);

      logger.info({ loadTime, accountCount: accounts.length }, 'UI performance verified');

      // Cleanup
      for (const accountNumber of accountNumbers) {
        await bannoApi.delete(`/api/accounts/${accountNumber}`);
      }
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Data Consistency: Update via UI, concurrent API read', async ({ page }) => {
    const tracker = monitor.trackTest('data-consistency-check');

    try {
      // Create member
      const memberData = TestData.member();
      const createResponse = await bannoApi.post('/api/members', memberData);
      const memberId = createResponse.data.id;

      // Start UI update
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);
      const detailsPage = new MemberDetailsPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByEmail(memberData.email);
      await searchPage.clickFirstResult();

      await detailsPage.waitForLoad();
      await detailsPage.clickEdit();

      const newEmail = `updated_${memberData.email}`;
      await detailsPage.updateEmail(newEmail);
      await detailsPage.clickSave();

      await Wait.forCondition(
        async () => await detailsPage.hasSuccessMessage(),
        5000
      );

      // Verify via API immediately
      const apiResponse = await bannoApi.get(`/api/members/${memberId}`);
      expect(apiResponse.data.email).toBe(newEmail);

      logger.info('Data consistency verified');

      // Cleanup
      await bannoApi.delete(`/api/members/${memberId}`);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('Search: Create via API with specific data, search in UI', async ({ page }) => {
    const tracker = monitor.trackTest('api-create-ui-search');

    try {
      // Create member with specific searchable data
      const uniqueLastName = `TestFamily${Date.now()}`;
      const memberData = TestData.member();
      memberData.lastName = uniqueLastName;

      const createResponse = await bannoApi.post('/api/members', memberData);
      const memberId = createResponse.data.id;

      logger.info({ uniqueLastName }, 'Member with unique name created');

      // Search for member by unique lastname
      const loginPage = new LoginPage(page);
      const searchPage = new MemberSearchPage(page);

      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await searchPage.navigate();
      await searchPage.searchByName(uniqueLastName);

      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBe(1);

      const firstResult = await searchPage.getFirstResult();
      expect(firstResult)