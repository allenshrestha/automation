import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class TransactionPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="transaction-page-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Account selection
    accountSelect: '[data-testid="account-select"]',
    accountBalance: '[data-testid="account-balance"]',
    availableBalance: '[data-testid="available-balance"]',
    
    // Transaction type
    transactionTypeSelect: '[data-testid="transaction-type"]',
    depositOption: '[data-testid="type-deposit"]',
    withdrawalOption: '[data-testid="type-withdrawal"]',
    transferOption: '[data-testid="type-transfer"]',
    
    // Transaction details
    amountInput: '[data-testid="amount-input"]',
    descriptionInput: '[data-testid="description-input"]',
    referenceInput: '[data-testid="reference-input"]',
    dateInput: '[data-testid="transaction-date"]',
    
    // Transfer specific
    transferFromAccount: '[data-testid="transfer-from"]',
    transferToAccount: '[data-testid="transfer-to"]',
    transferTypeSelect: '[data-testid="transfer-type"]',
    
    // Deposit specific
    depositTypeSelect: '[data-testid="deposit-type"]',
    checkNumberInput: '[data-testid="check-number"]',
    
    // Withdrawal specific
    withdrawalMethodSelect: '[data-testid="withdrawal-method"]',
    
    // Recurring transaction
    recurringCheckbox: '[data-testid="recurring-checkbox"]',
    frequencySelect: '[data-testid="frequency-select"]',
    startDateInput: '[data-testid="start-date"]',
    endDateInput: '[data-testid="end-date"]',
    
    // Buttons
    submitButton: '[data-testid="submit-transaction"]',
    cancelButton: '[data-testid="cancel-button"]',
    clearButton: '[data-testid="clear-button"]',
    reviewButton: '[data-testid="review-button"]',
    
    // Review modal
    reviewModal: '[data-testid="review-modal"]',
    reviewAmount: '[data-testid="review-amount"]',
    reviewAccount: '[data-testid="review-account"]',
    reviewType: '[data-testid="review-type"]',
    confirmButton: '[data-testid="confirm-button"]',
    editButton: '[data-testid="edit-button"]',
    
    // Confirmation
    confirmationMessage: '[data-testid="confirmation-message"]',
    successMessage: '[data-testid="success-message"]',
    transactionIdDisplay: '[data-testid="transaction-id"]',
    confirmationNumber: '[data-testid="confirmation-number"]',
    receiptDownload: '[data-testid="download-receipt"]',
    
    // Error messages
    errorMessage: '[data-testid="error-message"]',
    validationError: '[data-testid="validation-error"]',
    insufficientFundsError: '[data-testid="insufficient-funds"]',
    
    // Transaction history (on same page)
    recentTransactions: '[data-testid="recent-transactions"]',
    transactionItem: '[data-testid="transaction-item"]',
    viewAllLink: '[data-testid="view-all-transactions"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to transaction page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/transactions/new');
    await this.waitForPageLoad();
    logger.debug('Navigated to transaction page');
  }

  /**
   * Select account
   */
  async selectAccount(accountNumber: string) {
    await this.helper.select(this.selectors.accountSelect, accountNumber);
    await this.page.waitForTimeout(500); // Wait for balance to load
    logger.debug({ accountNumber }, 'Account selected');
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<number> {
    const balanceText = await this.helper.getText(this.selectors.accountBalance);
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Get available balance
   */
  async getAvailableBalance(): Promise<number> {
    const balanceText = await this.helper.getText(this.selectors.availableBalance);
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Select transaction type
   */
  async selectTransactionType(type: 'Deposit' | 'Withdrawal' | 'Transfer') {
    await this.helper.select(this.selectors.transactionTypeSelect, type);
    await this.page.waitForTimeout(500); // Wait for type-specific fields
    logger.debug({ type }, 'Transaction type selected');
  }

  /**
   * Enter amount
   */
  async enterAmount(amount: number) {
    await this.helper.fill(this.selectors.amountInput, amount.toString());
    logger.debug({ amount }, 'Amount entered');
  }

  /**
   * Enter description
   */
  async enterDescription(description: string) {
    await this.helper.fill(this.selectors.descriptionInput, description);
  }

  /**
   * Enter reference number
   */
  async enterReference(reference: string) {
    await this.helper.fill(this.selectors.referenceInput, reference);
  }

  /**
   * Set transaction date
   */
  async setTransactionDate(date: string) {
    await this.helper.fill(this.selectors.dateInput, date);
  }

  /**
   * Select deposit type
   */
  async selectDepositType(type: string) {
    await this.helper.select(this.selectors.depositTypeSelect, type);
  }

  /**
   * Enter check number (for check deposits)
   */
  async enterCheckNumber(checkNumber: string) {
    await this.helper.fill(this.selectors.checkNumberInput, checkNumber);
  }

  /**
   * Select withdrawal method
   */
  async selectWithdrawalMethod(method: string) {
    await this.helper.select(this.selectors.withdrawalMethodSelect, method);
  }

  /**
   * Setup transfer
   */
  async setupTransfer(fromAccount: string, toAccount: string, amount: number) {
    await this.selectTransactionType('Transfer');
    await this.helper.select(this.selectors.transferFromAccount, fromAccount);
    await this.helper.select(this.selectors.transferToAccount, toAccount);
    await this.enterAmount(amount);
    logger.debug({ fromAccount, toAccount, amount }, 'Transfer configured');
  }

  /**
   * Select transfer type
   */
  async selectTransferType(type: string) {
    await this.helper.select(this.selectors.transferTypeSelect, type);
  }

  /**
   * Enable recurring transaction
   */
  async enableRecurring() {
    await this.helper.check(this.selectors.recurringCheckbox);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.frequencySelect),
      3000
    );
  }

  /**
   * Setup recurring transaction
   */
  async setupRecurring(frequency: string, startDate: string, endDate?: string) {
    await this.enableRecurring();
    await this.helper.select(this.selectors.frequencySelect, frequency);
    await this.helper.fill(this.selectors.startDateInput, startDate);
    if (endDate) {
      await this.helper.fill(this.selectors.endDateInput, endDate);
    }
    logger.debug({ frequency, startDate, endDate }, 'Recurring transaction configured');
  }

  /**
   * Click review button
   */
  async clickReview() {
    await this.helper.click(this.selectors.reviewButton);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.reviewModal),
      5000
    );
  }

  /**
   * Get review details
   */
  async getReviewDetails(): Promise<{
    amount: string;
    account: string;
    type: string;
  }> {
    return {
      amount: await this.helper.getText(this.selectors.reviewAmount),
      account: await this.helper.getText(this.selectors.reviewAccount),
      type: await this.helper.getText(this.selectors.reviewType),
    };
  }

  /**
   * Confirm transaction from review modal
   */
  async confirmTransaction() {
    await this.helper.click(this.selectors.confirmButton);
    logger.info('Transaction confirmed');
  }

  /**
   * Edit transaction from review modal
   */
  async editFromReview() {
    await this.helper.click(this.selectors.editButton);
  }

  /**
   * Submit transaction
   */
  async submitTransaction() {
    await this.helper.click(this.selectors.submitButton);
    logger.info('Transaction submitted');
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction() {
    await this.helper.click(this.selectors.cancelButton);
  }

  /**
   * Clear form
   */
  async clearForm() {
    await this.helper.click(this.selectors.clearButton);
  }

  /**
   * Wait for confirmation
   */
  async waitForConfirmation() {
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.confirmationMessage),
      10000
    );
    logger.info('Transaction confirmation received');
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
   * Get transaction ID
   */
  async getTransactionId(): Promise<string> {
    const text = await this.helper.getText(this.selectors.transactionIdDisplay);
    const match = text.match(/\d+/);
    return match ? match[0] : text;
  }

  /**
   * Get confirmation number
   */
  async getConfirmationNumber(): Promise<string> {
    return await this.helper.getText(this.selectors.confirmationNumber);
  }

  /**
   * Download receipt
   */
  async downloadReceipt() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.receiptDownload);
    return await downloadPromise;
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
   * Check for insufficient funds error
   */
  async hasInsufficientFundsError(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.insufficientFundsError);
  }

  /**
   * Check if validation error exists
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.helper.isVisible(`${this.selectors.validationError}[data-field="${field}"]`);
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
  }>> {
    const count = await this.helper.count(this.selectors.transactionItem);
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.transactionItem).nth(i);
      transactions.push({
        date: await item.locator('[data-field="date"]').textContent() || '',
        description: await item.locator('[data-field="description"]').textContent() || '',
        amount: parseFloat(
          (await item.locator('[data-field="amount"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        balance: parseFloat(
          (await item.locator('[data-field="balance"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
      });
    }

    return transactions;
  }

  /**
   * Click view all transactions
   */
  async viewAllTransactions() {
    await this.helper.click(this.selectors.viewAllLink);
  }

  /**
   * Complete deposit workflow
   */
  async makeDeposit(data: {
    account: string;
    amount: number;
    description: string;
    depositType?: string;
    checkNumber?: string;
  }) {
    await this.selectAccount(data.account);
    await this.selectTransactionType('Deposit');
    await this.enterAmount(data.amount);
    await this.enterDescription(data.description);

    if (data.depositType) {
      await this.selectDepositType(data.depositType);
    }

    if (data.checkNumber) {
      await this.enterCheckNumber(data.checkNumber);
    }

    await this.submitTransaction();
    await this.waitForConfirmation();

    logger.info({ account: data.account, amount: data.amount }, 'Deposit completed');
  }

  /**
   * Complete withdrawal workflow
   */
  async makeWithdrawal(data: {
    account: string;
    amount: number;
    description: string;
    method?: string;
  }) {
    await this.selectAccount(data.account);
    await this.selectTransactionType('Withdrawal');
    await this.enterAmount(data.amount);
    await this.enterDescription(data.description);

    if (data.method) {
      await this.selectWithdrawalMethod(data.method);
    }

    await this.submitTransaction();
    await this.waitForConfirmation();

    logger.info({ account: data.account, amount: data.amount }, 'Withdrawal completed');
  }

  /**
   * Complete transfer workflow
   */
  async makeTransfer(data: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    description: string;
    transferType?: string;
  }) {
    await this.setupTransfer(data.fromAccount, data.toAccount, data.amount);
    await this.enterDescription(data.description);

    if (data.transferType) {
      await this.selectTransferType(data.transferType);
    }

    await this.submitTransaction();
    await this.waitForConfirmation();

    logger.info(
      { from: data.fromAccount, to: data.toAccount, amount: data.amount },
      'Transfer completed'
    );
  }
}