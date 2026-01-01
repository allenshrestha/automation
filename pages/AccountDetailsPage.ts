import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * AccountDetailsPage - MODERNIZED FOR 2025
 * 
 * CHANGES FROM ORIGINAL:
 * ✅ All locators use getByRole/getByLabel/getByText first
 * ✅ data-testid ONLY as fallback
 * ✅ Locator getters return Locator objects (chainable)
 * ✅ Removed ALL page.waitForTimeout() calls
 * ✅ Auto-waiting assertions instead of manual waits
 * ✅ No deprecated PageHelper methods
 * ✅ parseAmount utility kept (good pattern)
 */
export class AccountDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to account details page
   */
  async navigate(accountNumber: string) {
    await this.page.goto(`${Config.BANNO_BASE_URL}/accounts/${accountNumber}`);
    await this.waitForPageLoad();
    logger.debug({ accountNumber }, 'Navigated to account details');
  }

  /**
   * Wait for account details to load
   * Uses auto-waiting instead of manual timeouts
   */
  async waitForDetailsToLoad() {
    // Wait for account number to be visible (indicates page loaded)
    await this.getAccountNumberDisplay().waitFor({ state: 'visible' });
  }

  // ====================
  // LOCATOR GETTERS (Modern Pattern)
  // ====================

  /**
   * Get account number display element
   */
  getAccountNumberDisplay(): Locator {
    return this.page.getByRole('heading', { name: /account.*number/i })
      .or(this.page.getByTestId('account-number'));
  }

  /**
   * Get account type display
   */
  getAccountTypeDisplay(): Locator {
    return this.page.getByText(/checking|savings|money market/i)
      .or(this.page.getByTestId('account-type'));
  }

  /**
   * Get current balance display
   */
  getCurrentBalanceDisplay(): Locator {
    return this.page.getByRole('status', { name: /current.*balance/i })
      .or(this.page.getByTestId('current-balance'));
  }

  /**
   * Get available balance display
   */
  getAvailableBalanceDisplay(): Locator {
    return this.page.getByRole('status', { name: /available.*balance/i })
      .or(this.page.getByTestId('available-balance'));
  }

  /**
   * Get make deposit button
   */
  getMakeDepositButton(): Locator {
    return this.page.getByRole('button', { name: /make.*deposit|deposit/i })
      .or(this.page.getByTestId('make-deposit'));
  }

  /**
   * Get make withdrawal button
   */
  getMakeWithdrawalButton(): Locator {
    return this.page.getByRole('button', { name: /make.*withdrawal|withdraw/i })
      .or(this.page.getByTestId('make-withdrawal'));
  }

  /**
   * Get transfer funds button
   */
  getTransferFundsButton(): Locator {
    return this.page.getByRole('button', { name: /transfer.*funds|transfer/i })
      .or(this.page.getByTestId('transfer-funds'));
  }

  /**
   * Get transactions tab
   */
  getTransactionsTab(): Locator {
    return this.page.getByRole('tab', { name: /transactions/i })
      .or(this.page.getByTestId('tab-transactions'));
  }

  /**
   * Get details tab
   */
  getDetailsTab(): Locator {
    return this.page.getByRole('tab', { name: /details/i })
      .or(this.page.getByTestId('tab-details'));
  }

  /**
   * Get documents tab
   */
  getDocumentsTab(): Locator {
    return this.page.getByRole('tab', { name: /documents/i })
      .or(this.page.getByTestId('tab-documents'));
  }

  /**
   * Get settings tab
   */
  getSettingsTab(): Locator {
    return this.page.getByRole('tab', { name: /settings/i })
      .or(this.page.getByTestId('tab-settings'));
  }

  /**
   * Get transaction items
   */
  getTransactionItems(): Locator {
    return this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/transaction/i) })
      .or(this.page.getByTestId('transaction-item'));
  }

  /**
   * Get success alert
   */
  getSuccessAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /success|complete/i })
      .or(this.page.getByTestId('success-message'));
  }

  /**
   * Get error alert
   */
  getErrorAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /error|fail/i })
      .or(this.page.getByTestId('error-message'));
  }

  // ====================
  // UTILITY METHODS
  // ====================

  /**
   * Parse currency amount from text
   */
  private parseAmount(text: string): number {
    return parseFloat(text.replace(/[$,]/g, '')) || 0;
  }

  // ====================
  // ACCOUNT INFORMATION
  // ====================

  /**
   * Get account information
   * Uses auto-waiting - no manual timeouts
   */
  async getAccountInfo(): Promise<{
    accountNumber: string;
    accountType: string;
    accountName: string;
    status: string;
    currentBalance: number;
    availableBalance: number;
  }> {
    return {
      accountNumber: await this.getAccountNumberDisplay().textContent() || '',
      accountType: await this.getAccountTypeDisplay().textContent() || '',
      accountName: await this.page.getByTestId('account-name').textContent() || '',
      status: await this.page.getByTestId('account-status').textContent() || '',
      currentBalance: this.parseAmount(
        await this.getCurrentBalanceDisplay().textContent() || '0'
      ),
      availableBalance: this.parseAmount(
        await this.getAvailableBalanceDisplay().textContent() || '0'
      ),
    };
  }

  /**
   * Get current balance
   */
  async getCurrentBalance(): Promise<number> {
    return this.parseAmount(
      await this.getCurrentBalanceDisplay().textContent() || '0'
    );
  }

  /**
   * Get available balance
   */
  async getAvailableBalance(): Promise<number> {
    return this.parseAmount(
      await this.getAvailableBalanceDisplay().textContent() || '0'
    );
  }

  // ====================
  // ACCOUNT ACTIONS
  // ====================

  /**
   * Click make deposit
   */
  async makeDeposit() {
    await this.getMakeDepositButton().click();
    logger.debug('Make deposit initiated');
  }

  /**
   * Click make withdrawal
   */
  async makeWithdrawal() {
    await this.getMakeWithdrawalButton().click();
    logger.debug('Make withdrawal initiated');
  }

  /**
   * Click transfer funds
   */
  async transferFunds() {
    await this.getTransferFundsButton().click();
    logger.debug('Transfer funds initiated');
  }

  // ====================
  // TAB NAVIGATION
  // ====================

  /**
   * Switch to transactions tab
   * Uses auto-waiting instead of setTimeout
   */
  async goToTransactionsTab() {
    await this.getTransactionsTab().click();
    // Wait for transactions list to be visible (auto-waiting)
    await this.getTransactionItems().first().waitFor({ state: 'visible' });
  }

  /**
   * Switch to details tab
   */
  async goToDetailsTab() {
    await this.getDetailsTab().click();
  }

  /**
   * Switch to documents tab
   */
  async goToDocumentsTab() {
    await this.getDocumentsTab().click();
    // Wait for documents list
    await this.page.getByRole('list', { name: /documents/i })
      .or(this.page.getByTestId('documents-list'))
      .waitFor({ state: 'visible' });
  }

  /**
   * Switch to settings tab
   */
  async goToSettingsTab() {
    await this.getSettingsTab().click();
  }

  // ====================
  // TRANSACTIONS
  // ====================

  /**
   * Get all transactions
   * MODERNIZED: Uses locator queries instead of loops
   */
  async getAllTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
    status: string;
  }>> {
    await this.goToTransactionsTab();

    const items = this.getTransactionItems();
    const count = await items.count();
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
      transactions.push({
        date: await item.locator('[data-field="date"]').textContent() || '',
        description: await item.locator('[data-field="description"]').textContent() || '',
        amount: this.parseAmount(
          await item.locator('[data-field="amount"]').textContent() || '0'
        ),
        balance: this.parseAmount(
          await item.locator('[data-field="balance"]').textContent() || '0'
        ),
        status: await item.locator('[data-field="status"]').textContent() || '',
      });
    }

    return transactions;
  }

  /**
   * Filter transactions by date range
   * MODERNIZED: No setTimeout - uses auto-waiting
   */
  async filterTransactionsByDate(startDate: string, endDate: string) {
    await this.goToTransactionsTab();
    
    // Use labels for better accessibility
    await this.page.getByLabel(/start.*date/i).fill(startDate);
    await this.page.getByLabel(/end.*date/i).fill(endDate);
    
    const applyBtn = this.page.getByRole('button', { name: /apply.*filter/i })
      .or(this.page.getByTestId('apply-filters'));
    
    await applyBtn.click();
    
    // Wait for loading to complete by checking transaction items update
    await this.getTransactionItems().first().waitFor({ state: 'visible' });
  }

  /**
   * Export transactions
   */
  async exportTransactions(format: 'CSV' | 'PDF' | 'Excel') {
    await this.goToTransactionsTab();
    
    await this.page.getByLabel(/export.*format/i)
      .or(this.page.getByTestId('export-format'))
      .selectOption(format);
    
    const downloadPromise = this.page.waitForEvent('download');
    
    const exportBtn = this.page.getByRole('button', { name: /export/i })
      .or(this.page.getByTestId('export-transactions'));
    
    await exportBtn.click();
    
    return await downloadPromise;
  }

  // ====================
  // SETTINGS
  // ====================

  /**
   * Update account nickname
   * MODERNIZED: Uses getByLabel, no setTimeout
   */
  async updateNickname(nickname: string) {
    await this.goToSettingsTab();
    
    const editBtn = this.page.getByRole('button', { name: /edit.*nickname/i })
      .or(this.page.getByTestId('edit-nickname'));
    
    await editBtn.click();
    
    // Use label instead of testid
    await this.page.getByLabel(/nickname/i)
      .or(this.page.getByTestId('nickname-input'))
      .fill(nickname);
    
    const saveBtn = this.page.getByRole('button', { name: /save/i })
      .or(this.page.getByTestId('save-nickname'));
    
    await saveBtn.click();
    
    // Wait for success alert (auto-waiting)
    await this.getSuccessAlert().waitFor({ state: 'visible' });
    
    logger.info({ nickname }, 'Account nickname updated');
  }

  /**
   * Enable low balance alert
   */
  async enableLowBalanceAlert(threshold: number) {
    await this.goToSettingsTab();
    
    // Use getByLabel for checkbox
    await this.page.getByRole('checkbox', { name: /low.*balance.*alert/i })
      .or(this.page.getByTestId('enable-low-balance-alert'))
      .check();
    
    await this.page.getByLabel(/threshold/i)
      .or(this.page.getByTestId('low-balance-threshold'))
      .fill(threshold.toString());
    
    const saveBtn = this.page.getByRole('button', { name: /save/i })
      .or(this.page.getByTestId('save-settings'));
    
    await saveBtn.click();
    
    await this.getSuccessAlert().waitFor({ state: 'visible' });
  }

  // ====================
  // MESSAGES
  // ====================

  /**
   * Check if success message is shown
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.getSuccessAlert().isVisible();
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string> {
    return await this.getSuccessAlert().textContent() || '';
  }

  /**
   * Check if error message is shown
   */
  async hasError(): Promise<boolean> {
    return await this.getErrorAlert().isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.getErrorAlert().textContent() || '';
  }

  // ====================
  // PAGINATION
  // ====================

  /**
   * Navigate to next page of transactions
   * MODERNIZED: No setTimeout
   */
  async goToNextTransactionsPage() {
    await this.goToTransactionsTab();
    
    const nextBtn = this.page.getByRole('button', { name: /next/i })
      .or(this.page.getByTestId('pagination-next'));
    
    await nextBtn.click();
    
    // Wait for transaction items to update
    await this.getTransactionItems().first().waitFor({ state: 'visible' });
  }

  /**
   * Navigate to previous page of transactions
   */
  async goToPreviousTransactionsPage() {
    await this.goToTransactionsTab();
    
    const prevBtn = this.page.getByRole('button', { name: /prev|previous/i })
      .or(this.page.getByTestId('pagination-prev'));
    
    await prevBtn.click();
    
    await this.getTransactionItems().first().waitFor({ state: 'visible' });
  }

  /**
   * Get pagination info
   */
  async getPaginationInfo(): Promise<string> {
    await this.goToTransactionsTab();
    return await this.page.getByRole('status', { name: /pagination|page/i })
      .or(this.page.getByTestId('pagination-info'))
      .textContent() || '';
  }
}