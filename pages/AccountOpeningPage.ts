import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class AccountOpeningPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="account-opening-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Account type selection
    accountTypeSelect: '[data-testid="account-type"]',
    checkingOption: '[data-testid="account-type-checking"]',
    savingsOption: '[data-testid="account-type-savings"]',
    moneyMarketOption: '[data-testid="account-type-money-market"]',
    cdOption: '[data-testid="account-type-cd"]',
    
    // Account details
    accountNameInput: '[data-testid="account-name"]',
    initialDepositInput: '[data-testid="initial-deposit"]',
    fundingSourceSelect: '[data-testid="funding-source"]',
    
    // CD specific fields
    cdTermSelect: '[data-testid="cd-term"]',
    cdRateDisplay: '[data-testid="cd-rate"]',
    
    // Joint account fields
    jointAccountCheckbox: '[data-testid="joint-account"]',
    jointOwnerSection: '[data-testid="joint-owner-section"]',
    jointOwnerFirstName: '[data-testid="joint-first-name"]',
    jointOwnerLastName: '[data-testid="joint-last-name"]',
    jointOwnerSSN: '[data-testid="joint-ssn"]',
    
    // Terms and conditions
    termsCheckbox: '[data-testid="terms-checkbox"]',
    termsLink: '[data-testid="terms-link"]',
    eSignAgreement: '[data-testid="esign-agreement"]',
    
    // Buttons
    nextButton: '[data-testid="next-button"]',
    backButton: '[data-testid="back-button"]',
    submitButton: '[data-testid="submit-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    
    // Confirmation
    confirmationMessage: '[data-testid="confirmation-message"]',
    accountNumberDisplay: '[data-testid="account-number-display"]',
    downloadDocumentsButton: '[data-testid="download-documents"]',
    continueButton: '[data-testid="continue-button"]',
    
    // Error messages
    errorMessage: '[data-testid="error-message"]',
    validationError: '[data-testid="validation-error"]',
    
    // Progress steps
    progressStep1: '[data-testid="progress-step-1"]',
    progressStep2: '[data-testid="progress-step-2"]',
    progressStep3: '[data-testid="progress-step-3"]',
    progressStep4: '[data-testid="progress-step-4"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to account opening page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/accounts/open');
    await this.waitForPageLoad();
    logger.debug('Navigated to account opening page');
  }

  /**
   * Select account type
   */
  async selectAccountType(type: 'Checking' | 'Savings' | 'Money Market' | 'CD') {
    await this.helper.select(this.selectors.accountTypeSelect, type);
    await this.page.waitForTimeout(500); // Wait for type-specific fields to load
    logger.debug({ type }, 'Account type selected');
  }

  /**
   * Set account name
   */
  async setAccountName(name: string) {
    await this.helper.fill(this.selectors.accountNameInput, name);
  }

  /**
   * Set initial deposit amount
   */
  async setInitialDeposit(amount: number) {
    await this.helper.fill(this.selectors.initialDepositInput, amount.toString());
    logger.debug({ amount }, 'Initial deposit set');
  }

  /**
   * Select funding source
   */
  async selectFundingSource(source: string) {
    await this.helper.select(this.selectors.fundingSourceSelect, source);
  }

  /**
   * Select CD term (for CD accounts)
   */
  async selectCDTerm(term: string) {
    await this.helper.select(this.selectors.cdTermSelect, term);
    // Wait for rate to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Get CD interest rate
   */
  async getCDRate(): Promise<string> {
    return await this.helper.getText(this.selectors.cdRateDisplay);
  }

  /**
   * Enable joint account
   */
  async enableJointAccount() {
    await this.helper.check(this.selectors.jointAccountCheckbox);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.jointOwnerSection),
      5000
    );
  }

  /**
   * Add joint owner information
   */
  async addJointOwner(firstName: string, lastName: string, ssn: string) {
    await this.enableJointAccount();
    await this.helper.fill(this.selectors.jointOwnerFirstName, firstName);
    await this.helper.fill(this.selectors.jointOwnerLastName, lastName);
    await this.helper.fill(this.selectors.jointOwnerSSN, ssn);
    logger.debug({ firstName, lastName }, 'Joint owner added');
  }

  /**
   * Agree to terms and conditions
   */
  async agreeToTerms() {
    await this.helper.check(this.selectors.termsCheckbox);
    await this.helper.check(this.selectors.eSignAgreement);
    logger.debug('Terms accepted');
  }

  /**
   * Click view terms link
   */
  async viewTerms() {
    await this.helper.click(this.selectors.termsLink);
  }

  /**
   * Click next button
   */
  async clickNext() {
    await this.helper.click(this.selectors.nextButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click back button
   */
  async clickBack() {
    await this.helper.click(this.selectors.backButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Submit application
   */
  async submitApplication() {
    await this.helper.click(this.selectors.submitButton);
    logger.info('Account application submitted');
  }

  /**
   * Cancel application
   */
  async cancelApplication() {
    await this.helper.click(this.selectors.cancelButton);
  }

  /**
   * Wait for confirmation page
   */
  async waitForConfirmation() {
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationMessage),
      15000
    );
    logger.info('Account confirmation received');
  }

  /**
   * Get account number from confirmation
   */
  async getAccountNumber(): Promise<string> {
    const text = await this.helper.getText(this.selectors.accountNumberDisplay);
    // Extract just the number if it has additional text
    const match = text.match(/\d+/);
    return match ? match[0] : text;
  }

  /**
   * Get confirmation message
   */
  async getConfirmationMessage(): Promise<string> {
    return await this.helper.getText(this.selectors.confirmationMessage);
  }

  /**
   * Download account documents
   */
  async downloadDocuments() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.downloadDocumentsButton);
    return await downloadPromise;
  }

  /**
   * Click continue after confirmation
   */
  async clickContinue() {
    await this.helper.click(this.selectors.continueButton);
  }

  /**
   * Check if error message is displayed
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
   * Check if validation error exists for field
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.helper.isVisible(`${this.selectors.validationError}[data-field="${field}"]`);
  }

  /**
   * Get validation error message
   */
  async getValidationErrorMessage(field: string): Promise<string> {
    return await this.helper.getText(`${this.selectors.validationError}[data-field="${field}"]`);
  }

  /**
   * Get current progress step
   */
  async getCurrentStep(): Promise<number> {
    const steps = [
      this.selectors.progressStep1,
      this.selectors.progressStep2,
      this.selectors.progressStep3,
      this.selectors.progressStep4,
    ];

    for (let i = 0; i < steps.length; i++) {
      const isActive = await this.page.locator(steps[i]).getAttribute('data-active');
      if (isActive === 'true') {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Complete full account opening workflow
   */
  async completeAccountOpening(data: {
    accountType: 'Checking' | 'Savings' | 'Money Market' | 'CD';
    initialDeposit: number;
    fundingSource?: string;
    jointOwner?: {
      firstName: string;
      lastName: string;
      ssn: string;
    };
    cdTerm?: string;
  }) {
    // Step 1: Select account type
    await this.selectAccountType(data.accountType);

    // Step 2: Set details
    await this.setInitialDeposit(data.initialDeposit);

    if (data.fundingSource) {
      await this.selectFundingSource(data.fundingSource);
    }

    if (data.accountType === 'CD' && data.cdTerm) {
      await this.selectCDTerm(data.cdTerm);
    }

    if (data.jointOwner) {
      await this.addJointOwner(
        data.jointOwner.firstName,
        data.jointOwner.lastName,
        data.jointOwner.ssn
      );
    }

    await this.clickNext();

    // Step 3: Review and agree to terms
    await this.agreeToTerms();

    // Step 4: Submit
    await this.submitApplication();

    // Wait for confirmation
    await this.waitForConfirmation();

    logger.info({ accountType: data.accountType }, 'Account opening completed');
  }
}