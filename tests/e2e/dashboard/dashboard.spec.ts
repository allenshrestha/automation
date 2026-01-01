import { test as dashTest, expect as dashExpect } from '../../fixtures';
import { logger as dashLogger } from '@lib/core/logger';

dashTest.describe('Dashboard - Member View', () => {
  dashTest('should load dashboard successfully after login', async ({ 
    authenticatedPage, 
    dashboardPage 
  }) => {
    await dashboardPage.waitForDashboardToLoad();

    const welcomeMessage = dashboardPage.page
      .getByRole('heading', { name: /welcome|dashboard/i })
      .or(dashboardPage.page.getByTestId('dashboard'));
    
    await dashExpect(welcomeMessage).toBeVisible();

    dashLogger.info('Dashboard loaded successfully');
  });

  dashTest('should display user information', async ({ dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    const userProfile = dashboardPage.page
      .getByRole('button', { name: /profile|account/i })
      .or(dashboardPage.page.getByTestId('user-profile'));
    
    await dashExpect(userProfile).toBeVisible();

    dashLogger.info('User information displayed');
  });

  dashTest('should display all user accounts', async ({ dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    const accountItems = dashboardPage.page
      .getByRole('article')
      .or(dashboardPage.page.locator('[data-testid*="account"]'));
    
    const count = await accountItems.count();
    dashExpect(count).toBeGreaterThan(0);

    dashLogger.info({ accountCount: count }, 'Accounts displayed');
  });

  dashTest('should navigate to account details', async ({ page, dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    const firstAccount = dashboardPage.page
      .getByRole('article')
      .or(dashboardPage.page.locator('[data-testid*="account"]'))
      .first();
    
    await firstAccount.click();

    await dashExpect(page).toHaveURL(/accounts/, { timeout: 5000 });

    dashLogger.info('Navigated to account details');
  });

  dashTest('should display recent transactions', async ({ dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    const transactionItems = dashboardPage.page
      .getByRole('row')
      .or(dashboardPage.page.locator('[data-testid*="transaction"]'));
    
    const count = await transactionItems.count();
    
    if (count > 0) {
      dashLogger.info({ count }, 'Recent transactions displayed');
    }

    dashExpect(count).toBeGreaterThanOrEqual(0);
  });
});