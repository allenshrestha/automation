import { test, expect } from '../fixtures';
import { bannoApi } from '@lib/core/api';
import { logger } from '@lib/core/logger';
import { memberSchema } from '@schemas/member.schema';
import { accountSchema } from '@schemas/account.schema';

test.describe('Integration - API + E2E Workflows', () => {
  let authToken: string;

  test.beforeAll(async () => {
    const loginResponse = await bannoApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    bannoApi.setAuthToken(authToken);
    
    logger.info('API authentication complete');
  });

  test('API→UI: Create member via API, verify in UI', async ({ authenticatedPage, memberSearchPage }) => {
    const memberData = {
      firstName: 'API',
      lastName: `Test${Date.now()}`,
      email: `api.test.${Date.now()}@example.com`,
      phone: '555-111-2222',
      dateOfBirth: '1990-01-01',
      ssn: '123-45-6789',
      address: {
        line1: '123 API St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      },
    };
    
    const apiResponse = await bannoApi.post('/api/members', memberData);
    expect(apiResponse.status).toBe(201);
    const memberId = apiResponse.data.id;
    
    bannoApi.validateSchema(apiResponse.data, memberSchema);
    
    logger.info({ memberId, email: memberData.email }, 'Member created via API');

    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search|email/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill(memberData.email);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const resultRow = memberSearchPage.page
      .getByText(memberData.lastName)
      .or(memberSearchPage.page.getByText(memberData.email));
    
    await expect(resultRow).toBeVisible();

    logger.info('Member verified in UI');

    await bannoApi.delete(`/api/members/${memberId}`);
  });

  test('UI→API: Update member in UI, verify via API', async ({ 
    authenticatedPage, 
    memberSearchPage, 
    memberDetailsPage, 
    testMember 
  }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search|email/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill(testMember.email);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const firstResult = memberSearchPage.page
      .getByText(testMember.email)
      .or(memberSearchPage.page.getByRole('row').first());
    
    await firstResult.click();

    await expect(memberDetailsPage.page).toHaveURL(/members/);

    const editButton = memberDetailsPage.page
      .getByRole('button', { name: /edit/i });
    
    await editButton.click();

    const phoneInput = memberDetailsPage.page
      .getByLabel(/phone/i)
      .or(memberDetailsPage.page.getByPlaceholder(/phone/i));
    
    const newPhone = '555-999-8888';
    await phoneInput.fill(newPhone);

    const saveButton = memberDetailsPage.page
      .getByRole('button', { name: /save/i });
    
    await saveButton.click();

    const successMessage = memberDetailsPage.page
      .getByRole('alert')
      .or(memberDetailsPage.page.getByText(/saved|updated/i));
    
    await expect(successMessage).toBeVisible();

    logger.info({ newPhone }, 'Member updated in UI');

    const apiResponse = await bannoApi.get(`/api/members/${testMember.memberId}`);
    
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.data.phone).toBe(newPhone);

    logger.info('Update verified via API');
  });

  test('Mixed: Create account via API, transaction in UI, verify via API', async ({ 
    authenticatedPage, 
    transactionPage, 
    testAccount 
  }) => {
    const initialBalance = testAccount.balance;

    logger.info({ accountNumber: testAccount.accountNumber, initialBalance }, 'Account created via API');

    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const depositAmount = 500;
    
    const typeSelect = transactionPage.page
      .getByLabel(/type/i)
      .or(transactionPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption('Deposit');
    }

    const amountInput = transactionPage.page
      .getByLabel(/amount/i)
      .or(transactionPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill(depositAmount.toString());

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i)
      .or(transactionPage.page.getByPlaceholder(/description/i));
    
    await descriptionInput.fill('Integration test deposit');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const successMessage = transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/success|completed/i));
    
    await expect(successMessage).toBeVisible();

    logger.info({ depositAmount }, 'Deposit made in UI');

    const balanceResponse = await bannoApi.get(`/api/accounts/${testAccount.accountNumber}`);
    
    expect(balanceResponse.status).toBe(200);
    expect(balanceResponse.data.balance).toBe(initialBalance + depositAmount);

    const txResponse = await bannoApi.get(`/api/accounts/${testAccount.accountNumber}/transactions`);
    
    const depositTransaction = txResponse.data.transactions.find(
      (t: any) => t.type === 'Deposit' && t.amount === depositAmount
    );
    
    expect(depositTransaction).toBeTruthy();
    expect(depositTransaction.description).toContain('Integration test deposit');

    logger.info('Balance and transaction verified via API');
  });

  test('Data Consistency: Update via UI, concurrent API read', async ({ 
    authenticatedPage, 
    memberSearchPage, 
    memberDetailsPage, 
    testMember 
  }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search|email/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill(testMember.email);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const firstResult = memberSearchPage.page
      .getByText(testMember.email)
      .or(memberSearchPage.page.getByRole('row').first());
    
    await firstResult.click();

    const editButton = memberDetailsPage.page
      .getByRole('button', { name: /edit/i });
    
    await editButton.click();

    const phoneInput = memberDetailsPage.page
      .getByLabel(/phone/i)
      .or(memberDetailsPage.page.getByPlaceholder(/phone/i));
    
    const newPhone = `555-${Date.now().toString().slice(-7)}`;
    await phoneInput.fill(newPhone);

    const saveButton = memberDetailsPage.page
      .getByRole('button', { name: /save/i });
    
    await saveButton.click();

    const successMessage = memberDetailsPage.page
      .getByRole('alert')
      .or(memberDetailsPage.page.getByText(/saved|updated/i));
    
    await expect(successMessage).toBeVisible();

    const apiResponse = await bannoApi.get(`/api/members/${testMember.memberId}`);
    expect(apiResponse.data.phone).toBe(newPhone);

    logger.info('Data consistency verified');
  });
});