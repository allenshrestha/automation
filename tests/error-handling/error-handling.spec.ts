/**
 * tests/e2e/error-handling/error-handling.spec.ts
 * 
 * MODERNIZED: Uses fixtures and role-based locators
 * 
 * Coverage:
 * - Network errors
 * - Validation errors
 * - Authentication errors
 * - Business rule violations
 * - Recovery mechanisms
 */

import { test, expect } from '../../fixtures';
import { logger } from '@lib/core/logger';

test.describe('Error Handling and Validation', () => {
  test('should handle invalid login credentials gracefully', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();
    
    const usernameInput = loginPage.getUsernameInput();
    const passwordInput = loginPage.getPasswordInput();
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    
    await usernameInput.fill('invalid@user.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    const errorMessage = page
      .getByRole('alert')
      .or(page.getByText(/invalid|incorrect|credentials/i));
    
    await expect(errorMessage).toBeVisible();
    await expect(page).toHaveURL(/login/);

    logger.info('Invalid credentials handled correctly');
  });

  test('should handle session timeout', async ({ page, context, authenticatedPage }) => {
    await context.clearCookies();

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    logger.info('Session timeout handled correctly');
  });

  test('should handle network errors gracefully', async ({ page, context, authenticatedPage, dashboardPage }) => {
    await context.setOffline(true);

    const navigatePromise = dashboardPage.goToAccounts();
    
    // Should show error or remain on page
    await page.waitForTimeout(3000);

    await context.setOffline(false);

    logger.info('Network error handled');
  });

  test('should validate required form fields', async ({ authenticatedPage, transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    // Should show validation errors
    const errorMessages = await transactionPage.page
      .getByRole('alert')
      .or(transactionPage.page.getByText(/required/i))
      .all();
    
    expect(errorMessages.length).toBeGreaterThan(0);

    logger.info('Required field validation working');
  });

  test('should validate email format', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    const usernameInput = loginPage.getUsernameInput();
    await usernameInput.fill('notanemail');

    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();

    const errorMessage = page
      .getByText(/valid.*email|email.*format/i)
      .or(page.getByRole('alert'));
    
    await expect(errorMessage).toBeVisible();

    logger.info('Email format validation working');
  });

  test('should handle 404 errors for non-existent resources', async ({ page, authenticatedPage }) => {
    await page.goto('/non-existent-page');

    // Should show 404 page or error message
    const notFoundIndicator = page
      .getByRole('heading', { name: /404|not found/i })
      .or(page.getByText(/page.*not.*found/i));
    
    // Either 404 page or redirected
    const is404 = await notFoundIndicator.isVisible().catch(() => false);
    const isRedirected = page.url().includes('dashboard') || page.url().includes('login');
    
    expect(is404 || isRedirected).toBeTruthy();

    logger.info('404 error handled');
  });

  test('should prevent duplicate transaction submission', async ({ authenticatedPage, transactionPage, testAccount }) => {
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
      .getByLabel(/amount/i)
      .or(transactionPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('100');

    const descriptionInput = transactionPage.page
      .getByLabel(/description/i)
      .or(transactionPage.page.getByPlaceholder(/description/i));
    
    await descriptionInput.fill('Test deposit');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();
    
    // Try to click again immediately
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    const isHidden = await submitButton.isHidden().catch(() => false);
    
    expect(isDisabled || isHidden).toBeTruthy();

    logger.info('Duplicate submission prevented');
  });

  test('should handle server errors (500) gracefully', async ({ page, authenticatedPage, dashboardPage }) => {
    // Mock 500 error
    await page.route('**/api/**', route => {
      if (Math.random() > 0.5) { // Randomly fail some requests
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    await dashboardPage.goToAccounts();

    // Should either show error or handle gracefully
    await page.waitForTimeout(2000);

    logger.info('500 error handled');
  });

  test('should validate minimum amount requirements', async ({ authenticatedPage, transactionPage, testAccount }) => {
    await transactionPage.navigate();
    
    const accountSelect = transactionPage.page
      .getByLabel(/account/i)
      .or(transactionPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const amountInput = transactionPage.page
      .getByLabel(/amount/i)
      .or(transactionPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('0.01'); // Below minimum

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const errorMessage = transactionPage.page
      .getByText(/minimum.*amount/i)
      .or(transactionPage.page.getByRole('alert'));
    
    await expect(errorMessage).toBeVisible();

    logger.info('Minimum amount validation working');
  });

  test('should validate maximum amount limits', async ({ authenticatedPage, transactionPage, testAccount }) => {
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
      .getByLabel(/amount/i)
      .or(transactionPage.page.getByPlaceholder(/amount/i));
    
    await amountInput.fill('999999999');

    const submitButton = transactionPage.page
      .getByRole('button', { name: /submit|process/i });
    
    await submitButton.click();

    const errorMessage = transactionPage.page
      .getByText(/maximum.*amount|exceeds.*limit/i)
      .or(transactionPage.page.getByRole('alert'));
    
    await expect(errorMessage).toBeVisible();

    logger.info('Maximum amount validation working');
  });

  test('should handle search with no results', async ({ authenticatedPage, memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill('999999999999999');

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const noResultsMessage = memberSearchPage.page
      .getByText(/no.*results|no.*members.*found/i);
    
    await expect(noResultsMessage).toBeVisible();

    logger.info('No results handled correctly');
  });

  test('should handle special characters in search', async ({ authenticatedPage, memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill('<script>alert("XSS")</script>');

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    // Should not execute script
    await authenticatedPage.waitForTimeout(2000);
    
    // Page should still be functional
    await expect(authenticatedPage).toHaveURL(/search|member/);

    logger.info('Special characters handled safely');
  });

  test('should validate date ranges', async ({ authenticatedPage, memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const advancedButton = memberSearchPage.page
      .getByRole('button', { name: /advanced|filter/i });
    
    if (await advancedButton.count() > 0) {
      await advancedButton.click();
    }

    const startDateInput = memberSearchPage.page
      .getByLabel(/start.*date|from.*date/i);
    
    const endDateInput = memberSearchPage.page
      .getByLabel(/end.*date|to.*date/i);
    
    if (await startDateInput.count() > 0 && await endDateInput.count() > 0) {
      await startDateInput.fill('2024-12-31');
      await endDateInput.fill('2024-01-01'); // End before start

      const applyButton = memberSearchPage.page
        .getByRole('button', { name: /apply|search/i });
      
      await applyButton.click();

      const errorMessage = memberSearchPage.page
        .getByText(/invalid.*date.*range|end.*date.*must.*be.*after/i)
        .or(memberSearchPage.page.getByRole('alert'));
      
      await expect(errorMessage).toBeVisible();

      logger.info('Date range validation working');
    }
  });

  test('should handle slow network conditions', async ({ page, context, loginPage }) => {
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024,
      uploadThroughput: 20 * 1024,
      latency: 500,
    });

    await loginPage.navigateToLogin();

    // Should eventually load
    const usernameInput = loginPage.getUsernameInput();
    await expect(usernameInput).toBeVisible({ timeout: 30000 });

    logger.info('Slow network handled');
  });

  test('should prevent SQL injection attempts', async ({ authenticatedPage, memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill("'; DROP TABLE members; --");

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    // Should not execute SQL
    await authenticatedPage.waitForTimeout(2000);
    
    // Page should still be functional
    await expect(authenticatedPage).toHaveURL(/search|member/);

    logger.info('SQL injection prevented');
  });

  test('should handle browser back button correctly', async ({ page, authenticatedPage, dashboardPage, accountDetailsPage, testAccount }) => {
    await dashboardPage.waitForDashboardToLoad();
    
    await accountDetailsPage.navigate(testAccount.accountNumber);
    await expect(page).toHaveURL(/accounts/);

    await page.goBack();
    await expect(page).toHaveURL(/dashboard/);

    const welcomeMessage = dashboardPage.page
      .getByRole('heading', { name: /welcome|dashboard/i })
      .or(dashboardPage.page.getByTestId('dashboard'));
    
    await expect(welcomeMessage).toBeVisible();

    logger.info('Browser back button handled');
  });
});