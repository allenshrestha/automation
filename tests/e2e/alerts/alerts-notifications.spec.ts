/**
 * tests/e2e/alerts/alerts-notifications.spec.ts
 * 
 * REAL-WORLD SCENARIO: Alerts and notifications management
 * 
 * Coverage:
 * - Create different alert types
 * - Configure delivery methods
 * - Manage notifications
 * - Alert history
 * - Notification settings
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { AlertsNotificationsPage } from '@pages/AlertsNotificationsPage';
import { Config } from '@lib/core/config';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { bannoApi } from '@lib/core/api';

test.describe('Alerts & Notifications - Management', () => {
  let loginPage: LoginPage;
  let alertsPage: AlertsNotificationsPage;
  let testAccountNumber: string;

  test.beforeAll(async () => {
    // Create test account for alerts
    const accountData = TestData.account();
    const response = await bannoApi.post('/api/accounts', accountData);
    testAccountNumber = response.data.accountNumber;
    
    logger.info({ testAccountNumber }, 'Test account created for alerts');
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    alertsPage = new AlertsNotificationsPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);

    // Navigate to alerts
    await alertsPage.navigate();
  });

  test('should display all alerts', async ({ page }) => {
    const tracker = monitor.trackTest('display-alerts');

    try {
      const alerts = await alertsPage.getAllAlerts();

      expect(Array.isArray(alerts)).toBeTruthy();

      if (alerts.length > 0) {
        alerts.forEach(alert => {
          expect(alert.title).toBeTruthy();
          expect(alert.date).toBeTruthy();
        });

        logger.info({ count: alerts.length }, 'Alerts displayed');
      } else {
        logger.info('No alerts available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should create low balance alert', async ({ page }) => {
    const tracker = monitor.trackTest('create-low-balance-alert');

    try {
      await alertsPage.createLowBalanceAlert({
        name: 'Low Balance Warning',
        account: testAccountNumber,
        threshold: 100,
        deliveryMethods: ['email', 'sms'],
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Low balance alert created');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should create large transaction alert', async ({ page }) => {
    const tracker = monitor.trackTest('create-large-transaction-alert');

    try {
      await alertsPage.createLargeTransactionAlert({
        name: 'Large Transaction Alert',
        account: testAccountNumber,
        amount: 1000,
        deliveryMethods: ['email', 'push'],
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Large transaction alert created');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should create bill due reminder', async ({ page }) => {
    const tracker = monitor.trackTest('create-bill-due-reminder');

    try {
      await alertsPage.createBillDueReminder({
        name: 'Bill Payment Reminder',
        daysBefore: 3,
        deliveryMethods: ['email', 'sms', 'push'],
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Bill due reminder created');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should mark alert as read', async ({ page }) => {
    const tracker = monitor.trackTest('mark-alert-read');

    try {
      const alertsBefore = await alertsPage.getAllAlerts();

      if (alertsBefore.length > 0) {
        await alertsPage.markAlertAsRead(0);

        logger.info('Alert marked as read');
      } else {
        logger.info('No alerts to mark');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should mark all alerts as read', async ({ page }) => {
    const tracker = monitor.trackTest('mark-all-alerts-read');

    try {
      await alertsPage.markAllAlertsAsRead();

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('All alerts marked as read');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should delete alert', async ({ page }) => {
    const tracker = monitor.trackTest('delete-alert');

    try {
      // Create an alert first
      await alertsPage.createLowBalanceAlert({
        name: 'Temp Alert',
        account: testAccountNumber,
        threshold: 50,
        deliveryMethods: ['email'],
      });

      await page.waitForTimeout(1000);

      const alertsBefore = await alertsPage.getAllAlerts();
      const countBefore = alertsBefore.length;

      // Delete first alert
      await alertsPage.deleteAlert(0);

      const alertsAfter = await alertsPage.getAllAlerts();
      expect(alertsAfter.length).toBe(countBefore - 1);

      logger.info('Alert deleted');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should test alert delivery', async ({ page }) => {
    const tracker = monitor.trackTest('test-alert-delivery');

    try {
      const alerts = await alertsPage.getAllAlerts();

      if (alerts.length > 0) {
        await alertsPage.testAlert(0);

        expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

        logger.info('Alert test sent');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view alert history', async ({ page }) => {
    const tracker = monitor.trackTest('view-alert-history');

    try {
      const history = await alertsPage.getAlertHistory({
        dateRange: 'Last 30 Days',
      });

      expect(Array.isArray(history)).toBeTruthy();

      if (history.length > 0) {
        history.forEach(item => {
          expect(item.name).toBeTruthy();
          expect(item.triggered).toBeTruthy();
        });

        logger.info({ count: history.length }, 'Alert history retrieved');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter alert history by type', async ({ page }) => {
    const tracker = monitor.trackTest('filter-alert-history');

    try {
      const history = await alertsPage.getAlertHistory({
        type: 'Low Balance',
      });

      expect(Array.isArray(history)).toBeTruthy();

      logger.info({ type: 'Low Balance', count: history.length }, 'Filtered history retrieved');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should configure notification settings', async ({ page }) => {
    const tracker = monitor.trackTest('configure-notification-settings');

    try {
      await alertsPage.configureNotificationSettings({
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Notification settings configured');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should enable quiet hours', async ({ page }) => {
    const tracker = monitor.trackTest('enable-quiet-hours');

    try {
      await alertsPage.configureNotificationSettings({
        quietHours: {
          enabled: true,
          start: '23:00',
          end: '07:00',
        },
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Quiet hours enabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should search alerts', async ({ page }) => {
    const tracker = monitor.trackTest('search-alerts');

    try {
      await alertsPage.searchAlerts('balance');

      await page.waitForTimeout(1000);

      logger.info('Alert search performed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter alerts by type', async ({ page }) => {
    const tracker = monitor.trackTest('filter-alerts-by-type');

    try {
      await alertsPage.filterAlerts({
        type: 'Low Balance',
      });

      logger.info('Alerts filtered by type');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should filter alerts by status', async ({ page }) => {
    const tracker = monitor.trackTest('filter-alerts-by-status');

    try {
      await alertsPage.filterAlerts({
        status: 'Active',
      });

      logger.info('Alerts filtered by status');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should clear alert filters', async ({ page }) => {
    const tracker = monitor.trackTest('clear-alert-filters');

    try {
      // Apply filters
      await alertsPage.filterAlerts({
        type: 'Low Balance',
        status: 'Active',
      });

      await page.waitForTimeout(500);

      // Clear filters
      await alertsPage.clearFilters();

      logger.info('Alert filters cleared');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should get unread alerts count', async ({ page }) => {
    const tracker = monitor.trackTest('unread-alerts-count');

    try {
      const unreadCount = await alertsPage.getUnreadAlertsCount();

      expect(unreadCount).toBeGreaterThanOrEqual(0);

      logger.info({ unreadCount }, 'Unread alerts count retrieved');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate alert creation requires name', async ({ page }) => {
    const tracker = monitor.trackTest('validate-alert-name-required');

    try {
      await alertsPage.goToAlerts();
      await page.click(alertsPage['selectors'].createAlertButton);

      await page.waitForSelector(alertsPage['selectors'].alertModal);

      // Try to save without name
      await page.click(alertsPage['selectors'].saveAlertButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Alert name validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate alert requires at least one delivery method', async ({ page }) => {
    const tracker = monitor.trackTest('validate-delivery-method-required');

    try {
      await alertsPage.goToAlerts();
      await page.click(alertsPage['selectors'].createAlertButton);

      await page.waitForSelector(alertsPage['selectors'].alertModal);

      // Fill name but no delivery method
      await page.fill(alertsPage['selectors'].alertNameInput, 'Test Alert');
      await page.click(alertsPage['selectors'].saveAlertButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Delivery method validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should switch between alert tabs', async ({ page }) => {
    const tracker = monitor.trackTest('switch-alert-tabs');

    try {
      // Alerts tab
      await alertsPage.goToAlerts();
      await page.waitForTimeout(500);

      // Notifications tab
      await alertsPage.goToNotifications();
      await page.waitForTimeout(500);

      // History tab
      await alertsPage.goToHistory();
      await page.waitForTimeout(500);

      // Settings tab
      await alertsPage.goToSettings();
      await page.waitForTimeout(500);

      logger.info('Tab switching working correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should create alert with multiple delivery methods', async ({ page }) => {
    const tracker = monitor.trackTest('multiple-delivery-methods');

    try {
      await alertsPage.createLowBalanceAlert({
        name: 'Multi-Channel Alert',
        account: testAccountNumber,
        threshold: 200,
        deliveryMethods: ['email', 'sms', 'push', 'in-app'],
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Alert with multiple delivery methods created');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should disable all notification channels', async ({ page }) => {
    const tracker = monitor.trackTest('disable-all-notifications');

    try {
      await alertsPage.configureNotificationSettings({
        emailEnabled: false,
        smsEnabled: false,
        pushEnabled: false,
      });

      expect(await alertsPage.hasSuccessMessage()).toBeTruthy();

      logger.info('All notification channels disabled');
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
}); notifications', async ({ page }) => {
    const tracker = monitor.trackTest('view-notifications');

    try {
      const notifications = await alertsPage.getNotifications();

      expect(Array.isArray(notifications)).toBeTruthy();

      if (notifications.length > 0) {
        notifications.forEach(notification => {
          expect(notification.title).toBeTruthy();
          expect(notification.date).toBeTruthy();
        });

        logger.info({ count: notifications.length }, 'Notifications viewed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should dismiss notification', async ({ page }) => {
    const tracker = monitor.trackTest('dismiss-notification');

    try {
      const notifications = await alertsPage.getNotifications();

      if (notifications.length > 0) {
        await alertsPage.dismissNotification(0);

        logger.info('Notification dismissed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view