import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class TransfersPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="transfers-page-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Transfer type selection
    transferTypeSelect: '[data-testid="transfer-type"]',
    internalTransferOption: '[data-testid="type-internal"]',
    externalTransferOption: '[data-testid="type-external"]',
    wireTransferOption: '[data-testid="type-wire"]',
    
    // Internal transfer form
    fromAccountSelect: '[data-testid="from-account"]',
    toAccountSelect: '[data-testid="to-account"]',
    amountInput: '[data-testid="transfer-amount"]',
    memoInput: '[data-testid="transfer-memo"]',
    transferDateInput: '[data-testid="transfer-date"]',
    
    // External transfer form
    externalAccountSelect: '[data-testid="external-account"]',
    addExternalAccountButton: '[data-testid="add-external-account"]',
    routingNumberInput: '[data-testid="routing-number"]',
    accountNumberInput: '[data-testid="account-number"]',
    accountTypeSelect: '[data-testid="account-type"]',
    accountNicknameInput: '[data-testid="account-nickname"]',
    bankNameInput: '[data-testid="bank-name"]',
    
    // Wire transfer form
    recipientNameInput: '[data-testid="recipient-name"]',
    recipientBankInput: '[data-testid="recipient-bank"]',
    recipientRoutingInput: '[data-testid="recipient-routing"]',
    recipientAccountInput: '[data-testid="recipient-account"]',
    recipientAddressInput: '[data-testid="recipient-address"]',
    swiftCodeInput: '[data-testid="swift-code"]',
    wireReferenceInput: '[data-testid="wire-reference"]',
    
    // Recurring transfer
    recurringCheckbox: '[data-testid="recurring-transfer"]',
    frequencySelect: '[data-testid="frequency"]',
    startDateInput: '[data-testid="start-date"]',
    endDateInput: '[data-testid="end-date"]',
    numberOfTransfersInput: '[data-testid="number-of-transfers"]',
    
    // Buttons
    reviewButton: '[data-testid="review-transfer"]',
    submitButton: '[data-testid="submit-transfer"]',
    cancelButton: '[data-testid="cancel-transfer"]',
    
    // Review modal
    reviewModal: '[data-testid="review-modal"]',
    reviewFromAccount: '[data-testid="review-from"]',
    reviewToAccount: '[data-testid="review-to"]',
    reviewAmount: '[data-testid="review-amount"]',
    reviewDate: '[data-testid="review-date"]',
    reviewFee: '[data-testid="review-fee"]',
    editButton: '[data-testid="edit-transfer"]',
    confirmButton: '[data-testid="confirm-transfer"]',
    
    // Confirmation
    confirmationModal: '[data-testid="confirmation-modal"]',
    confirmationNumber: '[data-testid="confirmation-number"]',
    confirmationMessage: '[data-testid="confirmation-message"]',
    trackingNumber: '[data-testid="tracking-number"]',
    estimatedArrival: '[data-testid="estimated-arrival"]',
    closeButton: '[data-testid="close-confirmation"]',
    
    // Transfer history tabs
    pendingTab: '[data-testid="tab-pending"]',
    completedTab: '[data-testid="tab-completed"]',
    scheduledTab: '[data-testid="tab-scheduled"]',
    failedTab: '[data-testid="tab-failed"]',
    
    // Transfer history lists
    pendingList: '[data-testid="pending-list"]',
    completedList: '[data-testid="completed-list"]',
    scheduledList: '[data-testid="scheduled-list"]',
    failedList: '[data-testid="failed-list"]',
    transferItem: '[data-testid="transfer-item"]',
    
    // Transfer actions
    cancelTransferButton: '[data-testid="cancel-transfer-item"]',
    editScheduledButton: '[data-testid="edit-scheduled"]',
    resendButton: '[data-testid="resend-transfer"]',
    
    // Filters
    filterStartDate: '[data-testid="filter-start-date"]',
    filterEndDate: '[data-testid="filter-end-date"]',
    filterAccount: '[data-testid="filter-account"]',
    filterMinAmount: '[data-testid="filter-min-amount"]',
    filterMaxAmount: '[data-testid="filter-max-amount"]',
    applyFiltersButton: '[data-testid="apply-filters"]',
    clearFiltersButton: '[data-testid="clear-filters"]',
    
    // Export
    exportButton: '[data-testid="export-transfers"]',
    exportFormatSelect: '[data-testid="export-format"]',
    
    // Messages
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    warningMessage: '[data-testid="warning-message"]',
    
    // Verification
    verificationModal: '[data-testid="verification-modal"]',
    verificationCodeInput: '[data-testid="verification-code"]',
    verifyButton: '[data-testid="verify-button"]',
    resendCodeButton: '[data-testid="resend-code"]',
    
    // Limits display
    dailyLimitDisplay: '[data-testid="daily-limit"]',
    remainingLimitDisplay: '[data-testid="remaining-limit"]',
    transferLimitWarning: '[data-testid="limit-warning"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to transfers page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/transfers');
    await this.waitForPageLoad();
    logger.debug('Navigated to transfers page');
  }

  /**
   * Select transfer type
   */
  async selectTransferType(type: 'Internal' | 'External' | 'Wire') {
    await this.helper.select(this.selectors.transferTypeSelect, type);
    await this.page.waitForTimeout(500);
    logger.debug({ type }, 'Transfer type selected');
  }

  /**
   * Make internal transfer
   */
  async makeInternalTransfer(data: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    memo?: string;
    date?: string;
  }) {
    await this.selectTransferType('Internal');

    await this.helper.select(this.selectors.fromAccountSelect, data.fromAccount);
    await this.helper.select(this.selectors.toAccountSelect, data.toAccount);
    await this.helper.fill(this.selectors.amountInput, data.amount.toString());

    if (data.memo) {
      await this.helper.fill(this.selectors.memoInput, data.memo);
    }

    if (data.date) {
      await this.helper.fill(this.selectors.transferDateInput, data.date);
    }

    await this.helper.click(this.selectors.reviewButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );

    await this.helper.click(this.selectors.confirmButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationModal),
      10000
    );

    logger.info({ from: data.fromAccount, to: data.toAccount, amount: data.amount }, 'Internal transfer completed');
  }

  /**
   * Add external account
   */
  async addExternalAccount(data: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'Checking' | 'Savings';
    nickname: string;
    bankName: string;
  }) {
    await this.selectTransferType('External');
    await this.helper.click(this.selectors.addExternalAccountButton);

    await this.page.waitForTimeout(1000);

    await this.helper.fill(this.selectors.routingNumberInput, data.routingNumber);
    await this.helper.fill(this.selectors.accountNumberInput, data.accountNumber);
    await this.helper.select(this.selectors.accountTypeSelect, data.accountType);
    await this.helper.fill(this.selectors.accountNicknameInput, data.nickname);
    await this.helper.fill(this.selectors.bankNameInput, data.bankName);

    await this.page.click('button:has-text("Save")'); // Adjust as needed

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );

    logger.info({ nickname: data.nickname }, 'External account added');
  }

  /**
   * Make external transfer
   */
  async makeExternalTransfer(data: {
    fromAccount: string;
    toExternalAccount: string;
    amount: number;
    memo?: string;
  }) {
    await this.selectTransferType('External');

    await this.helper.select(this.selectors.fromAccountSelect, data.fromAccount);
    await this.helper.select(this.selectors.externalAccountSelect, data.toExternalAccount);
    await this.helper.fill(this.selectors.amountInput, data.amount.toString());

    if (data.memo) {
      await this.helper.fill(this.selectors.memoInput, data.memo);
    }

    await this.helper.click(this.selectors.reviewButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );

    await this.helper.click(this.selectors.confirmButton);

    // May require verification
    if (await this.helper.isVisible(this.selectors.verificationModal, 3000)) {
      logger.info('Verification required for external transfer');
    } else {
      await Wait.forCondition(
        async () => await this.helper.isVisible(this.selectors.confirmationModal),
        10000
      );
    }

    logger.info({ amount: data.amount }, 'External transfer initiated');
  }

  /**
   * Verify transfer with code
   */
  async verifyTransfer(code: string) {
    await this.helper.fill(this.selectors.verificationCodeInput, code);
    await this.helper.click(this.selectors.verifyButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationModal),
      10000
    );

    logger.info('Transfer verified');
  }

  /**
   * Make wire transfer
   */
  async makeWireTransfer(data: {
    fromAccount: string;
    amount: number;
    recipientName: string;
    recipientBank: string;
    recipientRouting: string;
    recipientAccount: string;
    recipientAddress: string;
    swiftCode?: string;
    reference?: string;
  }) {
    await this.selectTransferType('Wire');

    await this.helper.select(this.selectors.fromAccountSelect, data.fromAccount);
    await this.helper.fill(this.selectors.amountInput, data.amount.toString());
    await this.helper.fill(this.selectors.recipientNameInput, data.recipientName);
    await this.helper.fill(this.selectors.recipientBankInput, data.recipientBank);
    await this.helper.fill(this.selectors.recipientRoutingInput, data.recipientRouting);
    await this.helper.fill(this.selectors.recipientAccountInput, data.recipientAccount);
    await this.helper.fill(this.selectors.recipientAddressInput, data.recipientAddress);

    if (data.swiftCode) {
      await this.helper.fill(this.selectors.swiftCodeInput, data.swiftCode);
    }

    if (data.reference) {
      await this.helper.fill(this.selectors.wireReferenceInput, data.reference);
    }

    await this.helper.click(this.selectors.reviewButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );

    await this.helper.click(this.selectors.confirmButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationModal),
      10000
    );

    logger.info({ amount: data.amount, recipient: data.recipientName }, 'Wire transfer initiated');
  }

  /**
   * Schedule recurring transfer
   */
  async scheduleRecurringTransfer(data: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    frequency: string;
    startDate: string;
    endDate?: string;
    numberOfTransfers?: number;
  }) {
    await this.selectTransferType('Internal');

    await this.helper.select(this.selectors.fromAccountSelect, data.fromAccount);
    await this.helper.select(this.selectors.toAccountSelect, data.toAccount);
    await this.helper.fill(this.selectors.amountInput, data.amount.toString());

    await this.helper.check(this.selectors.recurringCheckbox);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.frequencySelect),
      3000
    );

    await this.helper.select(this.selectors.frequencySelect, data.frequency);
    await this.helper.fill(this.selectors.startDateInput, data.startDate);

    if (data.endDate) {
      await this.helper.fill(this.selectors.endDateInput, data.endDate);
    }

    if (data.numberOfTransfers) {
      await this.helper.fill(this.selectors.numberOfTransfersInput, data.numberOfTransfers.toString());
    }

    await this.helper.click(this.selectors.reviewButton);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );

    await this.helper.click(this.selectors.confirmButton);

    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationModal),
      10000
    );

    logger.info({ frequency: data.frequency }, 'Recurring transfer scheduled');
  }

  /**
   * Get confirmation number
   */
  async getConfirmationNumber(): Promise<string> {
    return await this.helper.getText(this.selectors.confirmationNumber);
  }

  /**
   * Get tracking number
   */
  async getTrackingNumber(): Promise<string> {
    return await this.helper.getText(this.selectors.trackingNumber);
  }

  /**
   * Get estimated arrival date
   */
  async getEstimatedArrival(): Promise<string> {
    return await this.helper.getText(this.selectors.estimatedArrival);
  }

  /**
   * Close confirmation modal
   */
  async closeConfirmation() {
    await this.helper.click(this.selectors.closeButton);
  }

  /**
   * Go to pending transfers tab
   */
  async goToPending() {
    await this.helper.click(this.selectors.pendingTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.pendingList),
      5000
    );
  }

  /**
   * Go to completed transfers tab
   */
  async goToCompleted() {
    await this.helper.click(this.selectors.completedTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.completedList),
      5000
    );
  }

  /**
   * Go to scheduled transfers tab
   */
  async goToScheduled() {
    await this.helper.click(this.selectors.scheduledTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.scheduledList),
      5000
    );
  }

  /**
   * Go to failed transfers tab
   */
  async goToFailed() {
    await this.helper.click(this.selectors.failedTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.failedList),
      5000
    );
  }

  /**
   * Get all transfers from current tab
   */
  async getAllTransfers(): Promise<Array<{
    from: string;
    to: string;
    amount: number;
    date: string;
    status: string;
  }>> {
    const count = await this.helper.count(this.selectors.transferItem);
    const transfers = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.transferItem).nth(i);
      transfers.push({
        from: await item.locator('[data-field="from"]').textContent() || '',
        to: await item.locator('[data-field="to"]').textContent() || '',
        amount: parseFloat(
          (await item.locator('[data-field="amount"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        date: await item.locator('[data-field="date"]').textContent() || '',
        status: await item.locator('[data-field="status"]').textContent() || '',
      });
    }

    return transfers;
  }

  /**
   * Cancel transfer by index
   */
  async cancelTransfer(index: number) {
    await this.page.locator(this.selectors.transferItem).nth(index)
      .locator(this.selectors.cancelTransferButton).click();

    await this.page.waitForTimeout(1000);

    logger.info({ index }, 'Transfer cancelled');
  }

  /**
   * Filter transfers by date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    await this.helper.fill(this.selectors.filterStartDate, startDate);
    await this.helper.fill(this.selectors.filterEndDate, endDate);
    await this.helper.click(this.selectors.applyFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter transfers by amount
   */
  async filterByAmount(minAmount: number, maxAmount: number) {
    await this.helper.fill(this.selectors.filterMinAmount, minAmount.toString());
    await this.helper.fill(this.selectors.filterMaxAmount, maxAmount.toString());
    await this.helper.click(this.selectors.applyFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear filters
   */
  async clearFilters() {
    await this.helper.click(this.selectors.clearFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Export transfers
   */
  async exportTransfers(format: 'CSV' | 'PDF' | 'Excel') {
    await this.helper.select(this.selectors.exportFormatSelect, format);
    
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.exportButton);
    
    return await downloadPromise;
  }

  /**
   * Get daily limit
   */
  async getDailyLimit(): Promise<number> {
    const text = await this.helper.getText(this.selectors.dailyLimitDisplay);
    return parseFloat(text.replace(/[$,]/g, ''));
  }

  /**
   * Get remaining limit
   */
  async getRemainingLimit(): Promise<number> {
    const text = await this.helper.getText(this.selectors.remainingLimitDisplay);
    return parseFloat(text.replace(/[$,]/g, ''));
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
   * Check if limit warning is shown
   */
  async hasLimitWarning(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.transferLimitWarning);
  }
}