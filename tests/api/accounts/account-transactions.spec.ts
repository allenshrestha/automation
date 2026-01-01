/**
 * tests/api/accounts/account-transactions.spec.ts
 * 
 * MODERNIZED: No try-catch, uses fixtures, clean assertions
 * 
 * Coverage:
 * - Transaction history retrieval
 * - Transaction filtering
 * - Transaction details
 * - Pagination
 * - Rate limiting
 * - Error handling
 */

import { test, expect } from '@playwright/test';
import { bannoApi } from '@lib/core/api';
import { logger } from '@lib/core/logger';
import { transactionSchema } from '@schemas/transaction.schema';
import dayjs from 'dayjs';

test.describe('Account API - Transactions', () => {
  let testAccountNumber: string;
  let authToken: string;

  test.beforeAll(async () => {
    // Setup: Create test account with transactions
    const accountData = {
      accountType: 'Checking',
      balance: 5000,
      accountName: 'Transaction Test Account',
    };
    
    const accountResponse = await bannoApi.post('/api/accounts', accountData);
    testAccountNumber = accountResponse.data.accountNumber;
    
    // Login to get auth token
    const loginResponse = await bannoApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    bannoApi.setAuthToken(authToken);
    
    // Create test transactions
    await bannoApi.post(`/api/accounts/${testAccountNumber}/transactions`, {
      type: 'Deposit',
      amount: 1000,
      description: 'Initial deposit',
    });

    await bannoApi.post(`/api/accounts/${testAccountNumber}/transactions`, {
      type: 'Withdrawal',
      amount: 200,
      description: 'ATM withdrawal',
    });
    
    logger.info({ testAccountNumber }, 'Test setup complete');
  });

  test('GET /transactions - should return transaction history', async () => {
    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions`
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('transactions');
    expect(response.data).toHaveProperty('total');
    expect(response.data).toHaveProperty('page');
    expect(response.data).toHaveProperty('pageSize');

    expect(Array.isArray(response.data.transactions)).toBeTruthy();
    expect(response.data.transactions.length).toBeGreaterThan(0);

    if (response.data.transactions.length > 0) {
      bannoApi.validateSchema(response.data.transactions[0], transactionSchema);
    }

    // Verify transactions are sorted by date (newest first)
    const transactions = response.data.transactions;
    for (let i = 0; i < transactions.length - 1; i++) {
      const date1 = new Date(transactions[i].date);
      const date2 = new Date(transactions[i + 1].date);
      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
    }

    logger.info({ 
      count: response.data.transactions.length,
      total: response.data.total 
    }, 'Transactions retrieved');
  });

  test('GET /transactions - should support pagination', async () => {
    const page1Response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?page=1&pageSize=10`
    );

    expect(page1Response.status).toBe(200);
    expect(page1Response.data.page).toBe(1);
    expect(page1Response.data.pageSize).toBe(10);
    expect(page1Response.data.transactions.length).toBeLessThanOrEqual(10);

    const page2Response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?page=2&pageSize=10`
    );

    expect(page2Response.status).toBe(200);
    expect(page2Response.data.page).toBe(2);

    const page1Ids = page1Response.data.transactions.map((t: any) => t.transactionId);
    const page2Ids = page2Response.data.transactions.map((t: any) => t.transactionId);

    const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
    expect(hasOverlap).toBeFalsy();

    logger.info('Pagination verified');
  });

  test('GET /transactions - should filter by date range', async () => {
    const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');

    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?startDate=${startDate}&endDate=${endDate}`
    );

    expect(response.status).toBe(200);

    response.data.transactions.forEach((transaction: any) => {
      const txDate = dayjs(transaction.date);
      expect(txDate.isAfter(startDate) || txDate.isSame(startDate, 'day')).toBeTruthy();
      expect(txDate.isBefore(endDate) || txDate.isSame(endDate, 'day')).toBeTruthy();
    });

    logger.info({ startDate, endDate }, 'Date filter verified');
  });

  test('GET /transactions - should filter by transaction type', async () => {
    const transactionType = 'Deposit';

    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?type=${transactionType}`
    );

    expect(response.status).toBe(200);

    response.data.transactions.forEach((transaction: any) => {
      expect(transaction.type).toBe(transactionType);
    });

    logger.info({ type: transactionType }, 'Type filter verified');
  });

  test('GET /transactions - should filter by amount range', async () => {
    const minAmount = 100;
    const maxAmount = 1000;

    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?minAmount=${minAmount}&maxAmount=${maxAmount}`
    );

    expect(response.status).toBe(200);

    response.data.transactions.forEach((transaction: any) => {
      expect(transaction.amount).toBeGreaterThanOrEqual(minAmount);
      expect(transaction.amount).toBeLessThanOrEqual(maxAmount);
    });

    logger.info({ minAmount, maxAmount }, 'Amount filter verified');
  });

  test('GET /transactions/:id - should get transaction details', async () => {
    const listResponse = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions`
    );

    const transactionId = listResponse.data.transactions[0].transactionId;

    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions/${transactionId}`
    );

    expect(response.status).toBe(200);
    expect(response.data.transactionId).toBe(transactionId);

    bannoApi.validateSchema(response.data, transactionSchema);

    expect(response.data).toHaveProperty('description');
    expect(response.data).toHaveProperty('balance');
    expect(response.data).toHaveProperty('status');

    logger.info({ transactionId }, 'Transaction details retrieved');
  });

  test('GET /transactions - should return 404 for non-existent account', async () => {
    const response = await bannoApi
      .get('/api/accounts/999999999999/transactions')
      .catch((e) => e.response);

    expect(response.status).toBe(404);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toContain('Account not found');
  });

  test('GET /transactions - should handle invalid date format', async () => {
    const response = await bannoApi
      .get(`/api/accounts/${testAccountNumber}/transactions?startDate=invalid-date`)
      .catch((e) => e.response);

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toContain('Invalid date format');
  });

  test('GET /transactions - should require authentication', async () => {
    bannoApi.removeAuthToken();

    const response = await bannoApi
      .get(`/api/accounts/${testAccountNumber}/transactions`)
      .catch((e) => e.response);

    expect(response.status).toBe(401);
    expect(response.data).toHaveProperty('error');

    bannoApi.setAuthToken(authToken);
  });

  test('GET /transactions - should handle rate limiting', async () => {
    const requests = [];
    for (let i = 0; i < 100; i++) {
      requests.push(
        bannoApi
          .get(`/api/accounts/${testAccountNumber}/transactions`)
          .catch((e) => e.response)
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status === 429);

    if (rateLimited.length > 0) {
      logger.info({ rateLimitedCount: rateLimited.length }, 'Rate limiting detected');
      
      expect(rateLimited[0].data).toHaveProperty('error');
      expect(rateLimited[0].data.error).toContain('rate limit');
      expect(rateLimited[0].headers).toHaveProperty('retry-after');
    }
  });

  test('GET /transactions - performance test', async () => {
    const startTime = Date.now();

    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?pageSize=100`
    );

    const duration = Date.now() - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000);

    logger.info({ duration, count: response.data.transactions.length }, 'Performance measured');
  });

  test('GET /transactions - should support search query', async () => {
    const searchQuery = 'deposit';

    const response = await bannoApi.get(
      `/api/accounts/${testAccountNumber}/transactions?search=${searchQuery}`
    );

    expect(response.status).toBe(200);

    response.data.transactions.forEach((transaction: any) => {
      const matchesDescription = transaction.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesMerchant = transaction.merchant
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      expect(matchesDescription || matchesMerchant).toBeTruthy();
    });

    logger.info({ searchQuery }, 'Search verified');
  });

  test.afterAll(async () => {
    try {
      await bannoApi.delete(`/api/accounts/${testAccountNumber}`);
      logger.info('Test cleanup complete');
    } catch (error) {
      logger.warn('Cleanup failed');
    }
  });
});