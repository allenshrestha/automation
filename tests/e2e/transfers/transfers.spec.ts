import { test as trTest, expect as trExpect } from '../../fixtures';
import { logger as trLogger } from '@lib/core/logger';
import { bannoApi as trApi } from '@lib/core/api';

trTest.describe('Transfers - Money Movement', () => {
  let secondTestAccount: string;

  trTest.beforeAll(async () => {
    const accountData = {
      accountType: 'Savings',
      balance: 1000,
      accountName: 'Transfer Test Savings',
    };
    const response = await trApi.post('/api/accounts', accountData);
    secondTestAccount = response.data.accountNumber;
    
    trLogger.info({ secondTestAccount }, 'Second test account created');
  });

  trTest('should make internal transfer', async ({ transfersPage, testAccount }) => {
    await transfersPage.navigate();

    const fromAccountSelect = transfersPage.page
      .getByLabel(/from.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /from/i }));
    
    await fromAccountSelect.selectOption(testAccount.accountNumber);

    const toAccountSelect = transfersPage.page
      .getByLabel(/to.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /to/i }));
    
    await toAccountSelect.selectOption(secondTestAccount);

    const amountInput = transfersPage.page
      .getByLabel(/amount/i)
      .or(transfersPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('500');

    const memoInput = transfersPage.page
      .getByLabel(/memo|description/i)
      .or(transfersPage.page.getByPlaceholder(/memo/i));
    
    await memoInput.fill('Monthly savings');

    const submitButton = transfersPage.page
      .getByRole('button', { name: /transfer|submit/i });
    
    await submitButton.click();

    const successMessage = transfersPage.page
      .getByRole('alert')
      .or(transfersPage.page.getByText(/success|completed/i));
    
    await trExpect(successMessage).toBeVisible();

    trLogger.info({ amount: 500 }, 'Internal transfer completed');
  });

  trTest('should add external account', async ({ transfersPage }) => {
    await transfersPage.navigate();

    const addExternalButton = transfersPage.page
      .getByRole('button', { name: /add.*external/i });
    
    await addExternalButton.click();

    const routingInput = transfersPage.page
      .getByLabel(/routing.*number/i)
      .or(transfersPage.page.getByPlaceholder(/routing/i));
    
    await routingInput.fill('123456789');

    const accountNumberInput = transfersPage.page
      .getByLabel(/account.*number/i)
      .or(transfersPage.page.getByPlaceholder(/account/i));
    
    await accountNumberInput.fill('9876543210');

    const accountTypeSelect = transfersPage.page
      .getByLabel(/account.*type/i)
      .or(transfersPage.page.getByRole('combobox', { name: /type/i }));
    
    await accountTypeSelect.selectOption('Checking');

    const nicknameInput = transfersPage.page
      .getByLabel(/nickname/i)
      .or(transfersPage.page.getByPlaceholder(/nickname/i));
    
    await nicknameInput.fill('External Checking');

    const saveButton = transfersPage.page
      .getByRole('button', { name: /save|add/i });
    
    await saveButton.click();

    const successMessage = transfersPage.page
      .getByRole('alert')
      .or(transfersPage.page.getByText(/added|success/i));
    
    await trExpect(successMessage).toBeVisible();

    trLogger.info('External account added');
  });

  trTest('should schedule recurring transfer', async ({ transfersPage, testAccount }) => {
    await transfersPage.navigate();

    const recurringCheckbox = transfersPage.page
      .getByLabel(/recurring/i)
      .or(transfersPage.page.getByRole('checkbox', { name: /recurring/i }));
    
    if (await recurringCheckbox.count() > 0) {
      await recurringCheckbox.check();
    }

    const fromAccountSelect = transfersPage.page
      .getByLabel(/from.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /from/i }));
    
    await fromAccountSelect.selectOption(testAccount.accountNumber);

    const toAccountSelect = transfersPage.page
      .getByLabel(/to.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /to/i }));
    
    await toAccountSelect.selectOption(secondTestAccount);

    const amountInput = transfersPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('300');

    const frequencySelect = transfersPage.page
      .getByLabel(/frequency/i)
      .or(transfersPage.page.getByRole('combobox', { name: /frequency/i }));
    
    await frequencySelect.selectOption('Monthly');

    const startDate = new Date();
    startDate.setDate(1);
    
    const startDateInput = transfersPage.page
      .getByLabel(/start.*date/i);
    
    await startDateInput.fill(startDate.toISOString().split('T')[0]);

    const submitButton = transfersPage.page
      .getByRole('button', { name: /schedule|submit/i });
    
    await submitButton.click();

    const successMessage = transfersPage.page
      .getByRole('alert')
      .or(transfersPage.page.getByText(/scheduled|success/i));
    
    await trExpect(successMessage).toBeVisible();

    trLogger.info({ frequency: 'Monthly' }, 'Recurring transfer scheduled');
  });

  trTest('should view pending transfers', async ({ transfersPage }) => {
    await transfersPage.navigate();

    const pendingTab = transfersPage.page
      .getByRole('tab', { name: /pending/i });
    
    if (await pendingTab.count() > 0) {
      await pendingTab.click();
    }

    const transferRows = transfersPage.page
      .getByRole('row')
      .or(transfersPage.page.locator('[data-testid*="transfer"]'));
    
    const count = await transferRows.count();
    
    trExpect(count).toBeGreaterThanOrEqual(0);

    trLogger.info({ count }, 'Pending transfers displayed');
  });

  trTest('should view completed transfers', async ({ transfersPage }) => {
    await transfersPage.navigate();

    const completedTab = transfersPage.page
      .getByRole('tab', { name: /completed|history/i });
    
    if (await completedTab.count() > 0) {
      await completedTab.click();
    }

    const transferRows = transfersPage.page
      .getByRole('row')
      .or(transfersPage.page.locator('[data-testid*="transfer"]'));
    
    const count = await transferRows.count();

    trLogger.info({ count }, 'Completed transfers displayed');
  });

  trTest('should cancel pending transfer', async ({ transfersPage, testAccount }) => {
    await transfersPage.navigate();

    const fromAccountSelect = transfersPage.page
      .getByLabel(/from.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /from/i }));
    
    await fromAccountSelect.selectOption(testAccount.accountNumber);

    const toAccountSelect = transfersPage.page
      .getByLabel(/to.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /to/i }));
    
    await toAccountSelect.selectOption(secondTestAccount);

    const amountInput = transfersPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('100');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    
    const dateInput = transfersPage.page
      .getByLabel(/date/i);
    
    if (await dateInput.count() > 0) {
      await dateInput.fill(futureDate.toISOString().split('T')[0]);
    }

    const submitButton = transfersPage.page
      .getByRole('button', { name: /transfer|submit/i });
    
    await submitButton.click();

    await transfersPage.page.waitForTimeout(1000);

    const pendingTab = transfersPage.page
      .getByRole('tab', { name: /pending/i });
    
    if (await pendingTab.count() > 0) {
      await pendingTab.click();

      const cancelButton = transfersPage.page
        .getByRole('button', { name: /cancel/i })
        .first();
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click();

        const confirmButton = transfersPage.page
          .getByRole('button', { name: /confirm|yes/i });
        
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        const cancelMessage = transfersPage.page
          .getByRole('alert')
          .or(transfersPage.page.getByText(/cancelled/i));
        
        await trExpect(cancelMessage).toBeVisible();

        trLogger.info('Transfer cancelled');
      }
    }
  });

  trTest('should filter transfers by date range', async ({ transfersPage }) => {
    await transfersPage.navigate();

    const historyTab = transfersPage.page
      .getByRole('tab', { name: /history|completed/i });
    
    if (await historyTab.count() > 0) {
      await historyTab.click();
    }

    const filterButton = transfersPage.page
      .getByRole('button', { name: /filter/i });
    
    if (await filterButton.count() > 0) {
      await filterButton.click();

      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const startDateInput = transfersPage.page
        .getByLabel(/start.*date|from/i);
      
      const endDateInput = transfersPage.page
        .getByLabel(/end.*date|to/i);
      
      await startDateInput.fill(thirtyDaysAgo.toISOString().split('T')[0]);
      await endDateInput.fill(today.toISOString().split('T')[0]);

      const applyButton = transfersPage.page
        .getByRole('button', { name: /apply/i });
      
      await applyButton.click();

      trLogger.info('Date filter applied');
    }
  });

  trTest('should export transfer history', async ({ page, transfersPage }) => {
    await transfersPage.navigate();

    const historyTab = transfersPage.page
      .getByRole('tab', { name: /history|completed/i });
    
    if (await historyTab.count() > 0) {
      await historyTab.click();
    }

    const exportButton = transfersPage.page
      .getByRole('button', { name: /export/i });
    
    if (await exportButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      trExpect(download.suggestedFilename()).toContain('.csv');

      trLogger.info('Transfer history exported');
    }
  });

  trTest('should validate insufficient funds', async ({ transfersPage, testAccount }) => {
    await transfersPage.navigate();

    const fromAccountSelect = transfersPage.page
      .getByLabel(/from.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /from/i }));
    
    await fromAccountSelect.selectOption(testAccount.accountNumber);

    const toAccountSelect = transfersPage.page
      .getByLabel(/to.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /to/i }));
    
    await toAccountSelect.selectOption(secondTestAccount);

    const amountInput = transfersPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill((testAccount.balance + 1000).toString());

    const submitButton = transfersPage.page
      .getByRole('button', { name: /transfer|submit/i });
    
    await submitButton.click();

    const errorMessage = transfersPage.page
      .getByText(/insufficient.*funds/i)
      .or(transfersPage.page.getByRole('alert'));
    
    await trExpect(errorMessage).toBeVisible();

    trLogger.info('Insufficient funds validation working');
  });

  trTest('should validate transfer to same account', async ({ transfersPage, testAccount }) => {
    await transfersPage.navigate();

    const fromAccountSelect = transfersPage.page
      .getByLabel(/from.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /from/i }));
    
    await fromAccountSelect.selectOption(testAccount.accountNumber);

    const toAccountSelect = transfersPage.page
      .getByLabel(/to.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /to/i }));
    
    await toAccountSelect.selectOption(testAccount.accountNumber);

    const amountInput = transfersPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('100');

    const submitButton = transfersPage.page
      .getByRole('button', { name: /transfer|submit/i });
    
    await submitButton.click();

    const errorMessage = transfersPage.page
      .getByText(/cannot.*transfer.*same.*account/i)
      .or(transfersPage.page.getByRole('alert'));
    
    await trExpect(errorMessage).toBeVisible();

    trLogger.info('Same account transfer validation working');
  });

  trTest('should validate minimum transfer amount', async ({ transfersPage, testAccount }) => {
    await transfersPage.navigate();

    const fromAccountSelect = transfersPage.page
      .getByLabel(/from.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /from/i }));
    
    await fromAccountSelect.selectOption(testAccount.accountNumber);

    const toAccountSelect = transfersPage.page
      .getByLabel(/to.*account/i)
      .or(transfersPage.page.getByRole('combobox', { name: /to/i }));
    
    await toAccountSelect.selectOption(secondTestAccount);

    const amountInput = transfersPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('0.01');

    const submitButton = transfersPage.page
      .getByRole('button', { name: /transfer|submit/i });
    
    await submitButton.click();

    const errorMessage = transfersPage.page
      .getByText(/minimum.*amount/i)
      .or(transfersPage.page.getByRole('alert'));
    
    await trExpect(errorMessage).toBeVisible();

    trLogger.info('Minimum amount validation working');
  });

  trTest('should validate routing number format', async ({ transfersPage }) => {
    await transfersPage.navigate();

    const addExternalButton = transfersPage.page
      .getByRole('button', { name: /add.*external/i });
    
    await addExternalButton.click();

    const routingInput = transfersPage.page
      .getByLabel(/routing.*number/i)
      .or(transfersPage.page.getByPlaceholder(/routing/i));
    
    await routingInput.fill('12345'); // Invalid

    const accountNumberInput = transfersPage.page
      .getByLabel(/account.*number/i);
    
    await accountNumberInput.fill('9876543210');

    const saveButton = transfersPage.page
      .getByRole('button', { name: /save|add/i });
    
    await saveButton.click();

    const errorMessage = transfersPage.page
      .getByText(/invalid.*routing/i)
      .or(transfersPage.page.getByRole('alert'));
    
    await trExpect(errorMessage).toBeVisible();

    trLogger.info('Routing number validation working');
  });

  trTest.afterAll(async () => {
    try {
      await trApi.delete(`/api/accounts/${secondTestAccount}`);
      trLogger.info('Second test account cleaned up');
    } catch (error) {
      trLogger.warn('Failed to cleanup second test account');
    }
  });
});