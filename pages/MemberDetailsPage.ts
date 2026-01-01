import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { logger } from '@lib/core/logger';

/**
 * MemberDetailsPage - FULLY MODERNIZED 2025
 * 
 * CHANGES:
 * ✅ Removed all 30+ string selectors
 * ✅ Added locator getter methods
 * ✅ Uses getByRole/getByLabel first
 * ✅ Removed all Wait.forCondition calls
 * ✅ Removed all deprecated helper methods
 * ✅ Auto-waiting patterns throughout
 */
export class MemberDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ====================
  // LOCATOR GETTERS
  // ====================

  /**
   * Get page title
   */
  getPageTitle(): Locator {
    return this.page.getByRole('heading', { name: /member.*details/i, level: 1 })
      .or(this.page.getByTestId('page-title'));
  }

  /**
   * Get loading indicator
   */
  getLoadingIndicator(): Locator {
    return this.page.getByRole('status', { name: /loading/i })
      .or(this.page.getByTestId('loading'));
  }

  // MEMBER INFORMATION DISPLAYS

  /**
   * Get account number display
   */
  getAccountNumberDisplay(): Locator {
    return this.page.getByText(/account.*number/i)
      .or(this.page.getByTestId('member-account-number'));
  }

  /**
   * Get first name display
   */
  getFirstNameDisplay(): Locator {
    return this.page.getByTestId('member-first-name');
  }

  /**
   * Get last name display
   */
  getLastNameDisplay(): Locator {
    return this.page.getByTestId('member-last-name');
  }

  /**
   * Get email display
   */
  getEmailDisplay(): Locator {
    return this.page.getByText(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i)
      .or(this.page.getByTestId('member-email'));
  }

  /**
   * Get phone display
   */
  getPhoneDisplay(): Locator {
    return this.page.getByText(/\(\d{3}\)|\d{3}-\d{3}-\d{4}/)
      .or(this.page.getByTestId('member-phone'));
  }

  /**
   * Get status display
   */
  getStatusDisplay(): Locator {
    return this.page.getByRole('status')
      .or(this.page.getByTestId('member-status'));
  }

  // ADDRESS DISPLAYS

  /**
   * Get street display
   */
  getStreetDisplay(): Locator {
    return this.page.getByTestId('member-street');
  }

  /**
   * Get city display
   */
  getCityDisplay(): Locator {
    return this.page.getByTestId('member-city');
  }

  /**
   * Get state display
   */
  getStateDisplay(): Locator {
    return this.page.getByTestId('member-state');
  }

  /**
   * Get zip display
   */
  getZipDisplay(): Locator {
    return this.page.getByTestId('member-zip');
  }

  // BUTTONS

  /**
   * Get edit button
   */
  getEditButton(): Locator {
    return this.page.getByRole('button', { name: /edit/i })
      .or(this.page.getByTestId('edit-button'));
  }

  /**
   * Get save button
   */
  getSaveButton(): Locator {
    return this.page.getByRole('button', { name: /save/i })
      .or(this.page.getByTestId('save-button'));
  }

  /**
   * Get cancel button
   */
  getCancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel/i })
      .or(this.page.getByTestId('cancel-button'));
  }

  /**
   * Get delete button
   */
  getDeleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete/i })
      .or(this.page.getByTestId('delete-button'));
  }

  // EDIT MODE INPUTS

  /**
   * Get email input (edit mode)
   */
  getEmailInput(): Locator {
    return this.page.getByLabel(/email/i)
      .or(this.page.getByRole('textbox', { name: /email/i }))
      .or(this.page.getByTestId('edit-email'));
  }

  /**
   * Get phone input (edit mode)
   */
  getPhoneInput(): Locator {
    return this.page.getByLabel(/phone/i)
      .or(this.page.getByRole('textbox', { name: /phone/i }))
      .or(this.page.getByTestId('edit-phone'));
  }

  /**
   * Get street input (edit mode)
   */
  getStreetInput(): Locator {
    return this.page.getByLabel(/street|address.*line.*1/i)
      .or(this.page.getByTestId('edit-street'));
  }

  /**
   * Get city input (edit mode)
   */
  getCityInput(): Locator {
    return this.page.getByLabel(/city/i)
      .or(this.page.getByTestId('edit-city'));
  }

  /**
   * Get state select (edit mode)
   */
  getStateSelect(): Locator {
    return this.page.getByLabel(/state/i)
      .or(this.page.getByRole('combobox', { name: /state/i }))
      .or(this.page.getByTestId('edit-state'));
  }

  /**
   * Get zip input (edit mode)
   */
  getZipInput(): Locator {
    return this.page.getByLabel(/zip|postal.*code/i)
      .or(this.page.getByTestId('edit-zip'));
  }

  // MESSAGES

  /**
   * Get success message
   */
  getSuccessMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /success|saved|updated/i })
      .or(this.page.getByTestId('success-message'));
  }

  /**
   * Get error message
   */
  getErrorMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /error|fail/i })
      .or(this.page.getByTestId('error-message'));
  }

  /**
   * Get validation error for field
   */
  getValidationError(field: string): Locator {
    return this.page.locator(`[data-testid="validation-error"][data-field="${field}"]`);
  }

  /**
   * Get conflict message
   */
  getConflictMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /conflict|already.*exists/i })
      .or(this.page.getByTestId('conflict-message'));
  }

  // TABS

  /**
   * Get accounts tab
   */
  getAccountsTab(): Locator {
    return this.page.getByRole('tab', { name: /accounts/i })
      .or(this.page.getByTestId('tab-accounts'));
  }

  /**
   * Get transactions tab
   */
  getTransactionsTab(): Locator {
    return this.page.getByRole('tab', { name: /transactions/i })
      .or(this.page.getByTestId('tab-transactions'));
  }

  /**
   * Get documents tab
   */
  getDocumentsTab(): Locator {
    return this.page.getByRole('tab', { name: /documents/i })
      .or(this.page.getByTestId('tab-documents'));
  }

  /**
   * Get notes tab
   */
  getNotesTab(): Locator {
    return this.page.getByRole('tab', { name: /notes/i })
      .or(this.page.getByTestId('tab-notes'));
  }

  // ACCOUNTS SECTION

  /**
   * Get accounts list
   */
  getAccountsList(): Locator {
    return this.page.getByRole('list', { name: /accounts/i })
      .or(this.page.getByTestId('accounts-list'));
  }

  /**
   * Get account items
   */
  getAccountItems(): Locator {
    return this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/account/i) })
      .or(this.page.getByTestId('account-item'));
  }

  // ====================
  // ACTIONS
  // ====================

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    await this.getAccountNumberDisplay().waitFor({ state: 'visible' });
  }

  /**
   * Check if page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return await this.getAccountNumberDisplay().isVisible();
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
      accountNumber: await this.getAccountNumberDisplay().textContent() || '',
      firstName: await this.getFirstNameDisplay().textContent() || '',
      lastName: await this.getLastNameDisplay().textContent() || '',
      email: await this.getEmailDisplay().textContent() || '',
      phone: await this.getPhoneDisplay().textContent() || '',
      status: await this.getStatusDisplay().textContent() || '',
    };
  }

  /**
   * Get phone number
   */
  async getPhone(): Promise<string> {
    return await this.getPhoneDisplay().textContent() || '';
  }

  /**
   * Get email
   */
  async getEmail(): Promise<string> {
    return await this.getEmailDisplay().textContent() || '';
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
      street: await this.getStreetDisplay().textContent() || '',
      city: await this.getCityDisplay().textContent() || '',
      state: await this.getStateDisplay().textContent() || '',
      zip: await this.getZipDisplay().textContent() || '',
    };
  }

  /**
   * Click edit button
   */
  async clickEdit() {
    await this.getEditButton().click();
    // Wait for save button to appear (indicates edit mode)
    await this.getSaveButton().waitFor({ state: 'visible' });
  }

  /**
   * Update phone number (in edit mode)
   */
  async updatePhone(phone: string) {
    await this.getPhoneInput().fill(phone);
  }

  /**
   * Update email (in edit mode)
   */
  async updateEmail(email: string) {
    await this.getEmailInput().fill(email);
  }

  /**
   * Clear email field
   */
  async clearEmail() {
    await this.getEmailInput().clear();
  }

  /**
   * Update address (in edit mode)
   */
  async updateAddress(address: { 
    street?: string; 
    city?: string; 
    state?: string; 
    zip?: string;
  }) {
    if (address.street) {
      await this.getStreetInput().fill(address.street);
    }
    if (address.city) {
      await this.getCityInput().fill(address.city);
    }
    if (address.state) {
      await this.getStateSelect().selectOption(address.state);
    }
    if (address.zip) {
      await this.getZipInput().fill(address.zip);
    }
  }

  /**
   * Click save button
   */
  async clickSave() {
    await this.getSaveButton().click();
    // Wait for save to complete
    await this.getSaveButton().waitFor({ state: 'hidden' });
  }

  /**
   * Click cancel button
   */
  async clickCancel() {
    await this.getCancelButton().click();
    // Wait for edit mode to exit
    await this.getSaveButton().waitFor({ state: 'hidden' });
  }

  /**
   * Check if success message is shown
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.getSuccessMessage().isVisible();
  }

  /**
   * Check if error message is shown
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.getErrorMessage().isVisible();
  }

  /**
   * Check if validation error exists for field
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.getValidationError(field).isVisible();
  }

  /**
   * Get validation error message for field
   */
  async getValidationErrorMessage(field: string): Promise<string> {
    return await this.getValidationError(field).textContent() || '';
  }

  /**
   * Check if conflict message is shown
   */
  async hasConflictMessage(): Promise<boolean> {
    return await this.getConflictMessage().isVisible();
  }

  // ====================
  // TAB NAVIGATION
  // ====================

  /**
   * Switch to accounts tab
   */
  async goToAccountsTab() {
    await this.getAccountsTab().click();
    await this.getAccountsList().waitFor({ state: 'visible' });
  }

  /**
   * Switch to transactions tab
   */
  async goToTransactionsTab() {
    await this.getTransactionsTab().click();
  }

  /**
   * Switch to documents tab
   */
  async goToDocumentsTab() {
    await this.getDocumentsTab().click();
  }

  /**
   * Switch to notes tab
   */
  async goToNotesTab() {
    await this.getNotesTab().click();
  }

  // ====================
  // ACCOUNTS
  // ====================

  /**
   * Get list of member accounts
   */
  async getAccounts(): Promise<Array<{
    accountNumber: string;
    accountType: string;
    balance: number;
    status: string;
  }>> {
    await this.goToAccountsTab();

    const items = this.getAccountItems();
    const count = await items.count();
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);

      const accountNumber = await item.locator('[data-field="accountNumber"]').textContent() || '';
      const accountType = await item.locator('[data-field="accountType"]').textContent() || '';
      const balanceText = await item.locator('[data-field="balance"]').textContent() || '0';
      const balance = parseFloat(balanceText.replace(/[$,]/g, ''));
      const status = await item.locator('[data-field="status"]').textContent() || '';

      accounts.push({ accountNumber, accountType, balance, status });
    }

    return accounts;
  }

  /**
   * Click on account by index
   */
  async clickAccount(index: number) {
    await this.goToAccountsTab();
    await this.getAccountItems().nth(index).click();
  }
}