import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { AccountOpeningPage } from '@pages/AccountOpeningPage';
import { Config } from '@lib/core/config';
import { TestData } from 'test-data'; // ✅ FIXED: Changed from '@lib/core/data'
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Account Management - Account Opening', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let accountPage: AccountOpeningPage;
  let createdAccounts: string[] = [];

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    accountPage = new AccountOpeningPage(page);

    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);
  });

  test('should open a checking account successfully', async ({ page }) => {
    const tracker = monitor.trackTest('open-checking-account');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Checking');
      await accountPage.setAccountName('My Checking Account');
      await accountPage.setInitialDeposit(100);
      await accountPage.selectFundingSource('Cash');
      await accountPage.agreeToTerms();

      await accountPage.submitApplication();
      await accountPage.waitForConfirmation();

      expect(await accountPage.getConfirmationMessage()).toContain('successfully');

      const accountNumber = await accountPage.getAccountNumber();
      expect(accountNumber).toBeTruthy();
      createdAccounts.push(accountNumber);

      logger.info({ accountNumber }, 'Checking account opened successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should open a savings account successfully', async ({ page }) => {
    const tracker = monitor.trackTest('open-savings-account');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Savings');
      await accountPage.setAccountName('Emergency Fund');
      await accountPage.setInitialDeposit(500);
      await accountPage.selectFundingSource('Transfer from Checking');
      await accountPage.agreeToTerms();

      await accountPage.submitApplication();
      await accountPage.waitForConfirmation();

      const accountNumber = await accountPage.getAccountNumber();
      expect(accountNumber).toBeTruthy();
      createdAccounts.push(accountNumber);

      logger.info({ accountNumber }, 'Savings account opened successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should open a CD account with term selection', async ({ page }) => {
    const tracker = monitor.trackTest('open-cd-account');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('CD');
      await accountPage.setAccountName('6-Month CD');
      await accountPage.setInitialDeposit(5000);
      await accountPage.selectCDTerm('6 months');

      const rate = await accountPage.getCDRate();
      expect(rate).toBeTruthy();
      expect(parseFloat(rate)).toBeGreaterThan(0);

      await accountPage.agreeToTerms();
      await accountPage.submitApplication();
      await accountPage.waitForConfirmation();

      const accountNumber = await accountPage.getAccountNumber();
      expect(accountNumber).toBeTruthy();
      createdAccounts.push(accountNumber);

      logger.info({ accountNumber, rate }, 'CD account opened successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should open joint account with co-owner', async ({ page }) => {
    const tracker = monitor.trackTest('open-joint-account');

    try {
      await accountPage.navigate();

      const jointOwner = TestData.generate.member(); // ✅ Using dynamic generator

      await accountPage.selectAccountType('Checking');
      await accountPage.setAccountName('Joint Checking');
      await accountPage.setInitialDeposit(200);
      
      await accountPage.addJointOwner(
        jointOwner.firstName,
        jointOwner.lastName,
        jointOwner.ssn
      );

      await accountPage.agreeToTerms();
      await accountPage.submitApplication();
      await accountPage.waitForConfirmation();

      const accountNumber = await accountPage.getAccountNumber();
      expect(accountNumber).toBeTruthy();
      createdAccounts.push(accountNumber);

      logger.info({ accountNumber, jointOwner: jointOwner.firstName }, 'Joint account opened');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate minimum deposit requirement', async ({ page }) => {
    const tracker = monitor.trackTest('validate-minimum-deposit');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Checking');
      await accountPage.setInitialDeposit(10);
      await accountPage.agreeToTerms();
      await accountPage.submitApplication();

      expect(await accountPage.hasValidationError('initialDeposit')).toBeTruthy();
      
      const errorMessage = await accountPage.getValidationErrorMessage('initialDeposit');
      expect(errorMessage.toLowerCase()).toContain('minimum');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should require terms acceptance', async ({ page }) => {
    const tracker = monitor.trackTest('require-terms-acceptance');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Savings');
      await accountPage.setInitialDeposit(100);
      await accountPage.submitApplication();

      expect(await accountPage.hasValidationError('terms')).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate through multi-step process', async ({ page }) => {
    const tracker = monitor.trackTest('multi-step-navigation');

    try {
      await accountPage.navigate();

      expect(await accountPage.getCurrentStep()).toBe(1);
      await accountPage.selectAccountType('Checking');
      await accountPage.clickNext();

      expect(await accountPage.getCurrentStep()).toBe(2);
      await accountPage.setInitialDeposit(100);
      await accountPage.clickNext();

      expect(await accountPage.getCurrentStep()).toBe(3);
      await accountPage.clickBack();

      expect(await accountPage.getCurrentStep()).toBe(2);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download account documents after opening', async ({ page }) => {
    const tracker = monitor.trackTest('download-account-documents');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Savings');
      await accountPage.setInitialDeposit(250);
      await accountPage.agreeToTerms();
      await accountPage.submitApplication();
      await accountPage.waitForConfirmation();

      const download = await accountPage.downloadDocuments();
      expect(download.suggestedFilename()).toMatch(/\.(pdf|zip)$/);

      const accountNumber = await accountPage.getAccountNumber();
      createdAccounts.push(accountNumber);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should cancel account opening', async ({ page }) => {
    const tracker = monitor.trackTest('cancel-account-opening');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Checking');
      await accountPage.setInitialDeposit(100);

      await accountPage.cancelApplication();

      await page.waitForTimeout(1000);
      
      expect(await accountPage.hasError()).toBeFalsy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle funding source validation', async ({ page }) => {
    const tracker = monitor.trackTest('funding-source-validation');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Savings');
      await accountPage.setInitialDeposit(1000);
      await accountPage.selectFundingSource('Transfer from Checking');
      await accountPage.agreeToTerms();
      await accountPage.submitApplication();

      await page.waitForTimeout(2000);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should complete full workflow with helper method', async ({ page }) => {
    const tracker = monitor.trackTest('complete-workflow-helper');

    try {
      await accountPage.navigate();

      await accountPage.completeAccountOpening({
        accountType: 'Money Market',
        initialDeposit: 2500,
        fundingSource: 'Cash',
      });

      const accountNumber = await accountPage.getAccountNumber();
      expect(accountNumber).toBeTruthy();
      createdAccounts.push(accountNumber);

      logger.info({ accountNumber }, 'Account opened using helper method');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should verify account appears in dashboard after opening', async ({ page }) => {
    const tracker = monitor.trackTest('verify-account-in-dashboard');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Checking');
      await accountPage.setInitialDeposit(150);
      await accountPage.agreeToTerms();
      await accountPage.submitApplication();
      await accountPage.waitForConfirmation();

      const accountNumber = await accountPage.getAccountNumber();
      createdAccounts.push(accountNumber);

      await accountPage.clickContinue();

      await dashboardPage.waitForDashboardToLoad();
      const accounts = await dashboardPage.getAllAccounts();
      
      const newAccount = accounts.find(a => a.accountNumber.includes(accountNumber));
      expect(newAccount).toBeTruthy();
      expect(newAccount?.balance).toBe(150);

      logger.info({ accountNumber, accounts: accounts.length }, 'Account verified in dashboard');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate SSN format for joint owner', async ({ page }) => {
    const tracker = monitor.trackTest('validate-joint-owner-ssn');

    try {
      await accountPage.navigate();

      await accountPage.selectAccountType('Checking');
      await accountPage.setInitialDeposit(100);
      
      await accountPage.enableJointAccount();
      await accountPage.addJointOwner('John', 'Doe', '123');

      await accountPage.agreeToTerms();
      await accountPage.submitApplication();

      expect(await accountPage.hasValidationError('jointSSN')).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    if (createdAccounts.length > 0) {
      logger.info({ count: createdAccounts.length }, 'Cleaning up test accounts');
      
      for (const accountNumber of createdAccounts) {
        try {
          await bannoApi.delete(`/api/accounts/${accountNumber}`);
        } catch (error) {
          logger.warn({ accountNumber }, 'Failed to cleanup account');
        }
      }
    }
  });
});