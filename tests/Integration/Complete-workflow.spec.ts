import { test as workflowTest, expect as workflowExpect } from '../fixtures';
import { bannoApi as wfApi } from '@lib/core/api';
import { logger as wfLogger } from '@lib/core/logger';
import { memberSchema as wfMemberSchema } from '@schemas/member.schema';
import { accountSchema as wfAccountSchema } from '@schemas/account.schema';
import { transactionSchema as wfTransactionSchema } from '@schemas/transaction.schema';

workflowTest.describe('Integration - Complete Member Onboarding', () => {
  let newMember: any;
  let memberId: string;
  let accountNumber: string;
  let authToken: string;

  workflowTest.beforeAll(async () => {
    newMember = {
      firstName: 'Workflow',
      lastName: `Test${Date.now()}`,
      email: `workflow.${Date.now()}@example.com`,
      phone: '555-777-8888',
      dateOfBirth: '1988-03-15',
      ssn: '456-78-9012',
      address: {
        line1: '789 Workflow Ave',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      },
    };
    
    const loginResponse = await wfApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    wfApi.setAuthToken(authToken);
    
    wfLogger.info({ member: newMember.email }, 'Integration test setup complete');
  });

  workflowTest('STEP 1: Create member via API', async () => {
    const response = await wfApi.post('/api/members', newMember);

    workflowExpect(response.status).toBe(201);
    workflowExpect(response.data).toHaveProperty('id');

    wfApi.validateSchema(response.data, wfMemberSchema);

    memberId = response.data.id;
    
    wfLogger.info({ memberId }, 'Member created successfully');
  });

  workflowTest('STEP 2: Verify member searchable in UI', async ({ authenticatedPage, memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search|email/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill(newMember.email);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const resultRow = memberSearchPage.page
      .getByText(newMember.email)
      .or(memberSearchPage.page.getByText(newMember.lastName));
    
    await workflowExpect(resultRow).toBeVisible();

    wfLogger.info('Member searchable in UI');
  });

  workflowTest('STEP 3: Open checking account for member', async ({ authenticatedPage, accountOpeningPage }) => {
    await accountOpeningPage.navigate();

    const accountTypeSelect = accountOpeningPage.page
      .getByLabel(/account.*type/i)
      .or(accountOpeningPage.page.getByRole('combobox', { name: /type/i }));
    
    await accountTypeSelect.selectOption('Checking');

    const accountNameInput = accountOpeningPage.page
      .getByLabel(/account.*name/i)
      .or(accountOpeningPage.page.getByPlaceholder(/name/i));
    
    await accountNameInput.fill('Checking Account');

    const depositInput = accountOpeningPage.page
      .getByLabel(/initial.*deposit/i)
      .or(accountOpeningPage.page.getByPlaceholder(/deposit/i));
    
    await depositInput.fill('500');

    const termsCheckbox = accountOpeningPage.page
      .getByLabel(/terms|agree/i)
      .or(accountOpeningPage.page.getByRole('checkbox'));
    
    await termsCheckbox.check();

    const submitButton = accountOpeningPage.page
      .getByRole('button', { name: /submit|open/i });
    
    await submitButton.click();

    const confirmationMessage = accountOpeningPage.page
      .getByRole('alert')
      .or(accountOpeningPage.page.getByText(/success|account.*opened/i));
    
    await workflowExpect(confirmationMessage).toBeVisible();

    const accountNumberDisplay = accountOpeningPage.page
      .getByText(/account.*number/i)
      .or(accountOpeningPage.page.getByTestId('account-number'));
    
    const accountNumberText = await accountNumberDisplay.textContent();
    accountNumber = accountNumberText?.match(/\d+/)?.[0] || '';
    
    workflowExpect(accountNumber).toBeTruthy();

    wfLogger.info({ accountNumber }, 'Account opened successfully');
  });

  workflowTest('STEP 4: Verify account via API', async () => {
    const response = await wfApi.get(`/api/accounts/${accountNumber}`);

    workflowExpect(response.status).toBe(200);
    workflowExpect(response.data.accountNumber).toBe(accountNumber);
    workflowExpect(response.data.accountType).toBe('Checking');
    workflowExpect(response.data.balance).toBeGreaterThanOrEqual(500);

    wfApi.validateSchema(response.data, wfAccountSchema);

    wfLogger.info({ account: response.data }, 'Account verified via API');
  });

  workflowTest('STEP 5: Make first deposit', async ({ authenticatedPage, transactionPage }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(accountNumber);

    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Deposit');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i)
      .or(transactionPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('1000');

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i)
      .or(transactionPage.page.getByPlaceholder(/description/i));
    
    await descriptionInput.fill('Initial deposit');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const successMessage = transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/success|completed/i));
    
    await workflowExpect(successMessage).toBeVisible();

    wfLogger.info({ amount: 1000 }, 'Deposit completed');
  });

  workflowTest('STEP 6: Verify transaction via API', async () => {
    const response = await wfApi.get(`/api/accounts/${accountNumber}/transactions`);

    workflowExpect(response.status).toBe(200);
    workflowExpect(response.data.transactions.length).toBeGreaterThan(0);

    const depositTransaction = response.data.transactions.find(
      (t: any) => t.type === 'Deposit' && t.amount === 1000
    );

    workflowExpect(depositTransaction).toBeTruthy();
    workflowExpect(depositTransaction.status).toBe('Posted');

    wfApi.validateSchema(depositTransaction, wfTransactionSchema);

    wfLogger.info({ transaction: depositTransaction }, 'Transaction verified');
  });

  workflowTest('STEP 7: Verify final account balance', async () => {
    const response = await wfApi.get(`/api/accounts/${accountNumber}`);

    workflowExpect(response.status).toBe(200);
    workflowExpect(response.data.balance).toBe(1500); // 500 initial + 1000 deposit

    wfLogger.info({ balance: response.data.balance }, 'Final balance verified');
  });

  workflowTest.afterAll(async () => {
    try {
      if (accountNumber) await wfApi.delete(`/api/accounts/${accountNumber}`);
      if (memberId) await wfApi.delete(`/api/members/${memberId}`);
      wfLogger.info('Workflow cleanup complete');
    } catch (error) {
      wfLogger.warn('Cleanup failed');
    }
  });
});