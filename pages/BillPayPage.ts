import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class BillPayPage extends BasePage {
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

  // ====================
  // PAYEE MANAGEMENT
  // ====================

  /**
   * Click add payee button
   */
  async clickAddPayee() {
    const addBtn = this.page.getByRole('button', { name: /add.*payee/i })
      .or(this.page.getByTestId('add-payee'));
    await addBtn.click();
    
    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('payee-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });
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

    await this.page.getByTestId('payee-name-input').fill(payeeData.name);
    
    if (payeeData.nickname) {
      await this.page.getByTestId('payee-nickname-input').fill(payeeData.nickname);
    }

    await this.page.getByTestId('payee-account-input').fill(payeeData.accountNumber);
    await this.page.getByTestId('payee-address-input').fill(payeeData.address);
    await this.page.getByTestId('payee-city-input').fill(payeeData.city);
    await this.page.getByTestId('payee-state-select').selectOption(payeeData.state);
    await this.page.getByTestId('payee-zip-input').fill(payeeData.zip);

    if (payeeData.phone) {
      await this.page.getByTestId('payee-phone-input').fill(payeeData.phone);
    }

    if (payeeData.category) {
      await this.page.getByTestId('payee-category-select').selectOption(payeeData.category);
    }

    const saveBtn = this.page.getByRole('button', { name: /save/i })
      .or(this.page.getByTestId('save-payee'));
    await saveBtn.click();

    const successMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('success-message'));
    await successMsg.waitFor({ state: 'visible', timeout: 5000 });

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
    const items = this.page.getByTestId('payee-item');
    const count = await items.count();
    const payees = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
      payees.push({
        name: await item.locator('[data-field="payee-name"]').textContent() || '',
        account: await item.locator('[data-field="payee-account"]').textContent() || '',
        status: await item.locator('[data-field="payee-status"]').textContent() || '',
      });
    }

    return payees;
  }

  /**
   * Search for payee
   */
  async searchPayee(payeeName: string) {
    const searchInput = this.page.getByRole('searchbox')
      .or(this.page.getByTestId('search-payee'));
    await searchInput.fill(payeeName);
    
    const searchBtn = this.page.getByRole('button', { name: /search/i })
      .or(this.page.getByTestId('search-button'));
    await searchBtn.click();
    
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
    const editBtn = this.page.getByTestId('payee-item').nth(index)
      .getByRole('button', { name: /edit/i })
      .or(this.page.getByTestId('edit-payee'));
    await editBtn.click();

    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('payee-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    if (updates.name) {
      await this.page.getByTestId('payee-name-input').fill(updates.name);
    }
    if (updates.nickname) {
      await this.page.getByTestId('payee-nickname-input').fill(updates.nickname);
    }
    if (updates.accountNumber) {
      await this.page.getByTestId('payee-account-input').fill(updates.accountNumber);
    }
    if (updates.phone) {
      await this.page.getByTestId('payee-phone-input').fill(updates.phone);
    }

    const saveBtn = this.page.getByRole('button', { name: /save/i })
      .or(this.page.getByTestId('save-payee'));
    await saveBtn.click();

    const successMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('success-message'));
    await successMsg.waitFor({ state: 'visible', timeout: 5000 });

    logger.info({ index }, 'Payee updated');
  }

  /**
   * Delete payee by index
   */
  async deletePayee(index: number) {
    const deleteBtn = this.page.getByTestId('payee-item').nth(index)
      .getByRole('button', { name: /delete/i })
      .or(this.page.getByTestId('delete-payee'));
    await deleteBtn.click();

    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('delete-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-delete'));
    await confirmBtn.click();

    const successMsg = this.page.getByRole('alert')
      .or(this.page.getByTestId('success-message'));
    await successMsg.waitFor({ state: 'visible', timeout: 5000 });

    logger.info({ index }, 'Payee deleted');
  }

  // ====================
  // MAKE PAYMENT
  // ====================

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
    const makePaymentBtn = this.page.getByRole('button', { name: /make.*payment/i })
      .or(this.page.getByTestId('make-payment'));
    await makePaymentBtn.click();

    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('payment-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    await this.page.getByTestId('select-payee').selectOption(paymentData.payee);
    await this.page.getByTestId('pay-from-account').selectOption(paymentData.fromAccount);
    
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('payment-amount'));
    await amountInput.fill(paymentData.amount.toString());
    
    await this.page.getByTestId('payment-date').fill(paymentData.date);

    if (paymentData.memo) {
      await this.page.getByTestId('payment-memo').fill(paymentData.memo);
    }

    if (paymentData.deliveryMethod) {
      await this.page.getByTestId('delivery-method').selectOption(paymentData.deliveryMethod);
    }

    // Review payment
    const reviewBtn = this.page.getByRole('button', { name: /review/i });
    await reviewBtn.click();

    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });

    // Confirm payment
    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-payment'));
    await confirmBtn.click();

    const confirmationModal = this.page.getByTestId('confirmation-modal');
    await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });

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
    const makePaymentBtn = this.page.getByRole('button', { name: /make.*payment/i })
      .or(this.page.getByTestId('make-payment'));
    await makePaymentBtn.click();

    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('payment-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    await this.page.getByTestId('select-payee').selectOption(paymentData.payee);
    await this.page.getByTestId('pay-from-account').selectOption(paymentData.fromAccount);
    
    const amountInput = this.page.getByLabel(/amount/i)
      .or(this.page.getByTestId('payment-amount'));
    await amountInput.fill(paymentData.amount.toString());

    // Enable recurring
    const recurringCheckbox = this.page.getByRole('checkbox', { name: /recurring/i })
      .or(this.page.getByTestId('recurring-payment'));
    await recurringCheckbox.check();

    const frequencySelect = this.page.getByLabel(/frequency/i)
      .or(this.page.getByTestId('payment-frequency'));
    await frequencySelect.waitFor({ state: 'visible', timeout: 3000 });
    await frequencySelect.selectOption(paymentData.frequency);
    
    await this.page.getByTestId('recurring-start-date').fill(paymentData.startDate);

    if (paymentData.endDate) {
      await this.page.getByTestId('recurring-end-date').fill(paymentData.endDate);
    }

    if (paymentData.numberOfPayments) {
      await this.page.getByTestId('number-of-payments').fill(paymentData.numberOfPayments.toString());
    }

    if (paymentData.memo) {
      await this.page.getByTestId('payment-memo').fill(paymentData.memo);
    }

    // Review and confirm
    const reviewBtn = this.page.getByRole('button', { name: /review/i });
    await reviewBtn.click();
    
    const reviewModal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('review-modal'));
    await reviewModal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-payment'));
    await confirmBtn.click();

    const confirmationModal = this.page.getByTestId('confirmation-modal');
    await confirmationModal.waitFor({ state: 'visible', timeout: 10000 });

    logger.info({ payee: paymentData.payee, frequency: paymentData.frequency }, 'Recurring payment scheduled');
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
   * Close confirmation modal
   */
  async closeConfirmation() {
    const closeBtn = this.page.getByRole('button', { name: /close/i })
      .or(this.page.getByTestId('close-confirmation'));
    await closeBtn.click();
  }

  // ====================
  // PAYMENT HISTORY TABS
  // ====================

  /**
   * Go to payment history tab
   */
  async goToPaymentHistory() {
    const tab = this.page.getByRole('tab', { name: /payment.*history/i })
      .or(this.page.getByTestId('payment-history-tab'));
    await tab.click();
    
    const list = this.page.getByTestId('payment-history-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Go to scheduled payments tab
   */
  async goToScheduledPayments() {
    const tab = this.page.getByRole('tab', { name: /scheduled/i })
      .or(this.page.getByTestId('scheduled-payments-tab'));
    await tab.click();
    
    const list = this.page.getByTestId('scheduled-payments-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Go to recurring payments tab
   */
  async goToRecurringPayments() {
    const tab = this.page.getByRole('tab', { name: /recurring/i })
      .or(this.page.getByTestId('recurring-payments-tab'));
    await tab.click();
    
    const list = this.page.getByTestId('recurring-payments-list');
    await list.waitFor({ state: 'visible', timeout: 5000 });
  }

  // ====================
  // GET PAYMENTS
  // ====================

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

    const items = this.page.getByTestId('payment-history-item');
    const count = await items.count();
    const payments = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
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

    const items = this.page.getByTestId('scheduled-payment-item');
    const count = await items.count();
    const payments = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
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

  // ====================
  // PAYMENT ACTIONS
  // ====================

  /**
   * Cancel scheduled payment by index
   */
  async cancelScheduledPayment(index: number) {
    await this.goToScheduledPayments();

    const cancelBtn = this.page.getByTestId('scheduled-payment-item').nth(index)
      .getByRole('button', { name: /cancel/i })
      .or(this.page.getByTestId('cancel-payment'));
    await cancelBtn.click();

    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('delete-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-delete'));
    await confirmBtn.click();

    logger.info({ index }, 'Scheduled payment cancelled');
  }

  /**
   * Pause recurring payment by index
   */
  async pauseRecurringPayment(index: number) {
    await this.goToRecurringPayments();

    const pauseBtn = this.page.getByTestId('recurring-payment-item').nth(index)
      .getByRole('button', { name: /pause/i })
      .or(this.page.getByTestId('pause-recurring'));
    await pauseBtn.click();

    await this.page.waitForTimeout(1000);

    logger.info({ index }, 'Recurring payment paused');
  }

  /**
   * Resume recurring payment by index
   */
  async resumeRecurringPayment(index: number) {
    await this.goToRecurringPayments();

    const resumeBtn = this.page.getByTestId('recurring-payment-item').nth(index)
      .getByRole('button', { name: /resume/i })
      .or(this.page.getByTestId('resume-recurring'));
    await resumeBtn.click();

    await this.page.waitForTimeout(1000);

    logger.info({ index }, 'Recurring payment resumed');
  }

  /**
   * Stop recurring payment by index
   */
  async stopRecurringPayment(index: number) {
    await this.goToRecurringPayments();

    const stopBtn = this.page.getByTestId('recurring-payment-item').nth(index)
      .getByRole('button', { name: /stop/i })
      .or(this.page.getByTestId('stop-recurring'));
    await stopBtn.click();

    const modal = this.page.getByRole('dialog')
      .or(this.page.getByTestId('delete-modal'));
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const confirmBtn = this.page.getByRole('button', { name: /confirm/i })
      .or(this.page.getByTestId('confirm-delete'));
    await confirmBtn.click();

    logger.info({ index }, 'Recurring payment stopped');
  }

  // ====================
  // FILTERS
  // ====================

  /**
   * Filter payments by date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    await this.page.getByTestId('filter-start-date').fill(startDate);
    await this.page.getByTestId('filter-end-date').fill(endDate);
    
    const applyBtn = this.page.getByRole('button', { name: /apply/i })
      .or(this.page.getByTestId('apply-filters'));
    await applyBtn.click();
    
    await this.page.waitForTimeout(1000);
  }

  // ====================
  // EXPORT
  // ====================

  /**
   * Export payments
   */
  async exportPayments(format: 'CSV' | 'PDF' | 'Excel') {
    await this.page.getByTestId('export-format').selectOption(format);
    
    const downloadPromise = this.page.waitForEvent('download');
    
    const exportBtn = this.page.getByRole('button', { name: /export/i })
      .or(this.page.getByTestId('export-payments'));
    await exportBtn.click();
    
    return await downloadPromise;
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
}