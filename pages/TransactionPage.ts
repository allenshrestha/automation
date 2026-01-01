import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class TransactionPage extends BasePage {
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

  // ====================
  // ACCOUNT SELECTION
  // ====================

  /**
   * Select account
   */
  async selectAccount(accountNumber: string) {
    const select = this.page.getByLabel(/account/i)
      .or(this.page.getByTestId('account-select'));
    await select.selectOption(accountNumber);
    await this.page.waitForTimeout(500);
    logger.debug({ accountNumber }, 'Account selected');
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<number> {
    const balanceText = await this.page.getByTestId('account-balance').textContent() || '$0';
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Get available balance
   */
  async getAvailableBalance(): Promise<number> {
    const balanceText = await this.page.getByTestId('available-balance').textContent() || '$0';
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  // ====================
  // TRANSACTION TYPE
  // ====================

  /**
   * Select transaction type
   */
  async selectTransactionType(type: 'Deposit' | 'Withdrawal' | 'Transfer') {
    const select = this.page.getByLabel(/transaction.*type/i)
      .or(this.page.getByTestId('transaction-type'));
    await select.selectOption(type);
    await this.page.waitForTimeout(500);
    logger.debug({ type }, 'Transaction type selected');
  }

  // ====================
  // TRANSACTION DETAILS
  // ====================

  /**
   * Enter amount
   */
  async enterAmount(amount: number) {
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('amount-input'));
    await amountInput.fill(amount.toString());
    logger.debug({ amount }, 'Amount entered');
  }

  /**
   * Enter description
   */
  async enterDescription(description: string) {
    const descInput = this.page.getByLabel(/description/i)
      .or(this.page.getByTestId('description-input'));
    await descInput.fill(description);
  }

  /**
   * Enter reference number
   */
  async enterReference(reference: string) {
    const refInput = this.page.getByLabel(/reference/i)
      .or(this.page.getByTestId('reference-input'));
    await refInput.fill(reference);
  }

  /**
   * Set transaction date
   */
  async setTransactionDate(date: string) {
    const dateInput = this.page.getByLabel(/date/i)
      .or(this.page.getByTestId('transaction-date'));
    await dateInput.fill(date);
  }

  // ====================
  // DEPOSIT SPECIFIC
  // ====================

  /**
   * Select deposit type
   */
  async selectDepositType(type: string) {
    const select = this.page.getByLabel(/deposit.*type/i)
      .or(this.page.getByTestId('deposit-type'));
    await select.selectOption(type);
  }

  /**
   * Enter check number (for check deposits)
   */
  async enterCheckNumber(checkNumber: string) {
    const checkInput = this.page.getByLabel(/check.*number/i)
      .or(this.page.getByTestId('check-number'));
    await checkInput.fill(checkNumber);
  }

  // ====================
  // WITHDRAWAL SPECIFIC
  // ====================

  /**
   * Select withdrawal method
   */
  async selectWithdrawalMethod(method: string) {
    const select = this.page.getByLabel(/withdrawal.*method/i)
      .or(this.page.getByTestId('withdrawal-method'));
    await select.selectOption(method);
  }

  // ====================
  // TRANSFER SPECIFIC
  // ====================

  /**
   * Setup transfer
   */
  async setupTransfer(fromAccount: string, toAccount: string, amount: number) {
    await this.selectTransactionType('Transfer');
    
    await this.page.getByTestId('transfer-from').selectOption(fromAccount);
    await this.page.getByTestId('transfer-to').selectOption(toAccount);
    await this.enterAmount(amount);
    
    logger.debug({ fromAccount, toAccount, amount }, 'Transfer configured');
  }

  /**
   * Select transfer type
   */
  async selectTransferType(type: string) {
    const select = this.page.getByLabel(/transfer.*type/i)
      .or(this.page.getByTestId('transfer-type'));
    await select.selectOption(type);
  }

  // ====================
  // RECURRING TRANSACTION
  // ====================

  /**
   * Enable recurring transaction
   */
  async enableRecurring() {
    const checkbox = this.page.getByRole('checkbox', { name: /recurring/i })
      .or(this.page.getByTestId('recurring-checkbox'));
    await checkbox.check();
    
    const frequencySelect = this.page.getByLabel(/frequency/i)
      .or(this.page.getByTestId('frequency-select'));
    await frequencySelect.waitFor({ state: 'visible', timeout: 3000 });
  }

  /**
   * Setup recurring transaction
   */
  async setupRecurring(frequency: string, startDate: string, endDate?: string) {
    await this.enableRecurring();
    
    const frequencySelect = this.page.getByLabel(/frequency/i)
      .or(this.page.getByTestId('frequency-select'));
    await frequencySelect.selectOption(frequency);
    
    await this.page.getByTestId('start-date').fill(startDate);
    
    if (endDate) {
      await this.page.getByTestId('end-date').fill(endDate);
    }
    
    logger.debug({ frequency, startDate, endDate }, 'Recurring transaction configured');
  }

  // ====================
  // REVIEW & SUBMIT
  // ====================

  /**
   * Click review button
   */
  async clickReview() {
    const reviewBtn = this.page.getByRole('button', { name: /review/i })
      .or(this.page.getByTestId('review-button'));
    await reviewBtn.click();
    
    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });
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
      amount: await this.page.getByTestId('review-amount').textContent() || '',
      account: await this.page.getByTestId('review-account').textContent() || '',
      type: await this.page.getByTestId('review-type').textContent() || '',
    };
  }

  /**
   * Confirm transaction from review modal
   */
  async confirmTransaction() {
    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-button'));
    await confirmBtn.click();
    logger.info('Transaction confirmed');
  }

  /**
   * Edit transaction from review modal
   */
  async editFromReview() {
    const editBtn = this.page.getByRole('button', { name: /edit/i })
      .or(this.page.getByTestId('edit-button'));
    await editBtn.click();
  }

  /**
   * Submit transaction
   */
  async submitTransaction() {
    const submitBtn = this.page.getByRole('button', { name: /submit/i })
      .or(this.page.getByTestId('submit-transaction'));
    await submitBtn.click();
    logger.info('Transaction submitted');
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction() {
    const cancelBtn = this.page.getByRole('button', { name: /cancel/i })
      .or(this.page.getByTestId('cancel-button'));
    await cancelBtn.click();
  }

  /**
   * Clear form
   */
  async clearForm() {
    const clearBtn = this.page.getByRole('button', { name: /clear/i })
      .or(this.page.getByTestId('clear-button'));
    await clearBtn.click();
  }

  // ====================
  // CONFIRMATION
  // ====================

  /**
   * Wait for confirmation
   */
  async waitForConfirmation() {
    const confirmationMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('confirmation-message'));
    await confirmationMsg.waitFor({ state: 'visible', timeout: 10000 });
    logger.info('Transaction confirmation received');
  }

  /**
   * Check if success message is shown
   */
  async hasSuccessMessage(): Promise<boolean> {
    const successMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('success-message'));
    return await successMsg.isVisible();
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    const successMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('success-message'));
    return await successMsg.textContent() || '';
  }

  /**
   * Get transaction ID
   */
  async getTransactionId(): Promise<string> {
    const text = await this.page.getByTestId('transaction-id').textContent() || '';
    const match = text.match(/\d+/);
    return match ? match[0] : text;
  }

  /**
   * Get confirmation number
   */
  async getConfirmationNumber(): Promise<string> {
    return await this.page.getByTestId('confirmation-number').textContent() || '';
  }

  /**
   * Download receipt
   */
  async downloadReceipt() {
    const downloadPromise = this.page.waitForEvent('download');
    
    const downloadBtn = this.page.getByRole('button', { name: /download.*receipt/i })
      .or(this.page.getByTestId('receipt-download'));
    await downloadBtn.click();
    
    return await downloadPromise;
  }

  // ====================
  // ERROR HANDLING
  // ====================

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    const errorMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('error-message'));
    return await errorMsg.isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    const errorMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('error-message'));
    return await errorMsg.textContent() || '';
  }

  /**
   * Check for insufficient funds error
   */
  async hasInsufficientFundsError(): Promise<boolean> {
    return await this.page.getByTestId('insufficient-funds').isVisible();
  }

  /**
   * Check if validation error exists
   */
  async hasValidationError(field: string): Promise<boolean> {
    return await this.page.locator(`[data-testid="validation-error"][data-field="${field}"]`).isVisible();
  }

  // ====================
  // RECENT TRANSACTIONS
  // ====================

  /**
   * Get recent transactions
   */
  async getRecentTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
  }>> {
    const items = this.page.getByTestId('transaction-item');
    const count = await items.count();
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
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
    const viewAllLink = this.page.getByRole('link', { name: /view all/i })
      .or(this.page.getByTestId('view-all'));
    await viewAllLink.click();
  }

  // ====================
  // COMPLETE WORKFLOWS
  // ====================

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