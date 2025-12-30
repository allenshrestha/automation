import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class BillPayPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="bill-pay-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Payee management
    addPayeeButton: '[data-testid="add-payee"]',
    payeesList: '[data-testid="payees-list"]',
    payeeItem: '[data-testid="payee-item"]',
    payeeName: '[data-field="payee-name"]',
    payeeAccount: '[data-field="payee-account"]',
    payeeStatus: '[data-field="payee-status"]',
    editPayeeButton: '[data-testid="edit-payee"]',
    deletePayeeButton: '[data-testid="delete-payee"]',
    
    // Add/Edit Payee Modal
    payeeModal: '[data-testid="payee-modal"]',
    payeeNameInput: '[data-testid="payee-name-input"]',
    payeeNicknameInput: '[data-testid="payee-nickname-input"]',
    payeeAccountInput: '[data-testid="payee-account-input"]',
    payeeAddressInput: '[data-testid="payee-address-input"]',
    payeeCityInput: '[data-testid="payee-city-input"]',
    payeeStateSelect: '[data-testid="payee-state-select"]',
    payeeZipInput: '[data-testid="payee-zip-input"]',
    payeePhoneInput: '[data-testid="payee-phone-input"]',
    payeeCategorySelect: '[data-testid="payee-category-select"]',
    savePayeeButton: '[data-testid="save-payee"]',
    cancelPayeeButton: '[data-testid="cancel-payee"]',
    
    // Payment form
    makePaymentButton: '[data-testid="make-payment"]',
    paymentModal: '[data-testid="payment-modal"]',
    selectPayeeDropdown: '[data-testid="select-payee"]',
    payFromAccountSelect: '[data-testid="pay-from-account"]',
    paymentAmountInput: '[data-testid="payment-amount"]',
    paymentDateInput: '[data-testid="payment-date"]',
    paymentMemoInput: '[data-testid="payment-memo"]',
    deliveryMethodSelect: '[data-testid="delivery-method"]',
    
    // Recurring payment
    recurringCheckbox: '[data-testid="recurring-payment"]',
    frequencySelect: '[data-testid="payment-frequency"]',
    startDateInput: '[data-testid="recurring-start-date"]',
    endDateInput: '[data-testid="recurring-end-date"]',
    numberOfPaymentsInput: '[data-testid="number-of-payments"]',
    
    // Payment review
    reviewModal: '[data-testid="review-payment-modal"]',
    reviewPayee: '[data-testid="review-payee"]',
    reviewAmount: '[data-testid="review-amount"]',
    reviewDate: '[data-testid="review-date"]',
    reviewAccount: '[data-testid="review-account"]',
    confirmPaymentButton: '[data-testid="confirm-payment"]',
    editPaymentButton: '[data-testid="edit-payment"]',
    
    // Payment confirmation
    confirmationModal: '[data-testid="confirmation-modal"]',
    confirmationNumber: '[data-testid="confirmation-number"]',
    confirmationMessage: '[data-testid="confirmation-message"]',
    printReceiptButton: '[data-testid="print-receipt"]',
    emailReceiptButton: '[data-testid="email-receipt"]',
    closeConfirmationButton: '[data-testid="close-confirmation"]',
    
    // Payment history
    paymentHistoryTab: '[data-testid="payment-history-tab"]',
    scheduledPaymentsTab: '[data-testid="scheduled-payments-tab"]',
    recurringPaymentsTab: '[data-testid="recurring-payments-tab"]',
    
    paymentHistoryList: '[data-testid="payment-history-list"]',
    paymentHistoryItem: '[data-testid="payment-history-item"]',
    scheduledPaymentsList: '[data-testid="scheduled-payments-list"]',
    scheduledPaymentItem: '[data-testid="scheduled-payment-item"]',
    recurringPaymentsList: '[data-testid="recurring-payments-list"]',
    recurringPaymentItem: '[data-testid="recurring-payment-item"]',
    
    // Payment actions
    cancelPaymentButton: '[data-testid="cancel-payment"]',
    editScheduledButton: '[data-testid="edit-scheduled"]',
    pauseRecurringButton: '[data-testid="pause-recurring"]',
    resumeRecurringButton: '[data-testid="resume-recurring"]',
    stopRecurringButton: '[data-testid="stop-recurring"]',
    
    // Filters
    filterStartDate: '[data-testid="filter-start-date"]',
    filterEndDate: '[data-testid="filter-end-date"]',
    filterPayee: '[data-testid="filter-payee"]',
    filterStatus: '[data-testid="filter-status"]',
    filterMinAmount: '[data-testid="filter-min-amount"]',
    filterMaxAmount: '[data-testid="filter-max-amount"]',
    applyFiltersButton: '[data-testid="apply-filters"]',
    clearFiltersButton: '[data-testid="clear-filters"]',
    
    // Search
    searchPayeeInput: '[data-testid="search-payee"]',
    searchButton: '[data-testid="search-button"]',
    
    // Export
    exportButton: '[data-testid="export-payments"]',
    exportFormatSelect: '[data-testid="export-format"]',
    
    // Messages
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    warningMessage: '[data-testid="warning-message"]',
    
    // Delete confirmation
    deleteModal: '[data-testid="delete-modal"]',
    confirmDeleteButton: '[data-testid="confirm-delete"]',
    cancelDeleteButton: '[data-testid="cancel-delete"]',
    
    // Pagination
    paginationNext: '[data-testid="pagination-next"]',
    paginationPrev: '[data-testid="pagination-prev"]',
    paginationInfo: '[data-testid="pagination-info"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to bill pay page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/bill-pay');
    await this.waitForPageLoad();
    logger.debug('Navigated to bill pay page');
  }

  /**
   * Click add payee button
   */
  async clickAddPayee() {
    await this.helper.click(this.selectors.addPayeeButton);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.payeeModal),
      5000
    );
  }

  /**
   * Add new payee
   */
  async addPayee(payeeData: {
    name: string;
    nickname?: string;
    accountNumber: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
    category?: string;
  }) {
    await this.clickAddPayee();

    await this.helper.fill(this.selectors.payeeNameInput, payeeData.name);
    
    if (payeeData.nickname) {
      await this.helper.fill(this.selectors.payeeNicknameInput, payeeData.nickname);
    }

    await this.helper.fill(this.selectors.payeeAccountInput, payeeData.accountNumber);
    await this.helper.fill(this.selectors.payeeAddressInput, payeeData.address);
    await this.helper.fill(this.selectors.payeeCityInput, payeeData.city);
    await this.helper.select(this.selectors.payeeStateSelect, payeeData.state);
    await this.helper.fill(this.selectors.payeeZipInput, payeeData.zip);

    if (payeeData.phone) {
      await this.helper.fill(this.selectors.payeePhoneInput, payeeData.phone);
    }

    if (payeeData.category) {
      await this.helper.select(this.selectors.payeeCategorySelect, payeeData.category);
    }

    await this.helper.click(this.selectors.savePayeeButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info({ payeeName: payeeData.name }, 'Payee added successfully');
  }

  /**
   * Get all payees
   */
  async getAllPayees(): Promise<Array<{
    name: string;
    account: string;
    status: string;
  }>> {
    const count = await this.helper.count(this.selectors.payeeItem);
    const payees = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.payeeItem).nth(i);
      payees.push({
        name: await item.locator(this.selectors.payeeName).textContent() || '',
        account: await item.locator(this.selectors.payeeAccount).textContent() || '',
        status: await item.locator(this.selectors.payeeStatus).textContent() || '',
      });
    }

    return payees;
  }

  /**
   * Search for payee
   */
  async searchPayee(payeeName: string) {
    await this.helper.fill(this.selectors.searchPayeeInput, payeeName);
    await this.helper.click(this.selectors.searchButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Edit payee by index
   */
  async editPayee(index: number, updates: Partial<{
    name: string;
    nickname: string;
    accountNumber: string;
    phone: string;
  }>) {
    await this.page.locator(this.selectors.payeeItem).nth(index)
      .locator(this.selectors.editPayeeButton).click();

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.payeeModal),
      5000
    );

    if (updates.name) {
      await this.helper.fill(this.selectors.payeeNameInput, updates.name);
    }
    if (updates.nickname) {
      await this.helper.fill(this.selectors.payeeNicknameInput, updates.nickname);
    }
    if (updates.accountNumber) {
      await this.helper.fill(this.selectors.payeeAccountInput, updates.accountNumber);
    }
    if (updates.phone) {
      await this.helper.fill(this.selectors.payeePhoneInput, updates.phone);
    }

    await this.helper.click(this.selectors.savePayeeButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info({ index }, 'Payee updated');
  }

  /**
   * Delete payee by index
   */
  async deletePayee(index: number) {
    await this.page.locator(this.selectors.payeeItem).nth(index)
      .locator(this.selectors.deletePayeeButton).click();

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.deleteModal),
      5000
    );

    await this.helper.click(this.selectors.confirmDeleteButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info({ index }, 'Payee deleted');
  }

  /**
   * Make a one-time payment
   */
  async makePayment(paymentData: {
    payee: string;
    fromAccount: string;
    amount: number;
    date: string;
    memo?: string;
    deliveryMethod?: string;
  }) {
    await this.helper.click(this.selectors.makePaymentButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.paymentModal),
      5000
    );

    await this.helper.select(this.selectors.selectPayeeDropdown, paymentData.payee);
    await this.helper.select(this.selectors.payFromAccountSelect, paymentData.fromAccount);
    await this.helper.fill(this.selectors.paymentAmountInput, paymentData.amount.toString());
    await this.helper.fill(this.selectors.paymentDateInput, paymentData.date);

    if (paymentData.memo) {
      await this.helper.fill(this.selectors.paymentMemoInput, paymentData.memo);
    }

    if (paymentData.deliveryMethod) {
      await this.helper.select(this.selectors.deliveryMethodSelect, paymentData.deliveryMethod);
    }

    // Review payment
    await this.page.click('button:has-text("Review")'); // Adjust selector as needed

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );

    // Confirm payment
    await this.helper.click(this.selectors.confirmPaymentButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationModal),
      10000
    );

    logger.info({ payee: paymentData.payee, amount: paymentData.amount }, 'Payment completed');
  }

  /**
   * Schedule recurring payment
   */
  async scheduleRecurringPayment(paymentData: {
    payee: string;
    fromAccount: string;
    amount: number;
    frequency: string;
    startDate: string;
    endDate?: string;
    numberOfPayments?: number;
    memo?: string;
  }) {
    await this.helper.click(this.selectors.makePaymentButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.paymentModal),
      5000
    );

    await this.helper.select(this.selectors.selectPayeeDropdown, paymentData.payee);
    await this.helper.select(this.selectors.payFromAccountSelect, paymentData.fromAccount);
    await this.helper.fill(this.selectors.paymentAmountInput, paymentData.amount.toString());

    // Enable recurring
    await this.helper.check(this.selectors.recurringCheckbox);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.frequencySelect),
      3000
    );

    await this.helper.select(this.selectors.frequencySelect, paymentData.frequency);
    await this.helper.fill(this.selectors.startDateInput, paymentData.startDate);

    if (paymentData.endDate) {
      await this.helper.fill(this.selectors.endDateInput, paymentData.endDate);
    }

    if (paymentData.numberOfPayments) {
      await this.helper.fill(this.selectors.numberOfPaymentsInput, paymentData.numberOfPayments.toString());
    }

    if (paymentData.memo) {
      await this.helper.fill(this.selectors.paymentMemoInput, paymentData.memo);
    }

    // Review and confirm
    await this.page.click('button:has-text("Review")');
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );

    await this.helper.click(this.selectors.confirmPaymentButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationModal),
      10000
    );

    logger.info({ payee: paymentData.payee, frequency: paymentData.frequency }, 'Recurring payment scheduled');
  }

  /**
   * Get confirmation number
   */
  async getConfirmationNumber(): Promise<string> {
    return await this.helper.getText(this.selectors.confirmationNumber);
  }

  /**
   * Close confirmation modal
   */
  async closeConfirmation() {
    await this.helper.click(this.selectors.closeConfirmationButton);
  }

  /**
   * Go to payment history tab
   */
  async goToPaymentHistory() {
    await this.helper.click(this.selectors.paymentHistoryTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.paymentHistoryList),
      5000
    );
  }

  /**
   * Go to scheduled payments tab
   */
  async goToScheduledPayments() {
    await this.helper.click(this.selectors.scheduledPaymentsTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.scheduledPaymentsList),
      5000
    );
  }

  /**
   * Go to recurring payments tab
   */
  async goToRecurringPayments() {
    await this.helper.click(this.selectors.recurringPaymentsTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.recurringPaymentsList),
      5000
    );
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<Array<{
    payee: string;
    amount: number;
    date: string;
    status: string;
  }>> {
    await this.goToPaymentHistory();

    const count = await this.helper.count(this.selectors.paymentHistoryItem);
    const payments = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.paymentHistoryItem).nth(i);
      payments.push({
        payee: await item.locator('[data-field="payee"]').textContent() || '',
        amount: parseFloat(
          (await item.locator('[data-field="amount"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        date: await item.locator('[data-field="date"]').textContent() || '',
        status: await item.locator('[data-field="status"]').textContent() || '',
      });
    }

    return payments;
  }

  /**
   * Get scheduled payments
   */
  async getScheduledPayments(): Promise<Array<{
    payee: string;
    amount: number;
    date: string;
    status: string;
  }>> {
    await this.goToScheduledPayments();

    const count = await this.helper.count(this.selectors.scheduledPaymentItem);
    const payments = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.scheduledPaymentItem).nth(i);
      payments.push({
        payee: await item.locator('[data-field="payee"]').textContent() || '',
        amount: parseFloat(
          (await item.locator('[data-field="amount"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        date: await item.locator('[data-field="date"]').textContent() || '',
        status: await item.locator('[data-field="status"]').textContent() || '',
      });
    }

    return payments;
  }

  /**
   * Cancel scheduled payment by index
   */
  async cancelScheduledPayment(index: number) {
    await this.goToScheduledPayments();

    await this.page.locator(this.selectors.scheduledPaymentItem).nth(index)
      .locator(this.selectors.cancelPaymentButton).click();

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.deleteModal),
      5000
    );

    await this.helper.click(this.selectors.confirmDeleteButton);

    logger.info({ index }, 'Scheduled payment cancelled');
  }

  /**
   * Pause recurring payment by index
   */
  async pauseRecurringPayment(index: number) {
    await this.goToRecurringPayments();

    await this.page.locator(this.selectors.recurringPaymentItem).nth(index)
      .locator(this.selectors.pauseRecurringButton).click();

    await this.page.waitForTimeout(1000);

    logger.info({ index }, 'Recurring payment paused');
  }

  /**
   * Resume recurring payment by index
   */
  async resumeRecurringPayment(index: number) {
    await this.goToRecurringPayments();

    await this.page.locator(this.selectors.recurringPaymentItem).nth(index)
      .locator(this.selectors.resumeRecurringButton).click();

    await this.page.waitForTimeout(1000);

    logger.info({ index }, 'Recurring payment resumed');
  }

  /**
   * Stop recurring payment by index
   */
  async stopRecurringPayment(index: number) {
    await this.goToRecurringPayments();

    await this.page.locator(this.selectors.recurringPaymentItem).nth(index)
      .locator(this.selectors.stopRecurringButton).click();

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.deleteModal),
      5000
    );

    await this.helper.click(this.selectors.confirmDeleteButton);

    logger.info({ index }, 'Recurring payment stopped');
  }

  /**
   * Filter payments by date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    await this.helper.fill(this.selectors.filterStartDate, startDate);
    await this.helper.fill(this.selectors.filterEndDate, endDate);
    await this.helper.click(this.selectors.applyFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Export payments
   */
  async exportPayments(format: 'CSV' | 'PDF' | 'Excel') {
    await this.helper.select(this.selectors.exportFormatSelect, format);
    
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.exportButton);
    
    return await downloadPromise;
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
}