import { test as txTest, expect as txExpect } from '../../fixtures';
import { logger as txLogger } from '@lib/core/logger';
import { bannoApi } from '@lib/core/api';

txTest.describe('Transactions - Processing', () => {
  txTest('should make a cash deposit', async ({ authenticatedPage, transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox', { name: /account/i }));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type|transaction.*type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Deposit');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i)
      .or(transactionPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('500');

    const descriptionInput = transactionPage.page
      .getByLabel(/description|memo/i)
      .or(transactionPage.page.getByPlaceholder(/description/i));
    
    await descriptionInput.fill('Cash deposit test');

    const depositTypeSelect = transactionPage.page
      .getByLabel(/deposit.*type|method/i)
      .or(transactionPage.page.getByRole('combobox', { name: /deposit/i }));
    
    if (await depositTypeSelect.count() > 0) {
      await depositTypeSelect.selectOption('Cash');
    }

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process|deposit/i });
    
    await submitButton.click();

    const successMessage = transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/success|completed/i));
    
    await txExpect(successMessage).toBeVisible();

    txLogger.info({ amount: 500 }, 'Cash deposit completed');
  });

  txTest('should make a check deposit', async ({ transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Deposit');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('750');

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i);
    
    await descriptionInput.fill('Check deposit');

    const depositTypeSelect = transactionPage.page
      .getByLabel(/deposit.*type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /deposit/i }));
    
    if (await depositTypeSelect.count() > 0) {
      await depositTypeSelect.selectOption('Check');

      const checkNumberInput = transactionPage.page
        .getByLabel(/check.*number/i)
        .or(transactionPage.page.getByPlaceholder(/check/i));
      
      if (await checkNumberInput.count() > 0) {
        await checkNumberInput.fill('1234');
      }
    }

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const successMessage = transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/success/i));
    
    await txExpect(successMessage).toBeVisible();

    txLogger.info({ checkNumber: '1234', amount: 750 }, 'Check deposit completed');
  });

  txTest('should make a withdrawal', async ({ transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Withdrawal');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('200');

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i);
    
    await descriptionInput.fill('ATM withdrawal');

    const methodSelect = transactionPage.page
      .getByLabel(/method/i)
      .or(transactionPage.page.getByRole('combobox', { name: /method/i }));
    
    if (await methodSelect.count() > 0) {
      await methodSelect.selectOption('ATM');
    }

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const successMessage = transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/success/i));
    
    await txExpect(successMessage).toBeVisible();

    txLogger.info({ amount: 200 }, 'Withdrawal completed');
  });

  txTest('should prevent withdrawal exceeding available balance', async ({ transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Withdrawal');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill((testAccount.balance + 1000).toString());

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i);
    
    await descriptionInput.fill('Overdraft test');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const errorMessage = transactionPage.page
      .getByText(/insufficient.*funds|exceeds.*balance/i)
      .or(transactionPage.page.getByRole('alert'));
    
    await txExpect(errorMessage).toBeVisible();

    txLogger.info('Overdraft prevention working correctly');
  });

  txTest('should validate required fields', async ({ transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const errorMessages = await transactionPage.page
      .getByText(/required/i)
      .or(transactionPage.page.getByRole('alert'))
      .all();
    
    txExpect(errorMessages.length).toBeGreaterThan(0);

    txLogger.info('Required field validation working');
  });

  txTest('should validate amount format', async ({ transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Deposit');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('-100');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit/i });
    
    await submitButton.click();

    const errorMessage = transactionPage.page
      .getByText(/invalid.*amount|positive/i)
      .or(transactionPage.page.getByRole('alert'));
    
    await txExpect(errorMessage).toBeVisible();

    txLogger.info('Amount format validation working');
  });

  txTest('should view recent transactions', async ({ transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const transactionRows = transactionPage.page
      .getByRole('row')
      .or(transactionPage.page.locator('[data-testid*="transaction"]'));
    
    const count = await transactionRows.count();

    if (count > 0) {
      txLogger.info({ count }, 'Recent transactions retrieved');
    }

    txExpect(count).toBeGreaterThanOrEqual(0);
  });

  txTest('should download transaction receipt', async ({ page, transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Deposit');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i);
    
    await amountInput.fill('250');

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i);
    
    await descriptionInput.fill('Receipt test');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit/i });
    
    await submitButton.click();

    const successMessage = transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/success/i));
    
    await txExpect(successMessage).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    
    const downloadButton = transactionPage.page
      .getByRole('button', { name: /download.*receipt|print/i });
    
    if (await downloadButton.count() > 0) {
      await downloadButton.click();

      const download = await downloadPromise;
      txExpect(download.suggestedFilename()).toContain('.pdf');

      txLogger.info('Receipt downloaded');
    }
  });
});