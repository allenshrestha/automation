import { test, expect } from '@playwright/test';
import { PageHelper } from '@lib/core/page';
import { Config } from '@lib/core/config';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { LoginPage } from '@pages/LoginPage';

/**
 * AUTHENTICATION - LOGIN FLOW
 * 
 * Tests: User authentication and session management
 * Keywords: e2e, authentication, login, session
 * Priority: P0 (Critical Path)
 */

test.describe('Authentication - Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
  });

  test('should login with valid credentials', async ({ page }) => {
    const tracker = monitor.trackTest('login-valid-credentials');
    
    try {
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      
      // Wait for dashboard
      await Wait.forUrl(page, /dashboard/, 10000);
      
      // Verify logged in
      expect(await loginPage.isLoggedIn()).toBeTruthy();
      
      // Verify user profile visible
      const helper = new PageHelper(page);
      expect(await helper.isVisible('[data-testid="user-profile"]')).toBeTruthy();
      
      logger.info({ user: Config.USERNAME }, 'Login successful');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const tracker = monitor.trackTest('login-invalid-credentials');
    
    try {
      await loginPage.login('invalid@email.com', 'wrongpassword');
      
      // Verify error message
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid credentials');
      
      // Verify still on login page
      await expect(page).toHaveURL(/login/);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should show validation for empty fields', async ({ page }) => {
    const tracker = monitor.trackTest('login-empty-fields');
    
    try {
      const helper = new PageHelper(page);
      
      // Try to submit without filling
      await helper.click('button[type="submit"]');
      
      // Verify validation messages
      const emailError = await helper.isVisible('.email-error');
      const passwordError = await helper.isVisible('.password-error');
      
      expect(emailError || passwordError).toBeTruthy();
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should maintain session after page reload', async ({ page, context }) => {
    const tracker = monitor.trackTest('login-session-persistence');
    
    try {
      // Login
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/);
      
      // Save session
      await context.storageState({ path: 'auth.json' });
      
      // Reload page
      await page.reload();
      
      // Verify still logged in
      await Wait.forUrl(page, /dashboard/);
      expect(await loginPage.isLoggedIn()).toBeTruthy();
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should logout successfully', async ({ page }) => {
    const tracker = monitor.trackTest('logout-flow');
    
    try {
      // Login first
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/);
      
      // Logout
      const helper = new PageHelper(page);
      await helper.click('[data-testid="logout-btn"]');
      
      // Verify redirected to login
      await Wait.forUrl(page, /login/);
      
      // Verify cannot access protected route
      await page.goto(Config.BANNO_BASE_URL + '/dashboard');
      await Wait.forUrl(page, /login/);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });
});