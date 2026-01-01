import { test as billTest, expect as billExpect } from '../../fixtures';
import { logger as billLogger } from '@lib/core/logger';

billTest.describe('Bill Pay - Payment Management', () => {
  billTest('should add a new payee successfully', async ({ billPayPage }) => {
    await billPayPage.navigate();

    const addPayeeButton = billPayPage.page
      .getByRole('button', { name: /add.*payee/i });
    
    await addPayeeButton.click();

    const nameInput = billPayPage.page
      .getByLabel(/payee.*name|name/i)
      .or(billPayPage.page.getByPlaceholder(/name/i));
    
    await nameInput.fill('Electric Company');

    const accountInput = billPayPage.page
      .getByLabel(/account.*number/i)
      .or(billPayPage.page.getByPlaceholder(/account/i));
    
    await accountInput.fill('123456789');

    const addressInput = billPayPage.page
      .getByLabel(/address/i)
      .or(billPayPage.page.getByPlaceholder(/address/i));
    
    await addressInput.fill('123 Main St');

    const saveButton = billPayPage.page
      .getByRole('button', { name: /save|add/i });
    
    await saveButton.click();

    const successMessage = billPayPage.page
      .getByRole('alert')
      .or(billPayPage.page.getByText(/added|created/i));
    
    await billExpect(successMessage).toBeVisible();

    billLogger.info('Payee added successfully');
  });

  billTest('should make a one-time payment', async ({ billPayPage, testAccount }) => {
    await billPayPage.navigate();

    const makePaymentButton = billPayPage.page
      .getByRole('button', { name: /make.*payment|pay/i });
    
    await makePaymentButton.click();

    const payeeSelect = billPayPage.page
      .getByLabel(/payee/i)
      .or(billPayPage.page.getByRole('combobox', { name: /payee/i }));
    
    await payeeSelect.selectOption({ index: 1 }); // Select first payee

    const accountSelect = billPayPage.page
      .getByLabel(/from.*account|account/i)
      .or(billPayPage.page.getByRole('combobox', { name: /account/i }));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const amountInput = billPayPage.page
      .getByLabel(/amount/i)
      .or(billPayPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('89.99');

    const dateInput = billPayPage.page
      .getByLabel(/date/i);
    
    if (await dateInput.count() > 0) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      await dateInput.fill(futureDate.toISOString().split('T')[0]);
    }

    const submitButton = billPayPage.page
      .getByRole('button', { name: /submit|pay|process/i });
    
    await submitButton.click();

    const confirmationMessage = billPayPage.page
      .getByRole('alert')
      .or(billPayPage.page.getByText(/success|scheduled|completed/i));
    
    await billExpect(confirmationMessage).toBeVisible();

    billLogger.info('One-time payment completed');
  });
});
