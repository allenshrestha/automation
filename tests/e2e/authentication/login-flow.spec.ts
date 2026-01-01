import { test as loginTest, expect as loginExpect } from '../../fixtures';
import { logger as loginLogger } from '@lib/core/logger';
import { Config } from '@lib/core/config';

loginTest.describe('Authentication - Login Flow', () => {
  loginTest('should login with valid credentials', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();
    
    const usernameInput = loginPage.getUsernameInput();
    const passwordInput = loginPage.getPasswordInput();
    
    await usernameInput.fill(Config.USERNAME);
    await passwordInput.fill(Config.PASSWORD);

    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    await loginExpect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    
    const userProfile = page
      .getByRole('button', { name: /profile|account/i })
      .or(page.getByTestId('user-profile'));
    
    await loginExpect(userProfile).toBeVisible();
    
    loginLogger.info({ user: Config.USERNAME }, 'Login successful');
  });

  loginTest('should show error with invalid credentials', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();
    
    const usernameInput = loginPage.getUsernameInput();
    const passwordInput = loginPage.getPasswordInput();
    
    await usernameInput.fill('invalid@email.com');
    await passwordInput.fill('wrongpassword');

    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    const errorMessage = page
      .getByRole('alert')
      .or(page.getByText(/invalid|incorrect/i));
    
    await loginExpect(errorMessage).toBeVisible();
    await loginExpect(page).toHaveURL(/login/);

    loginLogger.info('Invalid credentials rejected');
  });

  loginTest('should show validation for empty fields', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();
    
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    const validationMessages = await page
      .getByText(/required/i)
      .or(page.getByRole('alert'))
      .all();
    
    loginExpect(validationMessages.length).toBeGreaterThan(0);

    loginLogger.info('Empty field validation working');
  });

  loginTest('should logout successfully', async ({ page, authenticatedPage, dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();
    
    const profileButton = page
      .getByRole('button', { name: /profile|account/i })
      .or(page.getByTestId('user-profile'));
    
    await profileButton.click();

    const logoutButton = page
      .getByRole('menuitem', { name: /logout|sign out/i })
      .or(page.getByRole('button', { name: /logout|sign out/i }));
    
    await logoutButton.click();
    
    await loginExpect(page).toHaveURL(/login/, { timeout: 10000 });

    await page.goto('/dashboard');
    await loginExpect(page).toHaveURL(/login/, { timeout: 10000 });
    
    loginLogger.info('Logout successful');
  });
});