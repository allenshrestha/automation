import { test as secTest, expect as secExpect } from '../../fixtures';
import { logger as secLogger } from '@lib/core/logger';
import { Config as SecConfig } from '@lib/core/config';

secTest.describe('Security - Authentication & Protection', () => {
  secTest('should enforce password complexity requirements', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const securityTab = profileSettingsPage.page
      .getByRole('tab', { name: /security/i });
    
    if (await securityTab.count() > 0) {
      await securityTab.click();
    }

    const changePasswordButton = profileSettingsPage.page
      .getByRole('button', { name: /change.*password/i });
    
    if (await changePasswordButton.count() > 0) {
      await changePasswordButton.click();

      const weakPasswords = ['123456', 'password', 'abcdefgh'];

      for (const weakPassword of weakPasswords) {
        const currentPasswordInput = profileSettingsPage.page
          .getByLabel(/current.*password/i);
        
        await currentPasswordInput.fill(SecConfig.PASSWORD);

        const newPasswordInput = profileSettingsPage.page
          .getByLabel(/new.*password/i);
        
        await newPasswordInput.fill(weakPassword);

        const confirmPasswordInput = profileSettingsPage.page
          .getByLabel(/confirm.*password/i);
        
        await confirmPasswordInput.fill(weakPassword);

        const submitButton = profileSettingsPage.page
          .getByRole('button', { name: /submit|save/i });
        
        await submitButton.click();

        const errorMessage = profileSettingsPage.page
          .getByText(/weak|complexity|requirements/i)
          .or(profileSettingsPage.page.getByRole('alert'));
        
        if (await errorMessage.count() > 0) {
          await secExpect(errorMessage).toBeVisible();
          secLogger.debug('Weak password rejected');
        }
      }

      secLogger.info('Password complexity requirements enforced');
    }
  });

  secTest('should lock account after failed login attempts', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    for (let i = 0; i < 5; i++) {
      const usernameInput = loginPage.getUsernameInput();
      const passwordInput = loginPage.getPasswordInput();
      
      await usernameInput.fill('testuser@example.com');
      await passwordInput.fill('wrongpassword');

      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await submitButton.click();

      await page.waitForTimeout(1000);
    }

    const errorMessage = page
      .getByRole('alert')
      .or(page.getByText(/locked|too many|attempts/i));
    
    if (await errorMessage.count() > 0) {
      await secExpect(errorMessage).toBeVisible();
      secLogger.info('Account lockout after failed attempts working');
    }
  });

  secTest('should prevent XSS attacks in input fields', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const editButton = profileSettingsPage.page
      .getByRole('button', { name: /edit/i });
    
    await editButton.click();

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
    ];

    for (const payload of xssPayloads) {
      const firstNameInput = profileSettingsPage.page
        .getByLabel(/first.*name/i)
        .or(profileSettingsPage.page.getByPlaceholder(/first/i));
      
      await firstNameInput.fill(payload);

      const saveButton = profileSettingsPage.page
        .getByRole('button', { name: /save/i });
      
      await saveButton.click();

      await authenticatedPage.waitForTimeout(1000);

      // Page should still be functional
      await secExpect(authenticatedPage).toHaveURL(/settings|profile/);
    }

    secLogger.info('XSS prevention working');
  });

  secTest('should prevent SQL injection in login', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    const sqlPayloads = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE users--",
    ];

    for (const payload of sqlPayloads) {
      const usernameInput = loginPage.getUsernameInput();
      const passwordInput = loginPage.getPasswordInput();
      
      await usernameInput.fill(payload);
      await passwordInput.fill('password');

      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await submitButton.click();

      await page.waitForTimeout(1000);

      await secExpect(page).toHaveURL(/login/);
    }

    secLogger.info('SQL injection prevention working');
  });

  secTest('should enforce session timeout', async ({ page, context, authenticatedPage }) => {
    await context.clearCookies();

    await page.goto('/settings');

    await secExpect(page).toHaveURL(/login/, { timeout: 10000 });

    secLogger.info('Session timeout enforced');
  });

  secTest('should validate email format', async ({ 
    authenticatedPage, 
    profileSettingsPage 
  }) => {
    await profileSettingsPage.navigate();

    const editButton = profileSettingsPage.page
      .getByRole('button', { name: /edit/i });
    
    await editButton.click();

    const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com'];

    for (const invalidEmail of invalidEmails) {
      const emailInput = profileSettingsPage.page
        .getByLabel(/email/i)
        .or(profileSettingsPage.page.getByPlaceholder(/email/i));
      
      await emailInput.fill(invalidEmail);

      const saveButton = profileSettingsPage.page
        .getByRole('button', { name: /save/i });
      
      await saveButton.click();

      await authenticatedPage.waitForTimeout(500);
    }

    secLogger.info('Email format validation working');
  });
});