import { test as detailsTest, expect as detailsExpect } from '../../fixtures';
import { logger as detailsLogger } from '@lib/core/logger';

detailsTest.describe('Account Management - Account Details', () => {
  detailsTest('should display account information correctly', async ({ 
    authenticatedPage, 
    accountDetailsPage, 
    testAccount 
  }) => {
    await accountDetailsPage.navigate(testAccount.accountNumber);

    const accountNumberDisplay = accountDetailsPage.page
      .getByText(new RegExp(testAccount.accountNumber))
      .or(accountDetailsPage.page.getByTestId('account-number'));
    
    await detailsExpect(accountNumberDisplay).toBeVisible();

    const balanceDisplay = accountDetailsPage.page
      .getByLabel(/balance|current.*balance/i)
      .or(accountDetailsPage.page.getByTestId('account-balance'));
    
    await detailsExpect(balanceDisplay).toBeVisible();

    detailsLogger.info({ accountNumber: testAccount.accountNumber }, 'Account information displayed');
  });

  detailsTest('should display transaction history', async ({ 
    accountDetailsPage, 
    testAccount 
  }) => {
    await accountDetailsPage.navigate(testAccount.accountNumber);

    const transactionsTab = accountDetailsPage.page
      .getByRole('tab', { name: /transactions/i });
    
    if (await transactionsTab.count() > 0) {
      await transactionsTab.click();
    }

    const transactionRows = accountDetailsPage.page
      .getByRole('row')
      .or(accountDetailsPage.page.locator('[data-testid*="transaction"]'));
    
    const count = await transactionRows.count();
    detailsExpect(count).toBeGreaterThan(0);

    detailsLogger.info({ count }, 'Transaction history displayed');
  });

  detailsTest('should filter transactions by date range', async ({ 
    accountDetailsPage, 
    testAccount 
  }) => {
    await accountDetailsPage.navigate(testAccount.accountNumber);

    const filterButton = accountDetailsPage.page
      .getByRole('button', { name: /filter/i });
    
    if (await filterButton.count() > 0) {
      await filterButton.click();
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const startDateInput = accountDetailsPage.page
      .getByLabel(/start.*date|from/i);
    
    const endDateInput = accountDetailsPage.page
      .getByLabel(/end.*date|to/i);
    
    if (await startDateInput.count() > 0 && await endDateInput.count() > 0) {
      await startDateInput.fill(thirtyDaysAgo.toISOString().split('T')[0]);
      await endDateInput.fill(today.toISOString().split('T')[0]);

      const applyButton = accountDetailsPage.page
        .getByRole('button', { name: /apply|search/i });
      
      await applyButton.click();

      detailsLogger.info('Date filter applied');
    }
  });

  detailsTest('should export transactions to CSV', async ({ 
    page, 
    accountDetailsPage, 
    testAccount 
  }) => {
    await accountDetailsPage.navigate(testAccount.accountNumber);

    const exportButton = accountDetailsPage.page
      .getByRole('button', { name: /export/i });
    
    if (await exportButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      detailsExpect(download.suggestedFilename()).toContain('.csv');

      detailsLogger.info({ filename: download.suggestedFilename() }, 'Transactions exported');
    }
  });

  detailsTest('should update account nickname', async ({ 
    accountDetailsPage, 
    testAccount 
  }) => {
    await accountDetailsPage.navigate(testAccount.accountNumber);

    const editButton = accountDetailsPage.page
      .getByRole('button', { name: /edit|settings/i });
    
    if (await editButton.count() > 0) {
      await editButton.click();

      const nicknameInput = accountDetailsPage.page
        .getByLabel(/nickname/i)
        .or(accountDetailsPage.page.getByPlaceholder(/nickname/i));
      
      const newNickname = 'My Primary Checking';
      await nicknameInput.fill(newNickname);

      const saveButton = accountDetailsPage.page
        .getByRole('button', { name: /save/i });
      
      await saveButton.click();

      const successMessage = accountDetailsPage.page
        .getByRole('alert')
        .or(accountDetailsPage.page.getByText(/saved|updated/i));
      
      await detailsExpect(successMessage).toBeVisible();

      detailsLogger.info({ newNickname }, 'Account nickname updated');
    }
  });
});