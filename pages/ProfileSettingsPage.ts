import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class ProfileSettingsPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="profile-settings-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Navigation tabs
    personalInfoTab: '[data-testid="tab-personal-info"]',
    securityTab: '[data-testid="tab-security"]',
    notificationsTab: '[data-testid="tab-notifications"]',
    preferencesTab: '[data-testid="tab-preferences"]',
    
    // Personal Information
    firstNameInput: '[data-testid="first-name"]',
    lastNameInput: '[data-testid="last-name"]',
    emailInput: '[data-testid="email"]',
    phoneInput: '[data-testid="phone"]',
    dateOfBirthInput: '[data-testid="date-of-birth"]',
    ssnDisplay: '[data-testid="ssn-display"]',
    
    // Address fields
    addressLine1Input: '[data-testid="address-line1"]',
    addressLine2Input: '[data-testid="address-line2"]',
    cityInput: '[data-testid="city"]',
    stateSelect: '[data-testid="state"]',
    zipInput: '[data-testid="zip"]',
    countrySelect: '[data-testid="country"]',
    
    // Edit mode
    editPersonalInfoButton: '[data-testid="edit-personal-info"]',
    savePersonalInfoButton: '[data-testid="save-personal-info"]',
    cancelPersonalInfoButton: '[data-testid="cancel-personal-info"]',
    
    // Security section
    currentPasswordInput: '[data-testid="current-password"]',
    newPasswordInput: '[data-testid="new-password"]',
    confirmPasswordInput: '[data-testid="confirm-password"]',
    changePasswordButton: '[data-testid="change-password"]',
    
    // Security questions
    securityQuestion1Select: '[data-testid="security-question-1"]',
    securityAnswer1Input: '[data-testid="security-answer-1"]',
    securityQuestion2Select: '[data-testid="security-question-2"]',
    securityAnswer2Input: '[data-testid="security-answer-2"]',
    securityQuestion3Select: '[data-testid="security-question-3"]',
    securityAnswer3Input: '[data-testid="security-answer-3"]',
    saveSecurityQuestionsButton: '[data-testid="save-security-questions"]',
    
    // Two-factor authentication
    enable2FACheckbox: '[data-testid="enable-2fa"]',
    twoFactorMethod: '[data-testid="2fa-method"]',
    phoneNumber2FA: '[data-testid="2fa-phone"]',
    email2FA: '[data-testid="2fa-email"]',
    authenticatorApp2FA: '[data-testid="2fa-authenticator"]',
    qrCode: '[data-testid="2fa-qr-code"]',
    verificationCodeInput: '[data-testid="verification-code"]',
    verify2FAButton: '[data-testid="verify-2fa"]',
    backupCodesButton: '[data-testid="backup-codes"]',
    backupCodesList: '[data-testid="backup-codes-list"]',
    
    // Session management
    activeSessions: '[data-testid="active-sessions"]',
    sessionItem: '[data-testid="session-item"]',
    revokeSessionButton: '[data-testid="revoke-session"]',
    revokeAllSessionsButton: '[data-testid="revoke-all-sessions"]',
    
    // Notifications section
    emailNotifications: '[data-testid="email-notifications"]',
    smsNotifications: '[data-testid="sms-notifications"]',
    pushNotifications: '[data-testid="push-notifications"]',
    
    // Notification preferences
    transactionAlertsCheckbox: '[data-testid="transaction-alerts"]',
    loginAlertsCheckbox: '[data-testid="login-alerts"]',
    billPayAlertsCheckbox: '[data-testid="bill-pay-alerts"]',
    lowBalanceAlertsCheckbox: '[data-testid="low-balance-alerts"]',
    lowBalanceThresholdInput: '[data-testid="low-balance-threshold"]',
    largeTransactionAlertsCheckbox: '[data-testid="large-transaction-alerts"]',
    largeTransactionAmountInput: '[data-testid="large-transaction-amount"]',
    statementReadyCheckbox: '[data-testid="statement-ready-alerts"]',
    marketingEmailsCheckbox: '[data-testid="marketing-emails"]',
    
    saveNotificationsButton: '[data-testid="save-notifications"]',
    
    // Preferences section
    languageSelect: '[data-testid="language-select"]',
    timezoneSelect: '[data-testid="timezone-select"]',
    currencySelect: '[data-testid="currency-select"]',
    dateFormatSelect: '[data-testid="date-format-select"]',
    themeSelect: '[data-testid="theme-select"]',
    dashboardLayoutSelect: '[data-testid="dashboard-layout"]',
    defaultAccountSelect: '[data-testid="default-account"]',
    itemsPerPageSelect: '[data-testid="items-per-page"]',
    
    savePreferencesButton: '[data-testid="save-preferences"]',
    
    // Privacy settings
    shareDataCheckbox: '[data-testid="share-data"]',
    allowThirdPartyCheckbox: '[data-testid="allow-third-party"]',
    trackingCheckbox: '[data-testid="allow-tracking"]',
    
    // Account actions
    downloadDataButton: '[data-testid="download-my-data"]',
    closeAccountButton: '[data-testid="close-account"]',
    
    // Messages
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    validationError: '[data-testid="validation-error"]',
    
    // Modals
    confirmModal: '[data-testid="confirm-modal"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    
    closeAccountModal: '[data-testid="close-account-modal"]',
    closeAccountReasonSelect: '[data-testid="close-reason"]',
    closeAccountConfirmInput: '[data-testid="close-confirm-input"]',
    confirmCloseAccountButton: '[data-testid="confirm-close-account"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to profile/settings page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/settings');
    await this.waitForPageLoad();
    logger.debug('Navigated to profile settings');
  }

  /**
   * Go to personal info tab
   */
  async goToPersonalInfo() {
    await this.helper.click(this.selectors.personalInfoTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to security tab
   */
  async goToSecurity() {
    await this.helper.click(this.selectors.securityTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to notifications tab
   */
  async goToNotifications() {
    await this.helper.click(this.selectors.notificationsTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to preferences tab
   */
  async goToPreferences() {
    await this.helper.click(this.selectors.preferencesTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get personal information
   */
  async getPersonalInfo(): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }> {
    await this.goToPersonalInfo();

    return {
      firstName: await this.helper.getValue(this.selectors.firstNameInput),
      lastName: await this.helper.getValue(this.selectors.lastNameInput),
      email: await this.helper.getValue(this.selectors.emailInput),
      phone: await this.helper.getValue(this.selectors.phoneInput),
    };
  }

  /**
   * Edit personal information
   */
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
    await this.helper.click(this.selectors.editPersonalInfoButton);

    if (updates.firstName) {
      await this.helper.fill(this.selectors.firstNameInput, updates.firstName);
    }
    if (updates.lastName) {
      await this.helper.fill(this.selectors.lastNameInput, updates.lastName);
    }
    if (updates.email) {
      await this.helper.fill(this.selectors.emailInput, updates.email);
    }
    if (updates.phone) {
      await this.helper.fill(this.selectors.phoneInput, updates.phone);
    }
    if (updates.addressLine1) {
      await this.helper.fill(this.selectors.addressLine1Input, updates.addressLine1);
    }
    if (updates.city) {
      await this.helper.fill(this.selectors.cityInput, updates.city);
    }
    if (updates.state) {
      await this.helper.select(this.selectors.stateSelect, updates.state);
    }
    if (updates.zip) {
      await this.helper.fill(this.selectors.zipInput, updates.zip);
    }

    await this.helper.click(this.selectors.savePersonalInfoButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info('Personal information updated');
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    await this.goToSecurity();

    await this.helper.fill(this.selectors.currentPasswordInput, currentPassword);
    await this.helper.fill(this.selectors.newPasswordInput, newPassword);
    await this.helper.fill(this.selectors.confirmPasswordInput, newPassword);

    await this.helper.click(this.selectors.changePasswordButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info('Password changed successfully');
  }

  /**
   * Set security questions
   */
  async setSecurityQuestions(questions: Array<{ question: string; answer: string }>) {
    await this.goToSecurity();

    if (questions.length > 0) {
      await this.helper.select(this.selectors.securityQuestion1Select, questions[0].question);
      await this.helper.fill(this.selectors.securityAnswer1Input, questions[0].answer);
    }

    if (questions.length > 1) {
      await this.helper.select(this.selectors.securityQuestion2Select, questions[1].question);
      await this.helper.fill(this.selectors.securityAnswer2Input, questions[1].answer);
    }

    if (questions.length > 2) {
      await this.helper.select(this.selectors.securityQuestion3Select, questions[2].question);
      await this.helper.fill(this.selectors.securityAnswer3Input, questions[2].answer);
    }

    await this.helper.click(this.selectors.saveSecurityQuestionsButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info('Security questions set');
  }

  /**
   * Enable two-factor authentication
   */
  async enable2FA(method: 'SMS' | 'Email' | 'Authenticator') {
    await this.goToSecurity();

    await this.helper.check(this.selectors.enable2FACheckbox);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.twoFactorMethod),
      3000
    );

    await this.helper.select(this.selectors.twoFactorMethod, method);

    if (method === 'Authenticator') {
      // Wait for QR code to appear
      await Wait.forCondition(
        async () => await this.helper.isVisible(this.selectors.qrCode),
        5000
      );
    }

    logger.info({ method }, '2FA enabled');
  }

  /**
   * Verify 2FA with code
   */
  async verify2FA(code: string) {
    await this.helper.fill(this.selectors.verificationCodeInput, code);
    await this.helper.click(this.selectors.verify2FAButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info('2FA verified');
  }

  /**
   * Get backup codes
   */
  async getBackupCodes(): Promise<string[]> {
    await this.goToSecurity();
    await this.helper.click(this.selectors.backupCodesButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.backupCodesList),
      5000
    );

    const codesText = await this.helper.getText(this.selectors.backupCodesList);
    const codes = codesText.split('\n').filter(c => c.trim());

    logger.info({ count: codes.length }, 'Backup codes retrieved');
    return codes;
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<Array<{
    device: string;
    location: string;
    lastActive: string;
  }>> {
    await this.goToSecurity();

    const count = await this.helper.count(this.selectors.sessionItem);
    const sessions = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.sessionItem).nth(i);
      sessions.push({
        device: await item.locator('[data-field="device"]').textContent() || '',
        location: await item.locator('[data-field="location"]').textContent() || '',
        lastActive: await item.locator('[data-field="last-active"]').textContent() || '',
      });
    }

    return sessions;
  }

  /**
   * Revoke session by index
   */
  async revokeSession(index: number) {
    await this.goToSecurity();

    await this.page.locator(this.selectors.sessionItem).nth(index)
      .locator(this.selectors.revokeSessionButton).click();

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmModal),
      3000
    );

    await this.helper.click(this.selectors.confirmButton);

    logger.info({ index }, 'Session revoked');
  }

  /**
   * Revoke all sessions
   */
  async revokeAllSessions() {
    await this.goToSecurity();
    await this.helper.click(this.selectors.revokeAllSessionsButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmModal),
      3000
    );

    await this.helper.click(this.selectors.confirmButton);

    logger.info('All sessions revoked');
  }

  /**
   * Configure notification preferences
   */
  async setNotificationPreferences(preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    transactionAlerts?: boolean;
    loginAlerts?: boolean;
    billPayAlerts?: boolean;
    lowBalanceAlerts?: boolean;
    lowBalanceThreshold?: number;
    largeTransactionAlerts?: boolean;
    largeTransactionAmount?: number;
    statementReady?: boolean;
    marketingEmails?: boolean;
  }) {
    await this.goToNotifications();

    if (preferences.emailNotifications !== undefined) {
      await this.helper.setCheckbox(this.selectors.emailNotifications, preferences.emailNotifications);
    }

    if (preferences.smsNotifications !== undefined) {
      await this.helper.setCheckbox(this.selectors.smsNotifications, preferences.smsNotifications);
    }

    if (preferences.pushNotifications !== undefined) {
      await this.helper.setCheckbox(this.selectors.pushNotifications, preferences.pushNotifications);
    }

    if (preferences.transactionAlerts !== undefined) {
      await this.helper.setCheckbox(this.selectors.transactionAlertsCheckbox, preferences.transactionAlerts);
    }

    if (preferences.loginAlerts !== undefined) {
      await this.helper.setCheckbox(this.selectors.loginAlertsCheckbox, preferences.loginAlerts);
    }

    if (preferences.billPayAlerts !== undefined) {
      await this.helper.setCheckbox(this.selectors.billPayAlertsCheckbox, preferences.billPayAlerts);
    }

    if (preferences.lowBalanceAlerts !== undefined) {
      await this.helper.setCheckbox(this.selectors.lowBalanceAlertsCheckbox, preferences.lowBalanceAlerts);
      
      if (preferences.lowBalanceThreshold) {
        await this.helper.fill(this.selectors.lowBalanceThresholdInput, preferences.lowBalanceThreshold.toString());
      }
    }

    if (preferences.largeTransactionAlerts !== undefined) {
      await this.helper.setCheckbox(this.selectors.largeTransactionAlertsCheckbox, preferences.largeTransactionAlerts);
      
      if (preferences.largeTransactionAmount) {
        await this.helper.fill(this.selectors.largeTransactionAmountInput, preferences.largeTransactionAmount.toString());
      }
    }

    if (preferences.statementReady !== undefined) {
      await this.helper.setCheckbox(this.selectors.statementReadyCheckbox, preferences.statementReady);
    }

    if (preferences.marketingEmails !== undefined) {
      await this.helper.setCheckbox(this.selectors.marketingEmailsCheckbox, preferences.marketingEmails);
    }

    await this.helper.click(this.selectors.saveNotificationsButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info('Notification preferences updated');
  }

  /**
   * Set user preferences
   */
  async setPreferences(preferences: {
    language?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    theme?: string;
    dashboardLayout?: string;
    defaultAccount?: string;
    itemsPerPage?: number;
  }) {
    await this.goToPreferences();

    if (preferences.language) {
      await this.helper.select(this.selectors.languageSelect, preferences.language);
    }

    if (preferences.timezone) {
      await this.helper.select(this.selectors.timezoneSelect, preferences.timezone);
    }

    if (preferences.currency) {
      await this.helper.select(this.selectors.currencySelect, preferences.currency);
    }

    if (preferences.dateFormat) {
      await this.helper.select(this.selectors.dateFormatSelect, preferences.dateFormat);
    }

    if (preferences.theme) {
      await this.helper.select(this.selectors.themeSelect, preferences.theme);
    }

    if (preferences.dashboardLayout) {
      await this.helper.select(this.selectors.dashboardLayoutSelect, preferences.dashboardLayout);
    }

    if (preferences.defaultAccount) {
      await this.helper.select(this.selectors.defaultAccountSelect, preferences.defaultAccount);
    }

    if (preferences.itemsPerPage) {
      await this.helper.select(this.selectors.itemsPerPageSelect, preferences.itemsPerPage.toString());
    }

    await this.helper.click(this.selectors.savePreferencesButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info('Preferences updated');
  }

  /**
   * Download user data
   */
  async downloadMyData() {
    await this.goToPreferences();

    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.downloadDataButton);

    const download = await downloadPromise;
    logger.info({ filename: download.suggestedFilename() }, 'User data download initiated');
    
    return download;
  }

  /**
   * Initiate account closure
   */
  async closeAccount(reason: string, confirmationText: string) {
    await this.goToPreferences();

    await this.helper.click(this.selectors.closeAccountButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.closeAccountModal),
      5000
    );

    await this.helper.select(this.selectors.closeAccountReasonSelect, reason);
    await this.helper.fill(this.selectors.closeAccountConfirmInput, confirmationText);

    await this.helper.click(this.selectors.confirmCloseAccountButton);

    logger.warn({ reason }, 'Account closure initiated');
  }

  /**
   * Check if success message is shown
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.successMessage);
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.helper.getText(this.selectors.successMessage);
  }

  /**
   * Check if error message is shown
   */
  async hasError(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.errorMessage);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.helper.getText(this.selectors.errorMessage);
  }

  /**
   * Check if validation error exists
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.helper.isVisible(`${this.selectors.validationError}[data-field="${field}"]`);
  }
}