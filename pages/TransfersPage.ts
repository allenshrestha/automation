import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class TransfersPage extends BasePage {
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

  // ====================
  // TRANSFER TYPE
  // ====================

  /**
   * Select transfer type
   */
  async selectTransferType(type: 'Internal' | 'External' | 'Wire') {
    const select = this.page.getByLabel(/transfer.*type/i)
      .or(this.page.getByTestId('transfer-type'));
    
    await select.selectOption(type);
    await this.page.waitForTimeout(500);
    logger.debug({ type }, 'Transfer type selected');
  }

  // ====================
  // INTERNAL TRANSFER
  // ====================

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

    await this.page.getByTestId('from-account').selectOption(data.fromAccount);
    await this.page.getByTestId('to-account').selectOption(data.toAccount);
    
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('transfer-amount'));
    await amountInput.fill(data.amount.toString());

    if (data.memo) {
      const memoInput = this.page.getByLabel(/memo/i)
        .or(this.page.getByTestId('transfer-memo'));
      await memoInput.fill(data.memo);
    }

    if (data.date) {
      await this.page.getByTestId('transfer-date').fill(data.date);
    }

    const reviewBtn = this.page.getByRole('button', { name: /review/i })
      .or(this.page.getByTestId('review-transfer'));
    await reviewBtn.click();

    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-transfer'));
    await confirmBtn.click();

    const confirmationModal = this.page.getByTestId('confirmation-modal');
    await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });

    logger.info({ from: data.fromAccount, to: data.toAccount, amount: data.amount }, 'Internal transfer completed');
  }

  // ====================
  // EXTERNAL ACCOUNT
  // ====================

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
    
    const addBtn = this.page.getByRole('button', { name: /add.*external/i })
      .or(this.page.getByTestId('add-external-account'));
    await addBtn.click();

    await this.page.waitForTimeout(1000);

    await this.page.getByTestId('routing-number').fill(data.routingNumber);
    await this.page.getByTestId('account-number').fill(data.accountNumber);
    await this.page.getByTestId('account-type').selectOption(data.accountType);
    await this.page.getByTestId('account-nickname').fill(data.nickname);
    await this.page.getByTestId('bank-name').fill(data.bankName);

    const saveBtn = this.page.getByRole('button', { name: /save/i });
    await saveBtn.click();

    const successMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('success-message'));
    await successMsg.waitFor({ state: 'visible', timeout: 5000 });

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

    await this.page.getByTestId('from-account').selectOption(data.fromAccount);
    await this.page.getByTestId('external-account').selectOption(data.toExternalAccount);
    
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('transfer-amount'));
    await amountInput.fill(data.amount.toString());

    if (data.memo) {
      const memoInput = this.page.getByLabel(/memo/i)
        .or(this.page.getByTestId('transfer-memo'));
      await memoInput.fill(data.memo);
    }

    const reviewBtn = this.page.getByRole('button', { name: /review/i })
      .or(this.page.getByTestId('review-transfer'));
    await reviewBtn.click();

    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-transfer'));
    await confirmBtn.click();

    // May require verification
    const verificationModal = this.page.getByTestId('verification-modal');
    const isVerificationVisible = await verificationModal.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isVerificationVisible) {
      logger.info('Verification required for external transfer');
    } else {
      const confirmationModal = this.page.getByTestId('confirmation-modal');
      await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });
    }

    logger.info({ amount: data.amount }, 'External transfer initiated');
  }

  /**
   * Verify transfer with code
   */
  async verifyTransfer(code: string) {
    await this.page.getByTestId('verification-code').fill(code);
    
    const verifyBtn = this.page.getByRole('button', { name: /verify/i })
      .or(this.page.getByTestId('verify-button'));
    await verifyBtn.click();

    const confirmationModal = this.page.getByTestId('confirmation-modal');
    await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });

    logger.info('Transfer verified');
  }

  // ====================
  // WIRE TRANSFER
  // ====================

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

    await this.page.getByTestId('from-account').selectOption(data.fromAccount);
    
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('transfer-amount'));
    await amountInput.fill(data.amount.toString());
    
    await this.page.getByTestId('recipient-name').fill(data.recipientName);
    await this.page.getByTestId('recipient-bank').fill(data.recipientBank);
    await this.page.getByTestId('recipient-routing').fill(data.recipientRouting);
    await this.page.getByTestId('recipient-account').fill(data.recipientAccount);
    await this.page.getByTestId('recipient-address').fill(data.recipientAddress);

    if (data.swiftCode) {
      await this.page.getByTestId('swift-code').fill(data.swiftCode);
    }

    if (data.reference) {
      await this.page.getByTestId('wire-reference').fill(data.reference);
    }

    const reviewBtn = this.page.getByRole('button', { name: /review/i })
      .or(this.page.getByTestId('review-transfer'));
    await reviewBtn.click();

    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-transfer'));
    await confirmBtn.click();

    const confirmationModal = this.page.getByTestId('confirmation-modal');
    await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });

    logger.info({ amount: data.amount, recipient: data.recipientName }, 'Wire transfer initiated');
  }

  // ====================
  // RECURRING TRANSFER
  // ====================

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

    await this.page.getByTestId('from-account').selectOption(data.fromAccount);
    await this.page.getByTestId('to-account').selectOption(data.toAccount);
    
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('transfer-amount'));
    await amountInput.fill(data.amount.toString());

    const recurringCheckbox = this.page.getByRole('checkbox', { name: /recurring/i })
      .or(this.page.getByTestId('recurring-transfer'));
    await recurringCheckbox.check();

    const frequencySelect = this.page.getByLabel(/frequency/i)
      .or(this.page.getByTestId('frequency'));
    await frequencySelect.waitFor({ state: 'visible', timeout: 3000 });
    await frequencySelect.selectOption(data.frequency);
    
    await this.page.getByTestId('start-date').fill(data.startDate);

    if (data.endDate) {
      await this.page.getByTestId('end-date').fill(data.endDate);
    }

    if (data.numberOfTransfers) {
      await this.page.getByTestId('number-of-transfers').fill(data.numberOfTransfers.toString());
    }

    const reviewBtn = this.page.getByRole('button', { name: /review/i })
      .or(this.page.getByTestId('review-transfer'));
    await reviewBtn.click();
    
    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-transfer'));
    await confirmBtn.click();

    const confirmationModal = this.page.getByTestId('confirmation-modal');
    await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });

    logger.info({ frequency: data.frequency }, 'Recurring transfer scheduled');
  }

  // ====================
  // CONFIRMATION
  // ====================

  /**
   * Get confirmation number
   */
  async getConfirmationNumber(): Promise<string> {
    return await this.page.getByTestId('confirmation-number').textContent() || '';
  }

  /**
   * Get tracking number
   */
  async getTrackingNumber(): Promise<string> {
    return await this.page.getByTestId('tracking-number').textContent() || '';
  }

  /**
   * Get estimated arrival date
   */
  async getEstimatedArrival(): Promise<string> {
    return await this.page.getByTestId('estimated-arrival').textContent() || '';
  }

  /**
   * Close confirmation modal
   */
  async closeConfirmation() {
    const closeBtn = this.page.getByRole('button', { name: /close/i })
      .or(this.page.getByTestId('close-confirmation'));
    await closeBtn.click();
  }

  // ====================
  // TRANSFER HISTORY TABS
  // ====================

  /**
   * Go to pending transfers tab
   */
  async goToPending() {
    const tab = this.page.getByRole('tab', { name: /pending/i })
      .or(this.page.getByTestId('tab-pending'));
    await tab.click();
    
    const list = this.page.getByTestId('pending-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Go to completed transfers tab
   */
  async goToCompleted() {
    const tab = this.page.getByRole('tab', { name: /completed/i })
      .or(this.page.getByTestId('tab-completed'));
    await tab.click();
    
    const list = this.page.getByTestId('completed-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Go to scheduled transfers tab
   */
  async goToScheduled() {
    const tab = this.page.getByRole('tab', { name: /scheduled/i })
      .or(this.page.getByTestId('tab-scheduled'));
    await tab.click();
    
    const list = this.page.getByTestId('scheduled-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Go to failed transfers tab
   */
  async goToFailed() {
    const tab = this.page.getByRole('tab', { name: /failed/i })
      .or(this.page.getByTestId('tab-failed'));
    await tab.click();
    
    const list = this.page.getByTestId('failed-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  // ====================
  // GET TRANSFERS
  // ====================

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
    const items = this.page.getByTestId('transfer-item');
    const count = await items.count();
    const transfers = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
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
    const cancelBtn = this.page.getByTestId('transfer-item').nth(index)
      .getByRole('button', { name: /cancel/i })
      .or(this.page.getByTestId('cancel-transfer-item'));
    
    await cancelBtn.click();
    await this.page.waitForTimeout(1000);

    logger.info({ index }, 'Transfer cancelled');
  }

  // ====================
  // FILTERS
  // ====================

  /**
   * Filter transfers by date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    await this.page.getByTestId('filter-start-date').fill(startDate);
    await this.page.getByTestId('filter-end-date').fill(endDate);
    
    const applyBtn = this.page.getByRole('button', { name: /apply/i })
      .or(this.page.getByTestId('apply-filters'));
    await applyBtn.click();
    
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter transfers by amount
   */
  async filterByAmount(minAmount: number, maxAmount: number) {
    await this.page.getByTestId('filter-min-amount').fill(minAmount.toString());
    await this.page.getByTestId('filter-max-amount').fill(maxAmount.toString());
    
    const applyBtn = this.page.getByRole('button', { name: /apply/i })
      .or(this.page.getByTestId('apply-filters'));
    await applyBtn.click();
    
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear filters
   */
  async clearFilters() {
    const clearBtn = this.page.getByRole('button', { name: /clear/i })
      .or(this.page.getByTestId('clear-filters'));
    await clearBtn.click();
    
    await this.page.waitForTimeout(1000);
  }

  // ====================
  // EXPORT
  // ====================

  /**
   * Export transfers
   */
  async exportTransfers(format: 'CSV' | 'PDF' | 'Excel') {
    await this.page.getByTestId('export-format').selectOption(format);
    
    const downloadPromise = this.page.waitForEvent('download');
    
    const exportBtn = this.page.getByRole('button', { name: /export/i })
      .or(this.page.getByTestId('export-transfers'));
    await exportBtn.click();
    
    return await downloadPromise;
  }

  // ====================
  // LIMITS
  // ====================

  /**
   * Get daily limit
   */
  async getDailyLimit(): Promise<number> {
    const text = await this.page.getByTestId('daily-limit').textContent() || '$0';
    return parseFloat(text.replace(/[$,]/g, ''));
  }

  /**
   * Get remaining limit
   */
  async getRemainingLimit(): Promise<number> {
    const text = await this.page.getByTestId('remaining-limit').textContent() || '$0';
    return parseFloat(text.replace(/[$,]/g, ''));
  }

  // ====================
  // MESSAGES
  // ====================

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
   * Check if error message is shown
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
   * Check if limit warning is shown
   */
  async hasLimitWarning(): Promise<boolean> {
    return await this.page.getByTestId('transfer-limit-warning').isVisible();
  }
}