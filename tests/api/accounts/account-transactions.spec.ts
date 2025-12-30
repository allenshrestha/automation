/**
 * tests/api/accounts/account-transactions.spec.ts
 * 
 * REAL-WORLD SCENARIO: Account transaction API testing
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
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { db } from '@lib/core/db';
import { transactionSchema } from '@schemas/transaction.schema';
import dayjs from 'dayjs';

test.describe('Account API - Transactions', () => {
  let testAccountNumber: string;
  let authToken: string;

  test.beforeAll(async () => {
    // Setup: Create test account with transactions
    testAccountNumber = TestData.account().accountNumber;
    
    // Login to get auth token
    const loginResponse = await bannoApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    bannoApi.setAuthToken(authToken);
    
    logger.info({ testAccountNumber }, 'Test setup complete');
  });

  test('GET /transactions - should return transaction history', async () => {
    const tracker = monitor.trackTest('get-transactions');

    try {
      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions`
      );

      // Verify status
      expect(response.status).toBe(200);

      // Verify response structure
      expect(response.data).toHaveProperty('transactions');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('pageSize');

      // Verify transactions array
      expect(Array.isArray(response.data.transactions)).toBeTruthy();
      expect(response.data.transactions.length).toBeGreaterThan(0);

      // Validate first transaction schema
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

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should support pagination', async () => {
    const tracker = monitor.trackTest('transactions-pagination');

    try {
      // Get first page
      const page1Response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?page=1&pageSize=10`
      );

      expect(page1Response.status).toBe(200);
      expect(page1Response.data.page).toBe(1);
      expect(page1Response.data.pageSize).toBe(10);
      expect(page1Response.data.transactions.length).toBeLessThanOrEqual(10);

      // Get second page
      const page2Response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?page=2&pageSize=10`
      );

      expect(page2Response.status).toBe(200);
      expect(page2Response.data.page).toBe(2);

      // Verify different transactions on different pages
      const page1Ids = page1Response.data.transactions.map((t: any) => t.transactionId);
      const page2Ids = page2Response.data.transactions.map((t: any) => t.transactionId);

      const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
      expect(hasOverlap).toBeFalsy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should filter by date range', async () => {
    const tracker = monitor.trackTest('transactions-date-filter');

    try {
      const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');

      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?startDate=${startDate}&endDate=${endDate}`
      );

      expect(response.status).toBe(200);

      // Verify all transactions are within date range
      response.data.transactions.forEach((transaction: any) => {
        const txDate = dayjs(transaction.date);
        expect(txDate.isAfter(startDate) || txDate.isSame(startDate, 'day')).toBeTruthy();
        expect(txDate.isBefore(endDate) || txDate.isSame(endDate, 'day')).toBeTruthy();
      });

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should filter by transaction type', async () => {
    const tracker = monitor.trackTest('transactions-type-filter');

    try {
      const transactionType = 'Deposit';

      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?type=${transactionType}`
      );

      expect(response.status).toBe(200);

      // Verify all transactions match type
      response.data.transactions.forEach((transaction: any) => {
        expect(transaction.type).toBe(transactionType);
      });

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should filter by amount range', async () => {
    const tracker = monitor.trackTest('transactions-amount-filter');

    try {
      const minAmount = 100;
      const maxAmount = 1000;

      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?minAmount=${minAmount}&maxAmount=${maxAmount}`
      );

      expect(response.status).toBe(200);

      // Verify all transactions are within amount range
      response.data.transactions.forEach((transaction: any) => {
        expect(transaction.amount).toBeGreaterThanOrEqual(minAmount);
        expect(transaction.amount).toBeLessThanOrEqual(maxAmount);
      });

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions/:id - should get transaction details', async () => {
    const tracker = monitor.trackTest('get-transaction-details');

    try {
      // First, get list of transactions
      const listResponse = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions`
      );

      const transactionId = listResponse.data.transactions[0].transactionId;

      // Get specific transaction
      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions/${transactionId}`
      );

      expect(response.status).toBe(200);
      expect(response.data.transactionId).toBe(transactionId);

      // Validate schema
      bannoApi.validateSchema(response.data, transactionSchema);

      // Verify detailed fields present
      expect(response.data).toHaveProperty('description');
      expect(response.data).toHaveProperty('balance');
      expect(response.data).toHaveProperty('status');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should return 404 for non-existent account', async () => {
    const tracker = monitor.trackTest('transactions-404');

    try {
      const response = await bannoApi
        .get('/api/accounts/999999999999/transactions')
        .catch((e) => e.response);

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Account not found');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should handle invalid date format', async () => {
    const tracker = monitor.trackTest('transactions-invalid-date');

    try {
      const response = await bannoApi
        .get(`/api/accounts/${testAccountNumber}/transactions?startDate=invalid-date`)
        .catch((e) => e.response);

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Invalid date format');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should require authentication', async () => {
    const tracker = monitor.trackTest('transactions-auth-required');

    try {
      // Remove auth token
      bannoApi.removeAuthToken();

      const response = await bannoApi
        .get(`/api/accounts/${testAccountNumber}/transactions`)
        .catch((e) => e.response);

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');

      // Restore auth token
      bannoApi.setAuthToken(authToken);

      tracker.end('passed');
    } catch (error: any) {
      bannoApi.setAuthToken(authToken); // Restore on error
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should handle rate limiting', async () => {
    const tracker = monitor.trackTest('transactions-rate-limit');

    try {
      // Make many rapid requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          bannoApi
            .get(`/api/accounts/${testAccountNumber}/transactions`)
            .catch((e) => e.response)
        );
      }

      const responses = await Promise.all(requests);

      // Check if any requests were rate limited
      const rateLimited = responses.filter((r) => r.status === 429);

      if (rateLimited.length > 0) {
        logger.info({ rateLimitedCount: rateLimited.length }, 'Rate limiting detected');
        
        // Verify rate limit response
        expect(rateLimited[0].data).toHaveProperty('error');
        expect(rateLimited[0].data.error).toContain('rate limit');
        
        // Verify Retry-After header
        expect(rateLimited[0].headers).toHaveProperty('retry-after');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - performance test', async () => {
    const tracker = monitor.trackTest('transactions-performance');

    try {
      const startTime = Date.now();

      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?pageSize=100`
      );

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000); // Should respond in < 2 seconds

      logger.info({ duration, count: response.data.transactions.length }, 'Performance measured');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('GET /transactions - should support search query', async () => {
    const tracker = monitor.trackTest('transactions-search');

    try {
      const searchQuery = 'Amazon';

      const response = await bannoApi.get(
        `/api/accounts/${testAccountNumber}/transactions?search=${searchQuery}`
      );

      expect(response.status).toBe(200);

      // Verify results contain search term
      response.data.transactions.forEach((transaction: any) => {
        const matchesDescription = transaction.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesMerchant = transaction.merchant
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

        expect(matchesDescription || matchesMerchant).toBeTruthy();
      });

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    // Cleanup: Remove test data
    try {
      await db.cleanup('transactions', `account_number = '${testAccountNumber}'`);
      await db.cleanup('accounts', `account_number = '${testAccountNumber}'`);
      logger.info('Test cleanup complete');
    } catch (error) {
      logger.warn('Cleanup failed - manual cleanup may be needed');
    }
  });
});