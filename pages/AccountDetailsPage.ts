import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class AccountDetailsPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="account-details-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Account information
    accountNumber: '[data-testid="account-number"]',
    accountType: '[data-testid="account-type"]',
    accountName: '[data-testid="account-name"]',
    accountStatus: '[data-testid="account-status"]',
    currentBalance: '[data-testid="current-balance"]',
    availableBalance: '[data-testid="available-balance"]',
    pendingBalance: '[data-testid="pending-balance"]',
    openDate: '[data-testid="open-date"]',
    lastActivity: '[data-testid="last-activity"]',
    interestRate: '[data-testid="interest-rate"]',
    
    // Account actions
    makeDepositButton: '[data-testid="make-deposit"]',
    makeWithdrawalButton: '[data-testid="make-withdrawal"]',
    transferButton: '[data-testid="transfer-funds"]',
    viewStatementsButton: '[data-testid="view-statements"]',
    orderChecksButton: '[data-testid="order-checks"]',
    closeAccountButton: '[data-testid="close-account"]',
    
    // Tabs
    transactionsTab: '[data-testid="tab-transactions"]',
    detailsTab: '[data-testid="tab-details"]',
    documentsTab: '[data-testid="tab-documents"]',
    settingsTab: '[data-testid="tab-settings"]',
    
    // Transactions section
    transactionsList: '[data-testid="transactions-list"]',
    transactionItem: '[data-testid="transaction-item"]',
    transactionDate: '[data-field="date"]',
    transactionDescription: '[data-field="description"]',
    transactionAmount: '[data-field="amount"]',
    transactionBalance: '[data-field="balance"]',
    transactionStatus: '[data-field="status"]',
    
    // Transaction filters
    filterStartDate: '[data-testid="filter-start-date"]',
    filterEndDate: '[data-testid="filter-end-date"]',
    filterType: '[data-testid="filter-type"]',
    filterMinAmount: '[data-testid="filter-min-amount"]',
    filterMaxAmount: '[data-testid="filter-max-amount"]',
    applyFiltersButton: '[data-testid="apply-filters"]',
    clearFiltersButton: '[data-testid="clear-filters"]',
    
    // Export options
    exportButton: '[data-testid="export-transactions"]',
    exportFormatSelect: '[data-testid="export-format"]',
    
    // Details section
    routingNumber: '[data-testid="routing-number"]',
    accountOwner: '[data-testid="account-owner"]',
    overdraftProtection: '[data-testid="overdraft-protection"]',
    minimumBalance: '[data-testid="minimum-balance"]',
    monthlyFee: '[data-testid="monthly-fee"]',
    
    // Documents section
    documentsList: '[data-testid="documents-list"]',
    documentItem: '[data-testid="document-item"]',
    downloadDocumentButton: '[data-testid="download-document"]',
    
    // Settings section
    accountNickname: '[data-testid="account-nickname"]',
    editNicknameButton: '[data-testid="edit-nickname"]',
    nicknameInput: '[data-testid="nickname-input"]',
    saveNicknameButton: '[data-testid="save-nickname"]',
    cancelNicknameButton: '[data-testid="cancel-nickname"]',
    
    alertPreferences: '[data-testid="alert-preferences"]',
    enableLowBalanceAlert: '[data-testid="enable-low-balance-alert"]',
    lowBalanceThreshold: '[data-testid="low-balance-threshold"]',
    enableLargeTransactionAlert: '[data-testid="enable-large-transaction-alert"]',
    largeTransactionAmount: '[data-testid="large-transaction-amount"]',
    saveSettingsButton: '[data-testid="save-settings"]',
    
    // Messages
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    
    // Modals
    closeAccountModal: '[data-testid="close-account-modal"]',
    closeAccountReason: '[data-testid="close-reason"]',
    confirmCloseButton: '[data-testid="confirm-close"]',
    cancelCloseButton: '[data-testid="cancel-close"]',
    
    // Pagination
    paginationNext: '[data-testid="pagination-next"]',
    paginationPrev: '[data-testid="pagination-prev"]',
    paginationInfo: '[data-testid="pagination-info"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to account details page
   */
  async navigate(accountNumber: string) {
    await this.page.goto(`${Config.BANNO_BASE_URL}/accounts/${accountNumber}`);
    await this.waitForPageLoad();
    await this.waitForDetailsToLoad();
    logger.debug({ accountNumber }, 'Navigated to account details');
  }

  /**
   * Wait for account details to load
   */
  async waitForDetailsToLoad() {
    await Wait.forCondition(
      async () => !(await this.helper.isVisible(this.selectors.loadingSpinner, 1000)),
      10000
    );
    await this.helper.waitFor(this.selectors.accountNumber);
  }

  /**
   * Get account information
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
      accountNumber: await this.helper.getText(this.selectors.accountNumber),
      accountType: await this.helper.getText(this.selectors.accountType),
      accountName: await this.helper.getText(this.selectors.accountName),
      status: await this.helper.getText(this.selectors.accountStatus),
      currentBalance: this.parseAmount(
        await this.helper.getText(this.selectors.currentBalance)
      ),
      availableBalance: this.parseAmount(
        await this.helper.getText(this.selectors.availableBalance)
      ),
    };
  }

  /**
   * Parse currency amount from text
   */
  private parseAmount(text: string): number {
    return parseFloat(text.replace(/[$,]/g, '')) || 0;
  }

  /**
   * Get current balance
   */
  async getCurrentBalance(): Promise<number> {
    return this.parseAmount(await this.helper.getText(this.selectors.currentBalance));
  }

  /**
   * Get available balance
   */
  async getAvailableBalance(): Promise<number> {
    return this.parseAmount(await this.helper.getText(this.selectors.availableBalance));
  }

  /**
   * Get pending balance
   */
  async getPendingBalance(): Promise<number> {
    return this.parseAmount(await this.helper.getText(this.selectors.pendingBalance));
  }

  /**
   * Get interest rate
   */
  async getInterestRate(): Promise<string> {
    return await this.helper.getText(this.selectors.interestRate);
  }

  /**
   * Click make deposit
   */
  async makeDeposit() {
    await this.helper.click(this.selectors.makeDepositButton);
    logger.debug('Make deposit initiated');
  }

  /**
   * Click make withdrawal
   */
  async makeWithdrawal() {
    await this.helper.click(this.selectors.makeWithdrawalButton);
    logger.debug('Make withdrawal initiated');
  }

  /**
   * Click transfer funds
   */
  async transferFunds() {
    await this.helper.click(this.selectors.transferButton);
    logger.debug('Transfer funds initiated');
  }

  /**
   * Click view statements
   */
  async viewStatements() {
    await this.helper.click(this.selectors.viewStatementsButton);
  }

  /**
   * Click order checks
   */
  async orderChecks() {
    await this.helper.click(this.selectors.orderChecksButton);
  }

  /**
   * Switch to transactions tab
   */
  async goToTransactionsTab() {
    await this.helper.click(this.selectors.transactionsTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.transactionsList),
      5000
    );
  }

  /**
   * Switch to details tab
   */
  async goToDetailsTab() {
    await this.helper.click(this.selectors.detailsTab);
  }

  /**
   * Switch to documents tab
   */
  async goToDocumentsTab() {
    await this.helper.click(this.selectors.documentsTab);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.documentsList),
      5000
    );
  }

  /**
   * Switch to settings tab
   */
  async goToSettingsTab() {
    await this.helper.click(this.selectors.settingsTab);
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
    status: string;
  }>> {
    await this.goToTransactionsTab();

    const count = await this.helper.count(this.selectors.transactionItem);
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.transactionItem).nth(i);
      transactions.push({
        date: await item.locator(this.selectors.transactionDate).textContent() || '',
        description: await item.locator(this.selectors.transactionDescription).textContent() || '',
        amount: this.parseAmount(
          await item.locator(this.selectors.transactionAmount).textContent() || '0'
        ),
        balance: this.parseAmount(
          await item.locator(this.selectors.transactionBalance).textContent() || '0'
        ),
        status: await item.locator(this.selectors.transactionStatus).textContent() || '',
      });
    }

    return transactions;
  }

  /**
   * Filter transactions by date range
   */
  async filterTransactionsByDate(startDate: string, endDate: string) {
    await this.goToTransactionsTab();
    await this.helper.fill(this.selectors.filterStartDate, startDate);
    await this.helper.fill(this.selectors.filterEndDate, endDate);
    await this.helper.click(this.selectors.applyFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter transactions by type
   */
  async filterTransactionsByType(type: string) {
    await this.goToTransactionsTab();
    await this.helper.select(this.selectors.filterType, type);
    await this.helper.click(this.selectors.applyFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter transactions by amount range
   */
  async filterTransactionsByAmount(minAmount: number, maxAmount: number) {
    await this.goToTransactionsTab();
    await this.helper.fill(this.selectors.filterMinAmount, minAmount.toString());
    await this.helper.fill(this.selectors.filterMaxAmount, maxAmount.toString());
    await this.helper.click(this.selectors.applyFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear transaction filters
   */
  async clearFilters() {
    await this.helper.click(this.selectors.clearFiltersButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Export transactions
   */
  async exportTransactions(format: 'CSV' | 'PDF' | 'Excel') {
    await this.goToTransactionsTab();
    await this.helper.select(this.selectors.exportFormatSelect, format);
    
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.exportButton);
    
    return await downloadPromise;
  }

  /**
   * Get routing number
   */
  async getRoutingNumber(): Promise<string> {
    await this.goToDetailsTab();
    return await this.helper.getText(this.selectors.routingNumber);
  }

  /**
   * Get account owner
   */
  async getAccountOwner(): Promise<string> {
    await this.goToDetailsTab();
    return await this.helper.getText(this.selectors.accountOwner);
  }

  /**
   * Check if overdraft protection is enabled
   */
  async hasOverdraftProtection(): Promise<boolean> {
    await this.goToDetailsTab();
    const text = await this.helper.getText(this.selectors.overdraftProtection);
    return text.toLowerCase().includes('enabled') || text.toLowerCase().includes('yes');
  }

  /**
   * Get documents
   */
  async getDocuments(): Promise<Array<{ name: string; date: string }>> {
    await this.goToDocumentsTab();

    const count = await this.helper.count(this.selectors.documentItem);
    const documents = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.documentItem).nth(i);
      documents.push({
        name: await item.locator('[data-field="name"]').textContent() || '',
        date: await item.locator('[data-field="date"]').textContent() || '',
      });
    }

    return documents;
  }

  /**
   * Download document by index
   */
  async downloadDocument(index: number) {
    await this.goToDocumentsTab();
    const downloadPromise = this.page.waitForEvent('download');
    
    await this.page.locator(this.selectors.documentItem).nth(index)
      .locator(this.selectors.downloadDocumentButton).click();
    
    return await downloadPromise;
  }

  /**
   * Update account nickname
   */
  async updateNickname(nickname: string) {
    await this.goToSettingsTab();
    await this.helper.click(this.selectors.editNicknameButton);
    await this.helper.fill(this.selectors.nicknameInput, nickname);
    await this.helper.click(this.selectors.saveNicknameButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );
    
    logger.info({ nickname }, 'Account nickname updated');
  }

  /**
   * Enable low balance alert
   */
  async enableLowBalanceAlert(threshold: number) {
    await this.goToSettingsTab();
    await this.helper.check(this.selectors.enableLowBalanceAlert);
    await this.helper.fill(this.selectors.lowBalanceThreshold, threshold.toString());
    await this.helper.click(this.selectors.saveSettingsButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );
  }

  /**
   * Enable large transaction alert
   */
  async enableLargeTransactionAlert(amount: number) {
    await this.goToSettingsTab();
    await this.helper.check(this.selectors.enableLargeTransactionAlert);
    await this.helper.fill(this.selectors.largeTransactionAmount, amount.toString());
    await this.helper.click(this.selectors.saveSettingsButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );
  }

  /**
   * Close account
   */
  async closeAccount(reason: string) {
    await this.helper.click(this.selectors.closeAccountButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.closeAccountModal),
      5000
    );

    await this.helper.fill(this.selectors.closeAccountReason, reason);
    await this.helper.click(this.selectors.confirmCloseButton);
    
    logger.warn({ reason }, 'Account close requested');
  }

  /**
   * Cancel account closure
   */
  async cancelAccountClosure() {
    await this.helper.click(this.selectors.cancelCloseButton);
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
   * Navigate to next page of transactions
   */
  async goToNextTransactionsPage() {
    await this.goToTransactionsTab();
    await this.helper.click(this.selectors.paginationNext);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate to previous page of transactions
   */
  async goToPreviousTransactionsPage() {
    await this.goToTransactionsTab();
    await this.helper.click(this.selectors.paginationPrev);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get pagination info
   */
  async getPaginationInfo(): Promise<string> {
    await this.goToTransactionsTab();
    return await this.helper.getText(this.selectors.paginationInfo);
  }
}