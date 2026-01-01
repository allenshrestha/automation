import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * AccountOpeningPage - FULLY MODERNIZED 2025
 * 
 * CHANGES:
 * ✅ Removed all 40+ string selectors
 * ✅ Added locator getter methods
 * ✅ Uses getByRole/getByLabel first
 * ✅ Removed all page.waitForTimeout() calls
 * ✅ Removed all deprecated helper methods
 * ✅ Auto-waiting patterns throughout
 */
export class AccountOpeningPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ====================
  // NAVIGATION
  // ====================

  /**
   * Navigate to account opening page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/accounts/open');
    await this.waitForPageLoad();
    logger.debug('Navigated to account opening page');
  }

  // ====================
  // LOCATOR GETTERS
  // ====================

  /**
   * Get page title
   */
  getPageTitle(): Locator {
    return this.page.getByRole('heading', { name: /account.*opening/i, level: 1 })
      .or(this.page.getByTestId('account-opening-title'));
  }

  /**
   * Get loading indicator
   */
  getLoadingSpinner(): Locator {
    return this.page.getByRole('status', { name: /loading/i })
      .or(this.page.getByTestId('loading'));
  }

  // ACCOUNT TYPE SELECTION

  /**
   * Get account type select
   */
  getAccountTypeSelect(): Locator {
    return this.page.getByLabel(/account.*type/i)
      .or(this.page.getByRole('combobox', { name: /account.*type/i }))
      .or(this.page.getByTestId('account-type'));
  }

  // ACCOUNT DETAILS

  /**
   * Get account name input
   */
  getAccountNameInput(): Locator {
    return this.page.getByLabel(/account.*name/i)
      .or(this.page.getByRole('textbox', { name: /name/i }))
      .or(this.page.getByTestId('account-name'));
  }

  /**
   * Get initial deposit input
   */
  getInitialDepositInput(): Locator {
    return this.page.getByLabel(/initial.*deposit|deposit.*amount/i)
      .or(this.page.getByTestId('initial-deposit'));
  }

  /**
   * Get funding source select
   */
  getFundingSourceSelect(): Locator {
    return this.page.getByLabel(/funding.*source/i)
      .or(this.page.getByTestId('funding-source'));
  }

  // CD SPECIFIC

  /**
   * Get CD term select
   */
  getCDTermSelect(): Locator {
    return this.page.getByLabel(/cd.*term|term.*length/i)
      .or(this.page.getByTestId('cd-term'));
  }

  /**
   * Get CD rate display
   */
  getCDRateDisplay(): Locator {
    return this.page.getByText(/interest.*rate|apy/i)
      .or(this.page.getByTestId('cd-rate'));
  }

  // JOINT ACCOUNT

  /**
   * Get joint account checkbox
   */
  getJointAccountCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /joint.*account/i })
      .or(this.page.getByLabel(/add.*joint.*owner/i))
      .or(this.page.getByTestId('joint-account'));
  }

  /**
   * Get joint owner section
   */
  getJointOwnerSection(): Locator {
    return this.page.getByRole('region', { name: /joint.*owner/i })
      .or(this.page.getByTestId('joint-owner-section'));
  }

  /**
   * Get joint owner first name input
   */
  getJointOwnerFirstNameInput(): Locator {
    return this.page.getByLabel(/joint.*first.*name|co-owner.*first.*name/i)
      .or(this.page.getByTestId('joint-first-name'));
  }

  /**
   * Get joint owner last name input
   */
  getJointOwnerLastNameInput(): Locator {
    return this.page.getByLabel(/joint.*last.*name|co-owner.*last.*name/i)
      .or(this.page.getByTestId('joint-last-name'));
  }

  /**
   * Get joint owner SSN input
   */
  getJointOwnerSSNInput(): Locator {
    return this.page.getByLabel(/joint.*ssn|co-owner.*ssn|social.*security/i)
      .or(this.page.getByTestId('joint-ssn'));
  }

  // TERMS AND CONDITIONS

  /**
   * Get terms checkbox
   */
  getTermsCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /terms.*conditions|agree/i })
      .or(this.page.getByLabel(/terms/i))
      .or(this.page.getByTestId('terms-checkbox'));
  }

  /**
   * Get terms link
   */
  getTermsLink(): Locator {
    return this.page.getByRole('link', { name: /view.*terms|read.*terms/i })
      .or(this.page.getByTestId('terms-link'));
  }

  /**
   * Get eSign agreement checkbox
   */
  getESignAgreementCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /esign.*agreement|electronic.*signature/i })
      .or(this.page.getByTestId('esign-agreement'));
  }

  // BUTTONS

  /**
   * Get next button
   */
  getNextButton(): Locator {
    return this.page.getByRole('button', { name: /next|continue/i })
      .or(this.page.getByTestId('next-button'));
  }

  /**
   * Get back button
   */
  getBackButton(): Locator {
    return this.page.getByRole('button', { name: /back|previous/i })
      .or(this.page.getByTestId('back-button'));
  }

  /**
   * Get submit button
   */
  getSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /submit|complete/i })
      .or(this.page.locator('button[type="submit"]'))
      .or(this.page.getByTestId('submit-button'));
  }

  /**
   * Get cancel button
   */
  getCancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i })
      .or(this.page.getByTestId('cancel-button'));
  }

  // CONFIRMATION

  /**
   * Get confirmation message
   */
  getConfirmationMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /success|congratulations|confirmed/i })
      .or(this.page.getByTestId('confirmation-message'));
  }

  /**
   * Get account number display
   */
  getAccountNumberDisplay(): Locator {
    return this.page.getByText(/account.*number.*\d+/i)
      .or(this.page.getByTestId('account-number-display'));
  }

  /**
   * Get download documents button
   */
  getDownloadDocumentsButton(): Locator {
    return this.page.getByRole('button', { name: /download.*documents/i })
      .or(this.page.getByTestId('download-documents'));
  }

  /**
   * Get continue button (after confirmation)
   */
  getContinueButton(): Locator {
    return this.page.getByRole('button', { name: /continue|done|finish/i })
      .or(this.page.getByTestId('continue-button'));
  }

  // ERROR MESSAGES

  /**
   * Get error message
   */
  getErrorMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /error|fail/i })
      .or(this.page.getByTestId('error-message'));
  }

  /**
   * Get validation error for specific field
   */
  getValidationError(field: string): Locator {
    return this.page.locator(`[data-testid="validation-error"][data-field="${field}"]`);
  }

  // PROGRESS STEPS

  /**
   * Get progress step element
   */
  getProgressStep(stepNumber: number): Locator {
    return this.page.getByTestId(`progress-step-${stepNumber}`);
  }

  // ====================
  // ACTIONS
  // ====================

  /**
   * Select account type
   */
  async selectAccountType(type: 'Checking' | 'Savings' | 'Money Market' | 'CD') {
    await this.getAccountTypeSelect().selectOption(type);
    // Wait for type-specific fields to appear
    await this.getAccountNameInput().waitFor({ state: 'visible' });
    logger.debug({ type }, 'Account type selected');
  }

  /**
   * Set account name
   */
  async setAccountName(name: string) {
    await this.getAccountNameInput().fill(name);
  }

  /**
   * Set initial deposit amount
   */
  async setInitialDeposit(amount: number) {
    await this.getInitialDepositInput().fill(amount.toString());
    logger.debug({ amount }, 'Initial deposit set');
  }

  /**
   * Select funding source
   */
  async selectFundingSource(source: string) {
    await this.getFundingSourceSelect().selectOption(source);
  }

  /**
   * Select CD term (for CD accounts)
   */
  async selectCDTerm(term: string) {
    await this.getCDTermSelect().selectOption(term);
    // Wait for rate to update
    await this.getCDRateDisplay().waitFor({ state: 'visible' });
  }

  /**
   * Get CD interest rate
   */
  async getCDRate(): Promise<string> {
    return await this.getCDRateDisplay().textContent() || '';
  }

  /**
   * Enable joint account
   */
  async enableJointAccount() {
    await this.getJointAccountCheckbox().check();
    // Wait for joint owner section to appear
    await this.getJointOwnerSection().waitFor({ state: 'visible' });
  }

  /**
   * Add joint owner information
   */
  async addJointOwner(firstName: string, lastName: string, ssn: string) {
    await this.enableJointAccount();
    
    await this.getJointOwnerFirstNameInput().fill(firstName);
    await this.getJointOwnerLastNameInput().fill(lastName);
    await this.getJointOwnerSSNInput().fill(ssn);
    
    logger.debug({ firstName, lastName }, 'Joint owner added');
  }

  /**
   * Agree to terms and conditions
   */
  async agreeToTerms() {
    await this.getTermsCheckbox().check();
    await this.getESignAgreementCheckbox().check();
    logger.debug('Terms accepted');
  }

  /**
   * Click view terms link
   */
  async viewTerms() {
    await this.getTermsLink().click();
  }

  /**
   * Click next button
   */
  async clickNext() {
    await this.getNextButton().click();
    // Wait for next step to load
    await this.waitForLoadingComplete();
  }

  /**
   * Click back button
   */
  async clickBack() {
    await this.getBackButton().click();
  }

  /**
   * Submit application
   */
  async submitApplication() {
    await this.getSubmitButton().click();
    logger.info('Account application submitted');
  }

  /**
   * Cancel application
   */
  async cancelApplication() {
    await this.getCancelButton().click();
  }

  /**
   * Wait for confirmation page
   */
  async waitForConfirmation() {
    await this.getConfirmationMessage().waitFor({ state: 'visible', timeout: 15000 });
    logger.info('Account confirmation received');
  }

  /**
   * Get account number from confirmation
   */
  async getAccountNumber(): Promise<string> {
    const text = await this.getAccountNumberDisplay().textContent() || '';
    // Extract just the number if it has additional text
    const match = text.match(/\d+/);
    return match ? match[0] : text;
  }

  /**
   * Get confirmation message
   */
  async getConfirmationMessageText(): Promise<string> {
    return await this.getConfirmationMessage().textContent() || '';
  }

  /**
   * Download account documents
   */
  async downloadDocuments() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.getDownloadDocumentsButton().click();
    return await downloadPromise;
  }

  /**
   * Click continue after confirmation
   */
  async clickContinue() {
    await this.getContinueButton().click();
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.getErrorMessage().isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessageText(): Promise<string> {
    return await this.getErrorMessage().textContent() || '';
  }

  /**
   * Check if validation error exists for field
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.getValidationError(field).isVisible();
  }

  /**
   * Get validation error message
   */
  async getValidationErrorMessage(field: string): Promise<string> {
    return await this.getValidationError(field).textContent() || '';
  }

  /**
   * Get current progress step
   */
  async getCurrentStep(): Promise<number> {
    for (let i = 1; i <= 4; i++) {
      const step = this.getProgressStep(i);
      const isActive = await step.getAttribute('data-active');
      if (isActive === 'true') {
        return i;
      }
    }
    return 1;
  }

  // ====================
  // COMPLETE WORKFLOW
  // ====================

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