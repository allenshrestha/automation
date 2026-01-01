import { test as openingTest, expect as openingExpect } from '../../fixtures';
import { logger as openingLogger } from '@lib/core/logger';
import { bannoApi } from '@lib/core/api';

openingTest.describe('Account Management - Account Opening', () => {
  const createdAccounts: string[] = [];

  openingTest('should open a checking account successfully', async ({ 
    authenticatedPage, 
    accountOpeningPage 
  }) => {
    await accountOpeningPage.navigate();

    const accountTypeSelect = accountOpeningPage.page
      .getByLabel(/account.*type/i)
      .or(accountOpeningPage.page.getByRole('combobox', { name: /type/i }));
    
    await accountTypeSelect.selectOption('Checking');

    const accountNameInput = accountOpeningPage.page
      .getByLabel(/account.*name/i)
      .or(accountOpeningPage.page.getByPlaceholder(/name/i));
    
    await accountNameInput.fill('My Checking Account');

    const depositInput = accountOpeningPage.page
      .getByLabel(/initial.*deposit/i)
      .or(accountOpeningPage.page.getByPlaceholder(/deposit/i));
    
    await depositInput.fill('100');

    const termsCheckbox = accountOpeningPage.page
      .getByLabel(/terms|agree/i)
      .or(accountOpeningPage.page.getByRole('checkbox'));
    
    await termsCheckbox.check();

    const submitButton = accountOpeningPage.page
      .getByRole('button', { name: /submit|open.*account/i });
    
    await submitButton.click();

    const successMessage = accountOpeningPage.page
      .getByRole('alert')
      .or(accountOpeningPage.page.getByText(/success|account.*opened/i));
    
    await openingExpect(successMessage).toBeVisible();

    const accountNumberDisplay = accountOpeningPage.page
      .getByText(/account.*number/i)
      .or(accountOpeningPage.page.getByTestId('account-number'));
    
    const accountNumberText = await accountNumberDisplay.textContent();
    const accountNumber = accountNumberText?.match(/\d+/)?.[0] || '';
    
    createdAccounts.push(accountNumber);

    openingLogger.info({ accountNumber }, 'Checking account opened');
  });

  openingTest('should validate minimum deposit requirement', async ({ 
    accountOpeningPage 
  }) => {
    await accountOpeningPage.navigate();

    const accountTypeSelect = accountOpeningPage.page
      .getByLabel(/account.*type/i)
      .or(accountOpeningPage.page.getByRole('combobox', { name: /type/i }));
    
    await accountTypeSelect.selectOption('Checking');

    const depositInput = accountOpeningPage.page
      .getByLabel(/initial.*deposit/i)
      .or(accountOpeningPage.page.getByPlaceholder(/deposit/i));
    
    await depositInput.fill('10'); // Below minimum

    const termsCheckbox = accountOpeningPage.page
      .getByLabel(/terms|agree/i)
      .or(accountOpeningPage.page.getByRole('checkbox'));
    
    await termsCheckbox.check();

    const submitButton = accountOpeningPage.page
      .getByRole('button', { name: /submit|open/i });
    
    await submitButton.click();

    const errorMessage = accountOpeningPage.page
      .getByText(/minimum.*deposit/i)
      .or(accountOpeningPage.page.getByRole('alert'));
    
    await openingExpect(errorMessage).toBeVisible();

    openingLogger.info('Minimum deposit validation working');
  });

  openingTest.afterAll(async () => {
    for (const accountNumber of createdAccounts) {
      try {
        await bannoApi.delete(`/api/accounts/${accountNumber}`);
      } catch (error) {
        openingLogger.warn({ accountNumber }, 'Failed to cleanup account');
      }
    }
  });
});