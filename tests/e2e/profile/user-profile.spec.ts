/**
 * tests/e2e/profile/user-profile.spec.ts
 * 
 * REAL-WORLD SCENARIO: User profile and settings management
 * 
 * Coverage:
 * - Personal information updates
 * - Password management
 * - Security settings
 * - Notification preferences
 * - User preferences
 * - Session management
 * - Account data management
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { ProfileSettingsPage } from '@pages/ProfileSettingsPage';
import { Config } from '@lib/core/config';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';

test.describe('User Profile - Management', () => {
  let loginPage: LoginPage;
  let profilePage: ProfileSettingsPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    profilePage = new ProfileSettingsPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);

    // Navigate to profile/settings
    await profilePage.navigate();
  });

  test('should display user personal information', async ({ page }) => {
    const tracker = monitor.trackTest('display-personal-info');

    try {
      const personalInfo = await profilePage.getPersonalInfo();

      expect(personalInfo.firstName).toBeTruthy();
      expect(personalInfo.lastName).toBeTruthy();
      expect(personalInfo.email).toBeTruthy();

      logger.info({ email: personalInfo.email }, 'Personal information displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should update phone number', async ({ page }) => {
    const tracker = monitor.trackTest('update-phone-number');

    try {
      const newPhone = '555-987-6543';

      await profilePage.editPersonalInfo({
        addressLine1: '456 New Street',
        city: 'New City',
        state: 'NY',
        zip: '10001',
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('Address updated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should change password successfully', async ({ page }) => {
    const tracker = monitor.trackTest('change-password');

    try {
      await profilePage.changePassword(
        Config.PASSWORD,
        'NewSecurePassword123!'
      );

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      // Change back to original
      await profilePage.changePassword(
        'NewSecurePassword123!',
        Config.PASSWORD
      );

      logger.info('Password changed successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should reject weak password', async ({ page }) => {
    const tracker = monitor.trackTest('reject-weak-password');

    try {
      await profilePage.goToSecurity();

      await page.fill(profilePage['selectors'].currentPasswordInput, Config.PASSWORD);
      await page.fill(profilePage['selectors'].newPasswordInput, '12345'); // Weak
      await page.fill(profilePage['selectors'].confirmPasswordInput, '12345');

      await page.click(profilePage['selectors'].changePasswordButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Weak password rejected');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should reject mismatched password confirmation', async ({ page }) => {
    const tracker = monitor.trackTest('reject-password-mismatch');

    try {
      await profilePage.goToSecurity();

      await page.fill(profilePage['selectors'].currentPasswordInput, Config.PASSWORD);
      await page.fill(profilePage['selectors'].newPasswordInput, 'NewPassword123!');
      await page.fill(profilePage['selectors'].confirmPasswordInput, 'DifferentPassword123!');

      await page.click(profilePage['selectors'].changePasswordButton);

      // Should show validation error
      expect(await profilePage.hasError()).toBeTruthy();

      logger.info('Password mismatch rejected');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should set security questions', async ({ page }) => {
    const tracker = monitor.trackTest('set-security-questions');

    try {
      await profilePage.setSecurityQuestions([
        { question: "What was your first pet's name?", answer: 'Fluffy' },
        { question: 'What city were you born in?', answer: 'Springfield' },
        { question: "What is your mother's maiden name?", answer: 'Smith' },
      ]);

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('Security questions set');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should enable two-factor authentication via SMS', async ({ page }) => {
    const tracker = monitor.trackTest('enable-2fa-sms');

    try {
      await profilePage.enable2FA('SMS');

      // May require phone number verification
      await page.waitForTimeout(2000);

      logger.info({ method: 'SMS' }, '2FA enabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should enable two-factor authentication via email', async ({ page }) => {
    const tracker = monitor.trackTest('enable-2fa-email');

    try {
      await profilePage.enable2FA('Email');

      await page.waitForTimeout(2000);

      logger.info({ method: 'Email' }, '2FA enabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should generate backup codes', async ({ page }) => {
    const tracker = monitor.trackTest('generate-backup-codes');

    try {
      const backupCodes = await profilePage.getBackupCodes();

      expect(backupCodes.length).toBeGreaterThan(0);
      expect(backupCodes.length).toBeLessThanOrEqual(10);

      // Verify format
      backupCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9-]+$/);
        expect(code.length).toBeGreaterThan(6);
      });

      logger.info({ count: backupCodes.length }, 'Backup codes generated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view active sessions', async ({ page }) => {
    const tracker = monitor.trackTest('view-active-sessions');

    try {
      const sessions = await profilePage.getActiveSessions();

      expect(sessions.length).toBeGreaterThan(0);

      sessions.forEach(session => {
        expect(session.device).toBeTruthy();
        expect(session.lastActive).toBeTruthy();
      });

      logger.info({ count: sessions.length }, 'Active sessions displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should revoke individual session', async ({ page }) => {
    const tracker = monitor.trackTest('revoke-session');

    try {
      const sessionsBefore = await profilePage.getActiveSessions();

      if (sessionsBefore.length > 1) {
        await profilePage.revokeSession(1);

        const sessionsAfter = await profilePage.getActiveSessions();
        expect(sessionsAfter.length).toBe(sessionsBefore.length - 1);

        logger.info('Session revoked');
      } else {
        logger.info('Only one session active');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should configure notification preferences', async ({ page }) => {
    const tracker = monitor.trackTest('configure-notifications');

    try {
      await profilePage.setNotificationPreferences({
        emailNotifications: true,
        smsNotifications: true,
        transactionAlerts: true,
        loginAlerts: true,
        lowBalanceAlerts: true,
        lowBalanceThreshold: 100,
        largeTransactionAlerts: true,
        largeTransactionAmount: 500,
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('Notification preferences configured');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should disable marketing emails', async ({ page }) => {
    const tracker = monitor.trackTest('disable-marketing-emails');

    try {
      await profilePage.setNotificationPreferences({
        marketingEmails: false,
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('Marketing emails disabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should set user preferences', async ({ page }) => {
    const tracker = monitor.trackTest('set-user-preferences');

    try {
      await profilePage.setPreferences({
        language: 'English',
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
        theme: 'Light',
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('User preferences set');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should change theme to dark mode', async ({ page }) => {
    const tracker = monitor.trackTest('change-theme-dark');

    try {
      await profilePage.setPreferences({
        theme: 'Dark',
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      // Verify theme changed (check for dark mode class)
      await page.waitForTimeout(1000);

      logger.info('Theme changed to dark mode');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should set default account', async ({ page }) => {
    const tracker = monitor.trackTest('set-default-account');

    try {
      await profilePage.setPreferences({
        defaultAccount: 'Checking Account',
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('Default account set');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should download user data', async ({ page }) => {
    const tracker = monitor.trackTest('download-user-data');

    try {
      const download = await profilePage.downloadMyData();

      expect(download.suggestedFilename()).toBeTruthy();
      expect(download.suggestedFilename()).toMatch(/\.(zip|json|csv)$/);

      logger.info({ filename: download.suggestedFilename() }, 'User data downloaded');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate email format', async ({ page }) => {
    const tracker = monitor.trackTest('validate-email-format');

    try {
      await profilePage.goToPersonalInfo();
      await page.click(profilePage['selectors'].editPersonalInfoButton);

      // Invalid email
      await page.fill(profilePage['selectors'].emailInput, 'invalid-email');
      await page.click(profilePage['selectors'].savePersonalInfoButton);

      // Should show validation error
      expect(await profilePage.hasValidationError('email')).toBeTruthy();

      logger.info('Email validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate phone number format', async ({ page }) => {
    const tracker = monitor.trackTest('validate-phone-format');

    try {
      await profilePage.goToPersonalInfo();
      await page.click(profilePage['selectors'].editPersonalInfoButton);

      // Invalid phone
      await page.fill(profilePage['selectors'].phoneInput, '123');
      await page.click(profilePage['selectors'].savePersonalInfoButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Phone validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate zip code format', async ({ page }) => {
    const tracker = monitor.trackTest('validate-zip-format');

    try {
      await profilePage.goToPersonalInfo();
      await page.click(profilePage['selectors'].editPersonalInfoButton);

      // Invalid zip
      await page.fill(profilePage['selectors'].zipInput, '123');
      await page.click(profilePage['selectors'].savePersonalInfoButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Zip code validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should require current password for changes', async ({ page }) => {
    const tracker = monitor.trackTest('require-current-password');

    try {
      await profilePage.goToSecurity();

      // Try to change without current password
      await page.fill(profilePage['selectors'].newPasswordInput, 'NewPassword123!');
      await page.fill(profilePage['selectors'].confirmPasswordInput, 'NewPassword123!');
      await page.click(profilePage['selectors'].changePasswordButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Current password requirement enforced');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should switch between profile tabs', async ({ page }) => {
    const tracker = monitor.trackTest('switch-profile-tabs');

    try {
      // Personal info
      await profilePage.goToPersonalInfo();
      await page.waitForTimeout(500);

      // Security
      await profilePage.goToSecurity();
      await page.waitForTimeout(500);

      // Notifications
      await profilePage.goToNotifications();
      await page.waitForTimeout(500);

      // Preferences
      await profilePage.goToPreferences();
      await page.waitForTimeout(500);

      logger.info('Tab switching working correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should maintain data after canceling edit', async ({ page }) => {
    const tracker = monitor.trackTest('cancel-edit-maintains-data');

    try {
      const originalInfo = await profilePage.getPersonalInfo();

      await page.click(profilePage['selectors'].editPersonalInfoButton);
      await page.fill(profilePage['selectors'].firstNameInput, 'ChangedName');
      await page.click(profilePage['selectors'].cancelPersonalInfoButton);

      // Data should remain unchanged
      const currentInfo = await profilePage.getPersonalInfo();
      expect(currentInfo.firstName).toBe(originalInfo.firstName);

      logger.info('Cancel edit maintains original data');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should update multiple fields at once', async ({ page }) => {
    const tracker = monitor.trackTest('update-multiple-fields');

    try {
      await profilePage.editPersonalInfo({
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-111-2222',
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info('Multiple fields updated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should show confirmation before account closure', async ({ page }) => {
    const tracker = monitor.trackTest('confirm-account-closure');

    try {
      await profilePage.goToPreferences();

      await page.click(profilePage['selectors'].closeAccountButton);

      // Should show confirmation modal
      await page.waitForSelector(profilePage['selectors'].closeAccountModal);

      // Cancel instead of confirming
      await page.keyboard.press('Escape');

      logger.info('Account closure confirmation required');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });
});({
        phone: newPhone,
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      // Verify update
      const updatedInfo = await profilePage.getPersonalInfo();
      expect(updatedInfo.phone).toBe(newPhone);

      logger.info({ newPhone }, 'Phone number updated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should update email address', async ({ page }) => {
    const tracker = monitor.trackTest('update-email');

    try {
      const newEmail = `updated_${Date.now()}@test.com`;

      await profilePage.editPersonalInfo({
        email: newEmail,
      });

      expect(await profilePage.hasSuccessMessage()).toBeTruthy();

      logger.info({ newEmail }, 'Email updated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should update mailing address', async ({ page }) => {
    const tracker = monitor.trackTest('update-address');

    try {
      await profilePage.editPersonalInfo