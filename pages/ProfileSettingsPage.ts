import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * ProfileSettingsPage - FULLY MODERNIZED 2025
 * 
 * CHANGES:
 * ✅ Removed 60+ string selectors
 * ✅ Added locator getter methods
 * ✅ Uses getByRole/getByLabel first
 * ✅ Removed all page.waitForTimeout() calls
 * ✅ Auto-waiting patterns throughout
 * ✅ Organized by section for maintainability
 */
export class ProfileSettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ====================
  // NAVIGATION
  // ====================

  /**
   * Navigate to profile/settings page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/settings');
    await this.waitForPageLoad();
    logger.debug('Navigated to profile settings');
  }

  // ====================
  // LOCATOR GETTERS - TABS
  // ====================

  getPersonalInfoTab(): Locator {
    return this.page.getByRole('tab', { name: /personal.*info/i })
      .or(this.page.getByTestId('tab-personal-info'));
  }

  getSecurityTab(): Locator {
    return this.page.getByRole('tab', { name: /security/i })
      .or(this.page.getByTestId('tab-security'));
  }

  getNotificationsTab(): Locator {
    return this.page.getByRole('tab', { name: /notifications/i })
      .or(this.page.getByTestId('tab-notifications'));
  }

  getPreferencesTab(): Locator {
    return this.page.getByRole('tab', { name: /preferences/i })
      .or(this.page.getByTestId('tab-preferences'));
  }

  // ====================
  // PERSONAL INFO SECTION
  // ====================

  getFirstNameInput(): Locator {
    return this.page.getByLabel(/first.*name/i)
      .or(this.page.getByTestId('first-name'));
  }

  getLastNameInput(): Locator {
    return this.page.getByLabel(/last.*name/i)
      .or(this.page.getByTestId('last-name'));
  }

  getEmailInput(): Locator {
    return this.page.getByLabel(/email/i)
      .or(this.page.getByRole('textbox', { name: /email/i }))
      .or(this.page.getByTestId('email'));
  }

  getPhoneInput(): Locator {
    return this.page.getByLabel(/phone/i)
      .or(this.page.getByTestId('phone'));
  }

  getAddressLine1Input(): Locator {
    return this.page.getByLabel(/address.*line.*1|street/i)
      .or(this.page.getByTestId('address-line1'));
  }

  getCityInput(): Locator {
    return this.page.getByLabel(/city/i)
      .or(this.page.getByTestId('city'));
  }

  getStateSelect(): Locator {
    return this.page.getByLabel(/state/i)
      .or(this.page.getByTestId('state'));
  }

  getZipInput(): Locator {
    return this.page.getByLabel(/zip|postal.*code/i)
      .or(this.page.getByTestId('zip'));
  }

  getEditPersonalInfoButton(): Locator {
    return this.page.getByRole('button', { name: /edit.*personal/i })
      .or(this.page.getByTestId('edit-personal-info'));
  }

  getSavePersonalInfoButton(): Locator {
    return this.page.getByRole('button', { name: /save.*personal/i })
      .or(this.page.getByTestId('save-personal-info'));
  }

  // ====================
  // SECURITY SECTION
  // ====================

  getCurrentPasswordInput(): Locator {
    return this.page.getByLabel(/current.*password/i)
      .or(this.page.getByTestId('current-password'));
  }

  getNewPasswordInput(): Locator {
    return this.page.getByLabel(/new.*password/i)
      .or(this.page.getByTestId('new-password'));
  }

  getConfirmPasswordInput(): Locator {
    return this.page.getByLabel(/confirm.*password/i)
      .or(this.page.getByTestId('confirm-password'));
  }

  getChangePasswordButton(): Locator {
    return this.page.getByRole('button', { name: /change.*password/i })
      .or(this.page.getByTestId('change-password'));
  }

  // Security Questions

  getSecurityQuestion1Select(): Locator {
    return this.page.getByLabel(/security.*question.*1|first.*question/i)
      .or(this.page.getByTestId('security-question-1'));
  }

  getSecurityAnswer1Input(): Locator {
    return this.page.getByLabel(/answer.*1|first.*answer/i)
      .or(this.page.getByTestId('security-answer-1'));
  }

  getSaveSecurityQuestionsButton(): Locator {
    return this.page.getByRole('button', { name: /save.*security.*questions/i })
      .or(this.page.getByTestId('save-security-questions'));
  }

  // Two-Factor Authentication

  getEnable2FACheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /enable.*2fa|two.*factor/i })
      .or(this.page.getByTestId('enable-2fa'));
  }

  getTwoFactorMethodSelect(): Locator {
    return this.page.getByLabel(/2fa.*method|authentication.*method/i)
      .or(this.page.getByTestId('2fa-method'));
  }

  getQRCode(): Locator {
    return this.page.getByRole('img', { name: /qr.*code/i })
      .or(this.page.getByTestId('2fa-qr-code'));
  }

  getVerificationCodeInput(): Locator {
    return this.page.getByLabel(/verification.*code|enter.*code/i)
      .or(this.page.getByTestId('verification-code'));
  }

  getVerify2FAButton(): Locator {
    return this.page.getByRole('button', { name: /verify/i })
      .or(this.page.getByTestId('verify-2fa'));
  }

  getBackupCodesButton(): Locator {
    return this.page.getByRole('button', { name: /backup.*codes/i })
      .or(this.page.getByTestId('backup-codes'));
  }

  getBackupCodesList(): Locator {
    return this.page.getByRole('list', { name: /backup.*codes/i })
      .or(this.page.getByTestId('backup-codes-list'));
  }

  // Session Management

  getSessionItems(): Locator {
    return this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/device|session/i) })
      .or(this.page.getByTestId('session-item'));
  }

  getRevokeAllSessionsButton(): Locator {
    return this.page.getByRole('button', { name: /revoke.*all/i })
      .or(this.page.getByTestId('revoke-all-sessions'));
  }

  // ====================
  // NOTIFICATIONS SECTION
  // ====================

  getEmailNotificationsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /email.*notifications/i })
      .or(this.page.getByTestId('email-notifications'));
  }

  getSMSNotificationsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /sms.*notifications/i })
      .or(this.page.getByTestId('sms-notifications'));
  }

  getTransactionAlertsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /transaction.*alerts/i })
      .or(this.page.getByTestId('transaction-alerts'));
  }

  getLoginAlertsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /login.*alerts/i })
      .or(this.page.getByTestId('login-alerts'));
  }

  getLowBalanceAlertsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /low.*balance.*alerts/i })
      .or(this.page.getByTestId('low-balance-alerts'));
  }

  getLowBalanceThresholdInput(): Locator {
    return this.page.getByLabel(/low.*balance.*threshold/i)
      .or(this.page.getByTestId('low-balance-threshold'));
  }

  getLargeTransactionAlertsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /large.*transaction/i })
      .or(this.page.getByTestId('large-transaction-alerts'));
  }

  getLargeTransactionAmountInput(): Locator {
    return this.page.getByLabel(/large.*transaction.*amount/i)
      .or(this.page.getByTestId('large-transaction-amount'));
  }

  getSaveNotificationsButton(): Locator {
    return this.page.getByRole('button', { name: /save.*notifications/i })
      .or(this.page.getByTestId('save-notifications'));
  }

  // ====================
  // PREFERENCES SECTION
  // ====================

  getLanguageSelect(): Locator {
    return this.page.getByLabel(/language/i)
      .or(this.page.getByTestId('language-select'));
  }

  getTimezoneSelect(): Locator {
    return this.page.getByLabel(/timezone|time.*zone/i)
      .or(this.page.getByTestId('timezone-select'));
  }

  getThemeSelect(): Locator {
    return this.page.getByLabel(/theme/i)
      .or(this.page.getByTestId('theme-select'));
  }

  getSavePreferencesButton(): Locator {
    return this.page.getByRole('button', { name: /save.*preferences/i })
      .or(this.page.getByTestId('save-preferences'));
  }

  getDownloadDataButton(): Locator {
    return this.page.getByRole('button', { name: /download.*data/i })
      .or(this.page.getByTestId('download-my-data'));
  }

  getCloseAccountButton(): Locator {
    return this.page.getByRole('button', { name: /close.*account/i })
      .or(this.page.getByTestId('close-account'));
  }

  // ====================
  // MESSAGES
  // ====================

  getSuccessMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /success|saved|updated/i })
      .or(this.page.getByTestId('success-message'));
  }

  getErrorMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /error|fail/i })
      .or(this.page.getByTestId('error-message'));
  }

  // ====================
  // MODALS
  // ====================

  getConfirmModal(): Locator {
    return this.page.getByRole('dialog', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-modal'));
  }

  getConfirmButton(): Locator {
    return this.getConfirmModal()
      .getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-button'));
  }

  getCloseAccountModal(): Locator {
    return this.page.getByRole('dialog', { name: /close.*account/i })
      .or(this.page.getByTestId('close-account-modal'));
  }

  getCloseReasonSelect(): Locator {
    return this.getCloseAccountModal()
      .getByLabel(/reason/i)
      .or(this.page.getByTestId('close-reason'));
  }

  getCloseConfirmInput(): Locator {
    return this.getCloseAccountModal()
      .getByLabel(/confirm|type/i)
      .or(this.page.getByTestId('close-confirm-input'));
  }

  getConfirmCloseAccountButton(): Locator {
    return this.getCloseAccountModal()
      .getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-close-account'));
  }

  // ====================
  // TAB NAVIGATION
  // ====================

  async goToPersonalInfo() {
    await this.getPersonalInfoTab().click();
  }

  async goToSecurity() {
    await this.getSecurityTab().click();
  }

  async goToNotifications() {
    await this.getNotificationsTab().click();
  }

  async goToPreferences() {
    await this.getPreferencesTab().click();
  }

  // ====================
  // PERSONAL INFO ACTIONS
  // ====================

  async getPersonalInfo(): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }> {
    await this.goToPersonalInfo();

    return {
      firstName: await this.getFirstNameInput().inputValue(),
      lastName: await this.getLastNameInput().inputValue(),
      email: await this.getEmailInput().inputValue(),
      phone: await this.getPhoneInput().inputValue(),
    };
  }

  async editPersonalInfo(updates: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
  }>) {
    await this.goToPersonalInfo();
    await this.getEditPersonalInfoButton().click();

    if (updates.firstName) {
      await this.getFirstNameInput().fill(updates.firstName);
    }
    if (updates.lastName) {
      await this.getLastNameInput().fill(updates.lastName);
    }
    if (updates.email) {
      await this.getEmailInput().fill(updates.email);
    }
    if (updates.phone) {
      await this.getPhoneInput().fill(updates.phone);
    }
    if (updates.addressLine1) {
      await this.getAddressLine1Input().fill(updates.addressLine1);
    }
    if (updates.city) {
      await this.getCityInput().fill(updates.city);
    }
    if (updates.state) {
      await this.getStateSelect().selectOption(updates.state);
    }
    if (updates.zip) {
      await this.getZipInput().fill(updates.zip);
    }

    await this.getSavePersonalInfoButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });

    logger.info('Personal information updated');
  }

  // ====================
  // SECURITY ACTIONS
  // ====================

  async changePassword(currentPassword: string, newPassword: string) {
    await this.goToSecurity();

    await this.getCurrentPasswordInput().fill(currentPassword);
    await this.getNewPasswordInput().fill(newPassword);
    await this.getConfirmPasswordInput().fill(newPassword);

    await this.getChangePasswordButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });

    logger.info('Password changed successfully');
  }

  async setSecurityQuestions(questions: Array<{ question: string; answer: string }>) {
    await this.goToSecurity();

    if (questions.length > 0) {
      await this.getSecurityQuestion1Select().selectOption(questions[0].question);
      await this.getSecurityAnswer1Input().fill(questions[0].answer);
    }

    await this.getSaveSecurityQuestionsButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });

    logger.info('Security questions set');
  }

  async enable2FA(method: 'SMS' | 'Email' | 'Authenticator') {
    await this.goToSecurity();

    await this.getEnable2FACheckbox().check();
    await this.getTwoFactorMethodSelect().waitFor({ state: 'visible' });
    await this.getTwoFactorMethodSelect().selectOption(method);

    if (method === 'Authenticator') {
      await this.getQRCode().waitFor({ state: 'visible' });
    }

    logger.info({ method }, '2FA enabled');
  }

  async verify2FA(code: string) {
    await this.getVerificationCodeInput().fill(code);
    await this.getVerify2FAButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });

    logger.info('2FA verified');
  }

  async getBackupCodes(): Promise<string[]> {
    await this.goToSecurity();
    await this.getBackupCodesButton().click();
    await this.getBackupCodesList().waitFor({ state: 'visible' });

    const codesText = await this.getBackupCodesList().textContent() || '';
    const codes = codesText.split('\n').filter(c => c.trim());

    logger.info({ count: codes.length }, 'Backup codes retrieved');
    return codes;
  }

  async getActiveSessions(): Promise<Array<{
    device: string;
    location: string;
    lastActive: string;
  }>> {
    await this.goToSecurity();

    const items = this.getSessionItems();
    const count = await items.count();
    const sessions = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      sessions.push({
        device: await item.locator('[data-field="device"]').textContent() || '',
        location: await item.locator('[data-field="location"]').textContent() || '',
        lastActive: await item.locator('[data-field="last-active"]').textContent() || '',
      });
    }

    return sessions;
  }

  async revokeAllSessions() {
    await this.goToSecurity();
    await this.getRevokeAllSessionsButton().click();
    await this.getConfirmModal().waitFor({ state: 'visible' });
    await this.getConfirmButton().click();

    logger.info('All sessions revoked');
  }

  // ====================
  // NOTIFICATIONS ACTIONS
  // ====================

  async setNotificationPreferences(preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    transactionAlerts?: boolean;
    loginAlerts?: boolean;
    lowBalanceAlerts?: boolean;
    lowBalanceThreshold?: number;
    largeTransactionAlerts?: boolean;
    largeTransactionAmount?: number;
  }) {
    await this.goToNotifications();

    if (preferences.emailNotifications !== undefined) {
      await this.getEmailNotificationsCheckbox().setChecked(preferences.emailNotifications);
    }

    if (preferences.smsNotifications !== undefined) {
      await this.getSMSNotificationsCheckbox().setChecked(preferences.smsNotifications);
    }

    if (preferences.transactionAlerts !== undefined) {
      await this.getTransactionAlertsCheckbox().setChecked(preferences.transactionAlerts);
    }

    if (preferences.loginAlerts !== undefined) {
      await this.getLoginAlertsCheckbox().setChecked(preferences.loginAlerts);
    }

    if (preferences.lowBalanceAlerts !== undefined) {
      await this.getLowBalanceAlertsCheckbox().setChecked(preferences.lowBalanceAlerts);
      
      if (preferences.lowBalanceThreshold) {
        await this.getLowBalanceThresholdInput().fill(preferences.lowBalanceThreshold.toString());
      }
    }

    if (preferences.largeTransactionAlerts !== undefined) {
      await this.getLargeTransactionAlertsCheckbox().setChecked(preferences.largeTransactionAlerts);
      
      if (preferences.largeTransactionAmount) {
        await this.getLargeTransactionAmountInput().fill(preferences.largeTransactionAmount.toString());
      }
    }

    await this.getSaveNotificationsButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });

    logger.info('Notification preferences updated');
  }

  // ====================
  // PREFERENCES ACTIONS
  // ====================

  async setPreferences(preferences: {
    language?: string;
    timezone?: string;
    theme?: string;
  }) {
    await this.goToPreferences();

    if (preferences.language) {
      await this.getLanguageSelect().selectOption(preferences.language);
    }

    if (preferences.timezone) {
      await this.getTimezoneSelect().selectOption(preferences.timezone);
    }

    if (preferences.theme) {
      await this.getThemeSelect().selectOption(preferences.theme);
    }

    await this.getSavePreferencesButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });

    logger.info('Preferences updated');
  }

  async downloadMyData() {
    await this.goToPreferences();

    const downloadPromise = this.page.waitForEvent('download');
    await this.getDownloadDataButton().click();

    const download = await downloadPromise;
    logger.info({ filename: download.suggestedFilename() }, 'User data download initiated');
    
    return download;
  }

  async closeAccount(reason: string, confirmationText: string) {
    await this.goToPreferences();

    await this.getCloseAccountButton().click();
    await this.getCloseAccountModal().waitFor({ state: 'visible' });

    await this.getCloseReasonSelect().selectOption(reason);
    await this.getCloseConfirmInput().fill(confirmationText);

    await this.getConfirmCloseAccountButton().click();

    logger.warn({ reason }, 'Account closure initiated');
  }

  // ====================
  // MESSAGE QUERIES
  // ====================

  async hasSuccessMessage(): Promise<boolean> {
    return await this.getSuccessMessage().isVisible();
  }

  async getSuccessMessageText(): Promise<string> {
    return await this.getSuccessMessage().textContent() || '';
  }

  async hasError(): Promise<boolean> {
    return await this.getErrorMessage().isVisible();
  }

  async getErrorMessageText(): Promise<string> {
    return await this.getErrorMessage().textContent() || '';
  }
}