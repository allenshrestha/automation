import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Wait } from '@lib/core/wait';

export class MemberDetailsPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="page-title"]',
    loadingIndicator: '[data-testid="loading"]',

    // Member information
    accountNumber: '[data-testid="member-account-number"]',
    firstName: '[data-testid="member-first-name"]',
    lastName: '[data-testid="member-last-name"]',
    email: '[data-testid="member-email"]',
    phone: '[data-testid="member-phone"]',
    ssn: '[data-testid="member-ssn"]',
    dateOfBirth: '[data-testid="member-dob"]',
    memberSince: '[data-testid="member-since"]',
    status: '[data-testid="member-status"]',

    // Address fields
    street: '[data-testid="member-street"]',
    city: '[data-testid="member-city"]',
    state: '[data-testid="member-state"]',
    zip: '[data-testid="member-zip"]',

    // Buttons
    editButton: '[data-testid="edit-button"]',
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    deleteButton: '[data-testid="delete-button"]',

    // Edit mode inputs
    emailInput: '[data-testid="edit-email"]',
    phoneInput: '[data-testid="edit-phone"]',
    streetInput: '[data-testid="edit-street"]',
    cityInput: '[data-testid="edit-city"]',
    stateSelect: '[data-testid="edit-state"]',
    zipInput: '[data-testid="edit-zip"]',

    // Messages
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    validationError: '[data-testid="validation-error"]',
    conflictMessage: '[data-testid="conflict-message"]',

    // Tabs
    accountsTab: '[data-testid="tab-accounts"]',
    transactionsTab: '[data-testid="tab-transactions"]',
    documentsTab: '[data-testid="tab-documents"]',
    notesTab: '[data-testid="tab-notes"]',

    // Accounts section
    accountsList: '[data-testid="accounts-list"]',
    accountItem: '[data-testid="account-item"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    await Wait.forCondition(
      async () => !(await this.helper.isVisible(this.selectors.loadingIndicator, 1000)),
      10000
    );
    await this.helper.waitFor(this.selectors.accountNumber);
  }

  /**
   * Check if page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.accountNumber);
  }

  /**
   * Get member information
   */
  async getMemberInfo(): Promise<{
    accountNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
  }> {
    return {
      accountNumber: await this.helper.getText(this.selectors.accountNumber),
      firstName: await this.helper.getText(this.selectors.firstName),
      lastName: await this.helper.getText(this.selectors.lastName),
      email: await this.helper.getText(this.selectors.email),
      phone: await this.helper.getText(this.selectors.phone),
      status: await this.helper.getText(this.selectors.status),
    };
  }

  /**
   * Get phone number
   */
  async getPhone(): Promise<string> {
    return await this.helper.getText(this.selectors.phone);
  }

  /**
   * Get email
   */
  async getEmail(): Promise<string> {
    return await this.helper.getText(this.selectors.email);
  }

  /**
   * Get address
   */
  async getAddress(): Promise<{
    street: string;
    city: string;
    state: string;
    zip: string;
  }> {
    return {
      street: await this.helper.getText(this.selectors.street),
      city: await this.helper.getText(this.selectors.city),
      state: await this.helper.getText(this.selectors.state),
      zip: await this.helper.getText(this.selectors.zip),
    };
  }

  /**
   * Click edit button
   */
  async clickEdit() {
    await this.helper.click(this.selectors.editButton);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.saveButton),
      5000
    );
  }

  /**
   * Update phone number (in edit mode)
   */
  async updatePhone(phone: string) {
    await this.helper.fill(this.selectors.phoneInput, phone);
  }

  /**
   * Update email (in edit mode)
   */
  async updateEmail(email: string) {
    await this.helper.fill(this.selectors.emailInput, email);
  }

  /**
   * Clear email field
   */
  async clearEmail() {
    await this.helper.fill(this.selectors.emailInput, '', true);
  }

  /**
   * Update address (in edit mode)
   */
  async updateAddress(address: { street?: string; city?: string; state?: string; zip?: string }) {
    if (address.street) {
      await this.helper.fill(this.selectors.streetInput, address.street);
    }
    if (address.city) {
      await this.helper.fill(this.selectors.cityInput, address.city);
    }
    if (address.state) {
      await this.helper.select(this.selectors.stateSelect, address.state);
    }
    if (address.zip) {
      await this.helper.fill(this.selectors.zipInput, address.zip);
    }
  }

  /**
   * Click save button
   */
  async clickSave() {
    await this.helper.click(this.selectors.saveButton);
    // Wait a moment for save operation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click cancel button
   */
  async clickCancel() {
    await this.helper.click(this.selectors.cancelButton);
    await Wait.forCondition(
      async () => !(await this.helper.isVisible(this.selectors.saveButton, 1000)),
      5000
    );
  }

  /**
   * Check if success message is shown
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.successMessage);
  }

  /**
   * Check if error message is shown
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.errorMessage);
  }

  /**
   * Check if validation error exists for field
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.helper.isVisible(`${this.selectors.validationError}[data-field="${field}"]`);
  }

  /**
   * Get validation error message for field
   */
  async getValidationErrorMessage(field: string): Promise<string> {
    return await this.helper.getText(`${this.selectors.validationError}[data-field="${field}"]`);
  }

  /**
   * Check if conflict message is shown
   */
  async hasConflictMessage(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.conflictMessage);
  }

  /**
   * Switch to accounts tab
   */
  async goToAccountsTab() {
    await this.helper.click(this.selectors.accountsTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.accountsList),
      5000
    );
  }

  /**
   * Switch to transactions tab
   */
  async goToTransactionsTab() {
    await this.helper.click(this.selectors.transactionsTab);
  }

  /**
   * Switch to documents tab
   */
  async goToDocumentsTab() {
    await this.helper.click(this.selectors.documentsTab);
  }

  /**
   * Switch to notes tab
   */
  async goToNotesTab() {
    await this.helper.click(this.selectors.notesTab);
  }

  /**
   * Get list of member accounts
   */
  async getAccounts(): Promise
    Array<{
      accountNumber: string;
      accountType: string;
      balance: number;
      status: string;
    }>
  > {
    await this.goToAccountsTab();

    const count = await this.helper.count(this.selectors.accountItem);
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.accountItem).nth(i);

      accounts.push({
        accountNumber: await item.locator('[data-field="accountNumber"]').textContent() || '',
        accountType: await item.locator('[data-field="accountType"]').textContent() || '',
        balance: parseFloat(
          (await item.locator('[data-field="balance"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        status: await item.locator('[data-field="status"]').textContent() || '',
      });
    }

    return accounts;
  }

  /**
   * Click on account by index
   */
  async clickAccount(index: number) {
    await this.goToAccountsTab();
    await this.page.locator(this.selectors.accountItem).nth(index).click();
  }
}