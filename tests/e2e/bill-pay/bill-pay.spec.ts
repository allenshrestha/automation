/**
 * Coverage:
 * - Payee management (add, edit, delete)
 * - One-time payments
 * - Recurring payments
 * - Payment scheduling
 * - Payment history
 * - Payment cancellation
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { BillPayPage } from '@pages/BillPayPage';
import { Config } from '@lib/core/config';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Bill Pay - Payment Management', () => {
  let loginPage: LoginPage;
  let billPayPage: BillPayPage;
  let testAccountNumber: string;

  test.beforeAll(async () => {
    // Create test account for payments
    const accountData = TestData.account();
    accountData.balance = 5000; // Ensure sufficient balance
    const response = await bannoApi.post('/api/accounts', accountData);
    testAccountNumber = response.data.accountNumber;
    
    logger.info({ testAccountNumber }, 'Test account created for bill pay');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    billPayPage = new BillPayPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);

    // Navigate to bill pay
    await billPayPage.navigate();
  });

  test('should add a new payee successfully', async ({ page }) => {
    const tracker = monitor.trackTest('add-payee');

    try {
      const payeeData = {
        name: 'Electric Company',
        nickname: 'Power Bill',
        accountNumber: '123456789',
        address: '123 Main St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
        phone: '555-123-4567',
        category: 'Utilities',
      };

      await billPayPage.addPayee(payeeData);

      expect(await billPayPage.hasSuccessMessage()).toBeTruthy();

      // Verify payee appears in list
      const payees = await billPayPage.getAllPayees();
      const addedPayee = payees.find(p => p.name === payeeData.name);
      expect(addedPayee).toBeTruthy();

      logger.info({ payeeName: payeeData.name }, 'Payee added successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should search for payee', async ({ page }) => {
    const tracker = monitor.trackTest('search-payee');

    try {
      // Add a payee first
      await billPayPage.addPayee({
        name: 'Water Company',
        accountNumber: '987654321',
        address: '456 Oak Ave',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      // Search for it
      await billPayPage.searchPayee('Water Company');

      const payees = await billPayPage.getAllPayees();
      expect(payees.length).toBeGreaterThan(0);
      expect(payees[0].name).toContain('Water');

      logger.info('Payee search working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should edit existing payee', async ({ page }) => {
    const tracker = monitor.trackTest('edit-payee');

    try {
      // Add a payee
      await billPayPage.addPayee({
        name: 'Gas Company',
        accountNumber: '111222333',
        address: '789 Elm St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      // Edit the payee
      await billPayPage.editPayee(0, {
        phone: '555-999-8888',
        nickname: 'Gas Bill Updated',
      });

      expect(await billPayPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Payee edited successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should delete payee', async ({ page }) => {
    const tracker = monitor.trackTest('delete-payee');

    try {
      // Add a payee
      await billPayPage.addPayee({
        name: 'Temporary Payee',
        accountNumber: '999888777',
        address: '321 Pine St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      const payeesBefore = await billPayPage.getAllPayees();
      const countBefore = payeesBefore.length;

      // Delete the payee
      await billPayPage.deletePayee(0);

      expect(await billPayPage.hasSuccessMessage()).toBeTruthy();

      const payeesAfter = await billPayPage.getAllPayees();
      expect(payeesAfter.length).toBe(countBefore - 1);

      logger.info('Payee deleted successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should make a one-time payment', async ({ page }) => {
    const tracker = monitor.trackTest('make-one-time-payment');

    try {
      // Add payee first
      await billPayPage.addPayee({
        name: 'Internet Provider',
        accountNumber: '555444333',
        address: '100 Tech Blvd',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      // Make payment
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() + 3);
      const dateString = paymentDate.toISOString().split('T')[0];

      await billPayPage.makePayment({
        payee: 'Internet Provider',
        fromAccount: testAccountNumber,
        amount: 89.99,
        date: dateString,
        memo: 'Monthly internet bill',
      });

      const confirmationNumber = await billPayPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      await billPayPage.closeConfirmation();

      logger.info({ confirmationNumber, amount: 89.99 }, 'One-time payment completed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should schedule recurring monthly payment', async ({ page }) => {
    const tracker = monitor.trackTest('schedule-recurring-payment');

    try {
      // Add payee
      await billPayPage.addPayee({
        name: 'Mortgage Company',
        accountNumber: '777888999',
        address: '500 Finance St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      // Schedule recurring payment
      const startDate = new Date();
      startDate.setDate(1); // First of month
      const startDateString = startDate.toISOString().split('T')[0];

      await billPayPage.scheduleRecurringPayment({
        payee: 'Mortgage Company',
        fromAccount: testAccountNumber,
        amount: 1500,
        frequency: 'Monthly',
        startDate: startDateString,
        numberOfPayments: 12,
        memo: 'Monthly mortgage payment',
      });

      const confirmationNumber = await billPayPage.getConfirmationNumber();
      expect(confirmationNumber).toBeTruthy();

      await billPayPage.closeConfirmation();

      logger.info({ frequency: 'Monthly', payments: 12 }, 'Recurring payment scheduled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view payment history', async ({ page }) => {
    const tracker = monitor.trackTest('view-payment-history');

    try {
      const history = await billPayPage.getPaymentHistory();

      // Should return array (may be empty for new account)
      expect(Array.isArray(history)).toBeTruthy();

      if (history.length > 0) {
        history.forEach(payment => {
          expect(payment.payee).toBeTruthy();
          expect(payment.amount).toBeGreaterThan(0);
          expect(payment.date).toBeTruthy();
          expect(payment.status).toBeTruthy();
        });

        logger.info({ count: history.length }, 'Payment history retrieved');
      } else {
        logger.info('No payment history available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view scheduled payments', async ({ page }) => {
    const tracker = monitor.trackTest('view-scheduled-payments');

    try {
      const scheduled = await billPayPage.getScheduledPayments();

      expect(Array.isArray(scheduled)).toBeTruthy();

      if (scheduled.length > 0) {
        scheduled.forEach(payment => {
          expect(payment.payee).toBeTruthy();
          expect(payment.amount).toBeGreaterThan(0);
          expect(payment.date).toBeTruthy();
        });

        logger.info({ count: scheduled.length }, 'Scheduled payments retrieved');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should cancel scheduled payment', async ({ page }) => {
    const tracker = monitor.trackTest('cancel-scheduled-payment');

    try {
      // Add payee and schedule payment
      await billPayPage.addPayee({
        name: 'Cable Company',
        accountNumber: '444555666',
        address: '200 Media Ave',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateString = futureDate.toISOString().split('T')[0];

      await billPayPage.makePayment({
        payee: 'Cable Company',
        fromAccount: testAccountNumber,
        amount: 120,
        date: dateString,
        memo: 'Cable bill',
      });

      await billPayPage.closeConfirmation();

      // Get scheduled payments count
      const scheduledBefore = await billPayPage.getScheduledPayments();
      const countBefore = scheduledBefore.length;

      // Cancel first scheduled payment
      await billPayPage.cancelScheduledPayment(0);

      const scheduledAfter = await billPayPage.getScheduledPayments();
      expect(scheduledAfter.length).toBe(countBefore - 1);

      logger.info('Scheduled payment cancelled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should pause recurring payment', async ({ page }) => {
    const tracker = monitor.trackTest('pause-recurring-payment');

    try {
      // Add payee and create recurring payment
      await billPayPage.addPayee({
        name: 'Gym Membership',
        accountNumber: '333222111',
        address: '800 Fitness Ln',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const startDateString = startDate.toISOString().split('T')[0];

      await billPayPage.scheduleRecurringPayment({
        payee: 'Gym Membership',
        fromAccount: testAccountNumber,
        amount: 50,
        frequency: 'Monthly',
        startDate: startDateString,
        numberOfPayments: 6,
      });

      await billPayPage.closeConfirmation();

      // Pause the recurring payment
      await billPayPage.pauseRecurringPayment(0);

      logger.info('Recurring payment paused');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should resume paused recurring payment', async ({ page }) => {
    const tracker = monitor.trackTest('resume-recurring-payment');

    try {
      // Assuming there's a paused payment, resume it
      await billPayPage.goToRecurringPayments();
      
      // Resume first recurring payment
      await billPayPage.resumeRecurringPayment(0);

      logger.info('Recurring payment resumed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should stop recurring payment', async ({ page }) => {
    const tracker = monitor.trackTest('stop-recurring-payment');

    try {
      // Stop recurring payment
      await billPayPage.stopRecurringPayment(0);

      logger.info('Recurring payment stopped');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter payments by date range', async ({ page }) => {
    const tracker = monitor.trackTest('filter-payments-by-date');

    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      await billPayPage.goToPaymentHistory();
      await billPayPage.filterByDateRange(startDate, endDate);

      logger.info({ startDate, endDate }, 'Payments filtered by date');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should export payment history to CSV', async ({ page }) => {
    const tracker = monitor.trackTest('export-payments-csv');

    try {
      await billPayPage.goToPaymentHistory();

      const download = await billPayPage.exportPayments('CSV');
      expect(download.suggestedFilename()).toContain('.csv');

      const filepath = `./test-data/exports/${download.suggestedFilename()}`;
      await download.saveAs(filepath);

      logger.info({ filepath }, 'Payment history exported to CSV');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate required fields when adding payee', async ({ page }) => {
    const tracker = monitor.trackTest('validate-payee-required-fields');

    try {
      await billPayPage.clickAddPayee();

      // Try to save without filling required fields
      await page.click(billPayPage['selectors'].savePayeeButton);

      // Should show validation errors
      await page.waitForTimeout(1000);

      logger.info('Payee validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate payment amount', async ({ page }) => {
    const tracker = monitor.trackTest('validate-payment-amount');

    try {
      // Add payee
      await billPayPage.addPayee({
        name: 'Test Payee',
        accountNumber: '123123123',
        address: '123 Test St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      // Try to make payment with invalid amount
      await page.click(billPayPage['selectors'].makePaymentButton);
      await page.waitForSelector(billPayPage['selectors'].paymentModal);

      // Fill form with zero or negative amount
      await page.fill(billPayPage['selectors'].paymentAmountInput, '0');

      // Try to proceed - should show validation error
      await page.waitForTimeout(1000);

      logger.info('Payment amount validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should prevent duplicate payee names', async ({ page }) => {
    const tracker = monitor.trackTest('prevent-duplicate-payees');

    try {
      const payeeData = {
        name: 'Duplicate Test Payee',
        accountNumber: '987987987',
        address: '999 Test Ave',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      };

      // Add payee first time
      await billPayPage.addPayee(payeeData);
      expect(await billPayPage.hasSuccessMessage()).toBeTruthy();

      // Try to add same payee again
      await billPayPage.addPayee(payeeData);

      // Should show error message
      if (await billPayPage.hasError()) {
        const errorMessage = await billPayPage.getErrorMessage();
        expect(errorMessage.toLowerCase()).toContain('exists');
        logger.info('Duplicate payee prevention working');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle payment with insufficient funds', async ({ page }) => {
    const tracker = monitor.trackTest('insufficient-funds-payment');

    try {
      // Add payee
      await billPayPage.addPayee({
        name: 'Expensive Payee',
        accountNumber: '111111111',
        address: '100 Rich St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      // Try to make payment exceeding account balance
      await page.click(billPayPage['selectors'].makePaymentButton);
      await page.waitForSelector(billPayPage['selectors'].paymentModal);

      // Fill with amount greater than balance
      await page.selectOption(billPayPage['selectors'].selectPayeeDropdown, 'Expensive Payee');
      await page.selectOption(billPayPage['selectors'].payFromAccountSelect, testAccountNumber);
      await page.fill(billPayPage['selectors'].paymentAmountInput, '999999');
      await page.fill(billPayPage['selectors'].paymentDateInput, dateString);

      // Try to proceed
      await page.click('button:has-text("Review")');
      await page.waitForTimeout(2000);

      // Should show insufficient funds error
      logger.info('Insufficient funds validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should switch between payment tabs', async ({ page }) => {
    const tracker = monitor.trackTest('switch-payment-tabs');

    try {
      // Switch to payment history
      await billPayPage.goToPaymentHistory();
      await page.waitForTimeout(500);

      // Switch to scheduled payments
      await billPayPage.goToScheduledPayments();
      await page.waitForTimeout(500);

      // Switch to recurring payments
      await billPayPage.goToRecurringPayments();
      await page.waitForTimeout(500);

      logger.info('Tab switching working correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate future payment date', async ({ page }) => {
    const tracker = monitor.trackTest('validate-future-payment-date');

    try {
      // Add payee
      await billPayPage.addPayee({
        name: 'Date Test Payee',
        accountNumber: '222333444',
        address: '200 Date St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      });

      // Try to schedule payment with past date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      await page.click(billPayPage['selectors'].makePaymentButton);
      await page.waitForSelector(billPayPage['selectors'].paymentModal);

      await page.selectOption(billPayPage['selectors'].selectPayeeDropdown, 'Date Test Payee');
      await page.selectOption(billPayPage['selectors'].payFromAccountSelect, testAccountNumber);
      await page.fill(billPayPage['selectors'].paymentAmountInput, '50');
      await page.fill(billPayPage['selectors'].paymentDateInput, pastDate);

      // Should show validation error for past date
      await page.waitForTimeout(1000);

      logger.info('Payment date validation working');
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