/**
 * tests/fixtures.ts
 * 
 * MODERN PLAYWRIGHT FIXTURES (2025)
 * 
 * Benefits:
 * - Automatic setup/teardown
 * - Test isolation
 * - No manual Page Object instantiation
 * - Cleaner test code
 * - Parallel execution ready
 */

import { test as base, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { AccountDetailsPage } from '@pages/AccountDetailsPage';
import { AccountOpeningPage } from '@pages/AccountOpeningPage';
import { BillPayPage } from '@pages/BillPayPage';
import { TransactionPage } from '@pages/TransactionPage';
import { TransfersPage } from '@pages/TransfersPage';
import { StatementsPage } from '@pages/StatementsPage';
import { MemberSearchPage } from '@pages/MemberSearchPage';
import { MemberDetailsPage } from '@pages/MemberDetailsPage';
import { ProfileSettingsPage } from '@pages/ProfileSettingsPage';
import { Config } from '@lib/core/config';
import { bannoApi } from '@lib/core/api';
import { TestData } from 'test-data';
import { logger } from '@lib/core/logger';

// Define custom fixtures
type CustomFixtures = {
  // Page Objects (automatically instantiated)
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  accountDetailsPage: AccountDetailsPage;
  accountOpeningPage: AccountOpeningPage;
  billPayPage: BillPayPage;
  transactionPage: TransactionPage;
  transfersPage: TransfersPage;
  statementsPage: StatementsPage;
  memberSearchPage: MemberSearchPage;
  memberDetailsPage: MemberDetailsPage;
  profileSettingsPage: ProfileSettingsPage;
  
  // Authenticated context (logs in automatically)
  authenticatedPage: typeof page;
  
  // Test data helpers
  testAccount: {
    accountNumber: string;
    balance: number;
    cleanup: () => Promise<void>;
  };
  
  testMember: {
    memberId: string;
    email: string;
    cleanup: () => Promise<void>;
  };
};

// Extend base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Page Object fixtures (auto-instantiate)
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  accountDetailsPage: async ({ page }, use) => {
    await use(new AccountDetailsPage(page));
  },

  accountOpeningPage: async ({ page }, use) => {
    await use(new AccountOpeningPage(page));
  },

  billPayPage: async ({ page }, use) => {
    await use(new BillPayPage(page));
  },

  transactionPage: async ({ page }, use) => {
    await use(new TransactionPage(page));
  },

  transfersPage: async ({ page }, use) => {
    await use(new TransfersPage(page));
  },

  statementsPage: async ({ page }, use) => {
    await use(new StatementsPage(page));
  },

  memberSearchPage: async ({ page }, use) => {
    await use(new MemberSearchPage(page));
  },

  memberDetailsPage: async ({ page }, use) => {
    await use(new MemberDetailsPage(page));
  },

  profileSettingsPage: async ({ page }, use) => {
    await use(new ProfileSettingsPage(page));
  },

  // Authenticated page fixture (auto-login)
  authenticatedPage: async ({ page, loginPage }, use) => {
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    logger.debug('Authentication fixture: Logged in');
    
    await use(page);
    
    // Cleanup handled automatically by Playwright
  },

  // Test account fixture (creates and cleans up account)
  testAccount: async ({}, use) => {
    // Create account via API
    const accountData = TestData.generate.account();
    const response = await bannoApi.post('/api/accounts', accountData);
    const accountNumber = response.data.accountNumber;
    const balance = response.data.balance;
    
    logger.debug({ accountNumber }, 'Test account fixture: Created');
    
    // Provide to test
    await use({
      accountNumber,
      balance,
      cleanup: async () => {
        await bannoApi.delete(`/api/accounts/${accountNumber}`).catch(() => {});
        logger.debug({ accountNumber }, 'Test account fixture: Cleaned up');
      },
    });
    
    // Auto-cleanup after test
    await bannoApi.delete(`/api/accounts/${accountNumber}`).catch(() => {});
  },

  // Test member fixture (creates and cleans up member)
  testMember: async ({}, use) => {
    // Create member via API
    const memberData = TestData.generate.member();
    const response = await bannoApi.post('/api/members', memberData);
    const memberId = response.data.id;
    const email = memberData.email;
    
    logger.debug({ memberId, email }, 'Test member fixture: Created');
    
    // Provide to test
    await use({
      memberId,
      email,
      cleanup: async () => {
        await bannoApi.delete(`/api/members/${memberId}`).catch(() => {});
        logger.debug({ memberId }, 'Test member fixture: Cleaned up');
      },
    });
    
    // Auto-cleanup after test
    await bannoApi.delete(`/api/members/${memberId}`).catch(() => {});
  },
});

// Export expect for convenience
export { expect } from '@playwright/test';

/**
 * USAGE EXAMPLES:
 * 
 * // Auto-instantiated page objects
 * test('my test', async ({ loginPage, dashboardPage }) => {
 *   await loginPage.navigateToLogin();
 *   // No need to create new instances!
 * });
 * 
 * // Auto-login
 * test('needs auth', async ({ authenticatedPage, dashboardPage }) => {
 *   // Already logged in!
 *   await dashboardPage.goToAccounts();
 * });
 * 
 * // Auto-cleanup test data
 * test('with account', async ({ testAccount, authenticatedPage }) => {
 *   // testAccount.accountNumber is ready to use
 *   // Automatically cleaned up after test
 * });
 */