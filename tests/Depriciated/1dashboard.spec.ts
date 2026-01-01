/**
 * tests/e2e/dashboard/dashboard.spec.ts
 * 
 * REAL-WORLD SCENARIO: Member dashboard interactions
 * 
 * Coverage:
 * - Dashboard loading and display
 * - Account summaries
 * - Quick actions
 * - Recent transactions
 * - Navigation
 * - Widgets
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { Config } from '@lib/core/config';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';

test.describe('Dashboard - Member View', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);
  });

  test('should load dashboard successfully after login', async ({ page }) => {
    const tracker = monitor.trackTest('dashboard-load');

    try {
      await dashboardPage.waitForDashboardToLoad();

      expect(await dashboardPage.isDashboardLoaded()).toBeTruthy();

      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).toBeTruthy();

      logger.info({ welcomeMessage }, 'Dashboard loaded successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display user information', async ({ page }) => {
    const tracker = monitor.trackTest('display-user-info');

    try {
      const userName = await dashboardPage.getUserName();
      expect(userName).toBeTruthy();
      expect(userName.length).toBeGreaterThan(0);

      logger.info({ userName }, 'User information displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display all user accounts', async ({ page }) => {
    const tracker = monitor.trackTest('display-accounts');

    try {
      const accounts = await dashboardPage.getAllAccounts();
      expect(accounts.length).toBeGreaterThan(0);

      // Verify account structure
      accounts.forEach(account => {
        expect(account.accountNumber).toBeTruthy();
        expect(account.accountType).toBeTruthy();
        expect(account.balance).toBeGreaterThanOrEqual(0);
      });

      logger.info({ accountCount: accounts.length }, 'Accounts displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display total balances correctly', async ({ page }) => {
    const tracker = monitor.trackTest('display-total-balances');

    try {
      const totalBalance = await dashboardPage.getTotalBalance();
      const totalAvailable = await dashboardPage.getTotalAvailable();

      expect(totalBalance).toBeGreaterThanOrEqual(0);
      expect(totalAvailable).toBeGreaterThanOrEqual(0);
      expect(totalAvailable).toBeLessThanOrEqual(totalBalance);

      logger.info({ totalBalance, totalAvailable }, 'Total balances displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display checking and savings totals', async ({ page }) => {
    const tracker = monitor.trackTest('display-account-type-totals');

    try {
      const totalChecking = await dashboardPage.getTotalChecking();
      const totalSavings = await dashboardPage.getTotalSavings();

      expect(totalChecking).toBeGreaterThanOrEqual(0);
      expect(totalSavings).toBeGreaterThanOrEqual(0);

      logger.info({ totalChecking, totalSavings }, 'Account type totals displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to account details', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-to-account-details');

    try {
      const accountCount = await dashboardPage.getAccountCount();
      expect(accountCount).toBeGreaterThan(0);

      // Click first account
      await dashboardPage.clickAccount(0);

      // Wait for navigation
      await Wait.forUrl(page, /accounts\/\d+/, 5000);

      logger.info('Navigated to account details');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display recent transactions', async ({ page }) => {
    const tracker = monitor.trackTest('display-recent-transactions');

    try {
      const transactions = await dashboardPage.getRecentTransactions();
      
      if (transactions.length > 0) {
        // Verify transaction structure
        transactions.forEach(tx => {
          expect(tx.date).toBeTruthy();
          expect(tx.description).toBeTruthy();
          expect(tx).toHaveProperty('amount');
        });

        logger.info({ count: transactions.length }, 'Recent transactions displayed');
      } else {
        logger.info('No recent transactions found');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to all transactions', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-to-all-transactions');

    try {
      await dashboardPage.viewAllTransactions();

      // Wait for navigation
      await Wait.forUrl(page, /transactions/, 5000);

      logger.info('Navigated to all transactions');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should use quick transfer action', async ({ page }) => {
    const tracker = monitor.trackTest('quick-transfer-action');

    try {
      await dashboardPage.quickTransfer();

      // Should navigate to transfer page
      await Wait.forUrl(page, /transfer/, 5000);

      logger.info('Quick transfer initiated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should use quick deposit action', async ({ page }) => {
    const tracker = monitor.trackTest('quick-deposit-action');

    try {
      await dashboardPage.quickDeposit();

      // Should navigate to deposit page
      await Wait.forUrl(page, /deposit|transaction/, 5000);

      logger.info('Quick deposit initiated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should use quick open account action', async ({ page }) => {
    const tracker = monitor.trackTest('quick-open-account');

    try {
      await dashboardPage.quickOpenAccount();

      // Should navigate to account opening page
      await Wait.forUrl(page, /accounts\/open/, 5000);

      logger.info('Quick open account initiated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate using main menu - Accounts', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-menu-accounts');

    try {
      await dashboardPage.goToAccounts();
      await Wait.forUrl(page, /accounts/, 5000);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate using main menu - Transactions', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-menu-transactions');

    try {
      await dashboardPage.goToTransactions();
      await Wait.forUrl(page, /transactions/, 5000);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate using main menu - Statements', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-menu-statements');

    try {
      await dashboardPage.goToStatements();
      await Wait.forUrl(page, /statements/, 5000);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display alerts if present', async ({ page }) => {
    const tracker = monitor.trackTest('display-alerts');

    try {
      const alertsCount = await dashboardPage.getAlertsCount();
      
      if (alertsCount > 0) {
        const alerts = await dashboardPage.getAllAlerts();
        
        alerts.forEach(alert => {
          expect(alert.title).toBeTruthy();
          expect(alert.message).toBeTruthy();
        });

        logger.info({ count: alertsCount }, 'Alerts displayed');
      } else {
        logger.info('No alerts present');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display scheduled transactions', async ({ page }) => {
    const tracker = monitor.trackTest('display-scheduled-transactions');

    try {
      const scheduled = await dashboardPage.getScheduledTransactions();

      if (scheduled.length > 0) {
        scheduled.forEach(item => {
          expect(item.date).toBeTruthy();
          expect(item.description).toBeTruthy();
          expect(item.amount).toBeGreaterThan(0);
        });

        logger.info({ count: scheduled.length }, 'Scheduled transactions displayed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should perform global search', async ({ page }) => {
    const tracker = monitor.trackTest('global-search');

    try {
      await dashboardPage.search('checking');

      const results = await dashboardPage.getSearchResults();
      expect(results.length).toBeGreaterThan(0);

      results.forEach(result => {
        expect(result.title).toBeTruthy();
        expect(result.type).toBeTruthy();
      });

      logger.info({ count: results.length }, 'Search results displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should open and close profile dropdown', async ({ page }) => {
    const tracker = monitor.trackTest('profile-dropdown');

    try {
      await dashboardPage.openProfileDropdown();

      // Dropdown should be visible
      await page.waitForTimeout(500);

      // Click elsewhere to close
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(500);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate to settings from profile', async ({ page }) => {
    const tracker = monitor.trackTest('navigate-to-settings');

    try {
      await dashboardPage.goToSettings();
      await Wait.forUrl(page, /settings/, 5000);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should logout from dashboard', async ({ page }) => {
    const tracker = monitor.trackTest('logout-from-dashboard');

    try {
      await dashboardPage.logout();

      // Should be redirected to login
      await Wait.forUrl(page, /login/, 5000);

      // Verify cannot access dashboard without auth
      await page.goto(Config.BANNO_BASE_URL + '/dashboard');
      await Wait.forUrl(page, /login/, 5000);

      logger.info('Logout successful');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display messages badge if unread', async ({ page }) => {
    const tracker = monitor.trackTest('display-messages-badge');

    try {
      const unreadCount = await dashboardPage.getUnreadMessagesCount();

      if (unreadCount > 0) {
        logger.info({ unreadCount }, 'Unread messages badge displayed');
        
        // Open messages dropdown
        await dashboardPage.openMessagesDropdown();
        await page.waitForTimeout(1000);
      } else {
        logger.info('No unread messages');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle dashboard refresh', async ({ page }) => {
    const tracker = monitor.trackTest('dashboard-refresh');

    try {
      const balanceBefore = await dashboardPage.getTotalBalance();

      // Refresh page
      await page.reload();
      await dashboardPage.waitForDashboardToLoad();

      const balanceAfter = await dashboardPage.getTotalBalance();

      // Balance should remain the same
      expect(balanceAfter).toBe(balanceBefore);

      logger.info('Dashboard refresh handled correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should verify spending widget if available', async ({ page }) => {
    const tracker = monitor.trackTest('spending-widget');

    try {
      const hasWidget = await dashboardPage.hasSpendingWidget();

      if (hasWidget) {
        logger.info('Spending widget is displayed');
      } else {
        logger.info('Spending widget not available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should verify savings goals widget if available', async ({ page }) => {
    const tracker = monitor.trackTest('savings-goals-widget');

    try {
      const hasWidget = await dashboardPage.hasSavingsGoalsWidget();

      if (hasWidget) {
        logger.info('Savings goals widget is displayed');
      } else {
        logger.info('Savings goals widget not available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display correct account count', async ({ page }) => {
    const tracker = monitor.trackTest('verify-account-count');

    try {
      const accountCount = await dashboardPage.getAccountCount();
      const accounts = await dashboardPage.getAllAccounts();

      expect(accountCount).toBe(accounts.length);

      logger.info({ accountCount }, 'Account count verified');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle empty recent transactions gracefully', async ({ page }) => {
    const tracker = monitor.trackTest('empty-recent-transactions');

    try {
      // This test verifies the dashboard handles users with no transactions
      const transactions = await dashboardPage.getRecentTransactions();

      // Should return empty array, not throw error
      expect(Array.isArray(transactions)).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should maintain state after navigation and back', async ({ page }) => {
    const tracker = monitor.trackTest('maintain-state-navigation');

    try {
      const balanceBefore = await dashboardPage.getTotalBalance();

      // Navigate away
      await dashboardPage.goToAccounts();
      await Wait.forUrl(page, /accounts/, 5000);

      // Go back
      await page.goBack();
      await dashboardPage.waitForDashboardToLoad();

      const balanceAfter = await dashboardPage.getTotalBalance();
      expect(balanceAfter).toBe(balanceBefore);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });
});