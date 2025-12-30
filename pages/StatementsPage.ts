import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class StatementsPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="statements-page-title"]',
    loadingSpinner: '[data-testid="loading"]',
    
    // Account selection
    accountSelect: '[data-testid="account-select"]',
    accountName: '[data-testid="account-name"]',
    accountType: '[data-testid="account-type"]',
    
    // Date range filters
    startDateInput: '[data-testid="start-date"]',
    endDateInput: '[data-testid="end-date"]',
    dateRangePreset: '[data-testid="date-range-preset"]',
    currentMonthOption: '[data-testid="preset-current-month"]',
    lastMonthOption: '[data-testid="preset-last-month"]',
    last3MonthsOption: '[data-testid="preset-last-3-months"]',
    last6MonthsOption: '[data-testid="preset-last-6-months"]',
    yearToDateOption: '[data-testid="preset-ytd"]',
    customRangeOption: '[data-testid="preset-custom"]',
    
    // Statement list
    statementsList: '[data-testid="statements-list"]',
    statementItem: '[data-testid="statement-item"]',
    statementDate: '[data-field="statement-date"]',
    statementPeriod: '[data-field="statement-period"]',
    statementStatus: '[data-field="statement-status"]',
    
    // Buttons
    generateButton: '[data-testid="generate-statement"]',
    downloadButton: '[data-testid="download-statement"]',
    emailButton: '[data-testid="email-statement"]',
    printButton: '[data-testid="print-statement"]',
    viewButton: '[data-testid="view-statement"]',
    searchButton: '[data-testid="search-statements"]',
    
    // Bulk actions
    selectAllCheckbox: '[data-testid="select-all"]',
    statementCheckbox: '[data-testid="statement-checkbox"]',
    bulkDownloadButton: '[data-testid="bulk-download"]',
    bulkEmailButton: '[data-testid="bulk-email"]',
    
    // Statement viewer modal
    viewerModal: '[data-testid="statement-viewer"]',
    viewerIframe: '[data-testid="statement-iframe"]',
    viewerCloseButton: '[data-testid="viewer-close"]',
    viewerDownloadButton: '[data-testid="viewer-download"]',
    viewerPrintButton: '[data-testid="viewer-print"]',
    
    // Email modal
    emailModal: '[data-testid="email-modal"]',
    emailAddressInput: '[data-testid="email-address"]',
    emailSubjectInput: '[data-testid="email-subject"]',
    emailMessageInput: '[data-testid="email-message"]',
    sendEmailButton: '[data-testid="send-email"]',
    cancelEmailButton: '[data-testid="cancel-email"]',
    
    // Generate statement modal
    generateModal: '[data-testid="generate-modal"]',
    generatePeriodSelect: '[data-testid="generate-period"]',
    generateFormatSelect: '[data-testid="generate-format"]',
    generateIncludeImages: '[data-testid="include-images"]',
    confirmGenerateButton: '[data-testid="confirm-generate"]',
    cancelGenerateButton: '[data-testid="cancel-generate"]',
    
    // Messages
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    noStatementsMessage: '[data-testid="no-statements"]',
    generatingMessage: '[data-testid="generating-message"]',
    
    // Pagination
    paginationNext: '[data-testid="pagination-next"]',
    paginationPrev: '[data-testid="pagination-prev"]',
    paginationInfo: '[data-testid="pagination-info"]',
    
    // Tax documents section
    taxDocumentsTab: '[data-testid="tax-documents-tab"]',
    taxDocumentsList: '[data-testid="tax-documents-list"]',
    taxDocumentItem: '[data-testid="tax-document-item"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to statements page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/statements');
    await this.waitForPageLoad();
    logger.debug('Navigated to statements page');
  }

  /**
   * Select account
   */
  async selectAccount(accountNumber: string) {
    await this.helper.select(this.selectors.accountSelect, accountNumber);
    await this.page.waitForTimeout(1000); // Wait for statements to load
    logger.debug({ accountNumber }, 'Account selected');
  }

  /**
   * Select date range preset
   */
  async selectDateRangePreset(preset: 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'ytd' | 'custom') {
    await this.helper.click(this.selectors.dateRangePreset);
    
    const presetMap = {
      'current-month': this.selectors.currentMonthOption,
      'last-month': this.selectors.lastMonthOption,
      'last-3-months': this.selectors.last3MonthsOption,
      'last-6-months': this.selectors.last6MonthsOption,
      'ytd': this.selectors.yearToDateOption,
      'custom': this.selectors.customRangeOption,
    };
    
    await this.helper.click(presetMap[preset]);
    await this.page.waitForTimeout(500);
    logger.debug({ preset }, 'Date range preset selected');
  }

  /**
   * Set custom date range
   */
  async setCustomDateRange(startDate: string, endDate: string) {
    await this.selectDateRangePreset('custom');
    await this.helper.fill(this.selectors.startDateInput, startDate);
    await this.helper.fill(this.selectors.endDateInput, endDate);
    await this.helper.click(this.selectors.searchButton);
    await this.waitForStatementsToLoad();
  }

  /**
   * Wait for statements to load
   */
  private async waitForStatementsToLoad() {
    await Wait.forCondition(
      async () => !(await this.helper.isVisible(this.selectors.loadingSpinner, 1000)),
      10000
    );
  }

  /**
   * Get statements count
   */
  async getStatementsCount(): Promise<number> {
    const hasStatements = await this.helper.isVisible(this.selectors.statementsList);
    if (!hasStatements) return 0;
    return await this.helper.count(this.selectors.statementItem);
  }

  /**
   * Get all statements
   */
  async getAllStatements(): Promise<Array<{
    date: string;
    period: string;
    status: string;
  }>> {
    const count = await this.getStatementsCount();
    const statements = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.statementItem).nth(i);
      statements.push({
        date: await item.locator(this.selectors.statementDate).textContent() || '',
        period: await item.locator(this.selectors.statementPeriod).textContent() || '',
        status: await item.locator(this.selectors.statementStatus).textContent() || '',
      });
    }

    return statements;
  }

  /**
   * Generate statement
   */
  async generateStatement(period: string, format: 'PDF' | 'CSV' = 'PDF') {
    await this.helper.click(this.selectors.generateButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.generateModal),
      5000
    );

    await this.helper.select(this.selectors.generatePeriodSelect, period);
    await this.helper.select(this.selectors.generateFormatSelect, format);
    
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.confirmGenerateButton);
    
    logger.info({ period, format }, 'Statement generation initiated');
    return await downloadPromise;
  }

  /**
   * Download statement by index
   */
  async downloadStatement(index: number = 0) {
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator(this.selectors.statementItem).nth(index)
      .locator(this.selectors.downloadButton).click();
    
    logger.debug({ index }, 'Statement download initiated');
    return await downloadPromise;
  }

  /**
   * View statement by index
   */
  async viewStatement(index: number = 0) {
    await this.page.locator(this.selectors.statementItem).nth(index)
      .locator(this.selectors.viewButton).click();
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.viewerModal),
      5000
    );
    
    logger.debug({ index }, 'Statement viewer opened');
  }

  /**
   * Close statement viewer
   */
  async closeViewer() {
    await this.helper.click(this.selectors.viewerCloseButton);
  }

  /**
   * Download from viewer
   */
  async downloadFromViewer() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.viewerDownloadButton);
    return await downloadPromise;
  }

  /**
   * Print statement from viewer
   */
  async printFromViewer() {
    await this.helper.click(this.selectors.viewerPrintButton);
    // Handle print dialog in tests as needed
  }

  /**
   * Email statement
   */
  async emailStatement(index: number, emailAddress: string, subject?: string, message?: string) {
    await this.page.locator(this.selectors.statementItem).nth(index)
      .locator(this.selectors.emailButton).click();
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.emailModal),
      5000
    );

    await this.helper.fill(this.selectors.emailAddressInput, emailAddress);
    
    if (subject) {
      await this.helper.fill(this.selectors.emailSubjectInput, subject);
    }
    
    if (message) {
      await this.helper.fill(this.selectors.emailMessageInput, message);
    }

    await this.helper.click(this.selectors.sendEmailButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );
    
    logger.info({ emailAddress, index }, 'Statement emailed');
  }

  /**
   * Select all statements
   */
  async selectAllStatements() {
    await this.helper.check(this.selectors.selectAllCheckbox);
    logger.debug('All statements selected');
  }

  /**
   * Select statement by index
   */
  async selectStatement(index: number) {
    await this.page.locator(this.selectors.statementItem).nth(index)
      .locator(this.selectors.statementCheckbox).check();
  }

  /**
   * Bulk download selected statements
   */
  async bulkDownload() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.helper.click(this.selectors.bulkDownloadButton);
    logger.info('Bulk download initiated');
    return await downloadPromise;
  }

  /**
   * Bulk email selected statements
   */
  async bulkEmail(emailAddress: string) {
    await this.helper.click(this.selectors.bulkEmailButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.emailModal),
      5000
    );

    await this.helper.fill(this.selectors.emailAddressInput, emailAddress);
    await this.helper.click(this.selectors.sendEmailButton);
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.successMessage),
      5000
    );
    
    logger.info({ emailAddress }, 'Bulk email sent');
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
   * Check if no statements message is shown
   */
  async hasNoStatements(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.noStatementsMessage);
  }

  /**
   * Go to tax documents tab
   */
  async goToTaxDocuments() {
    await this.helper.click(this.selectors.taxDocumentsTab);
    await this.page.waitForTimeout(500);
    logger.debug('Navigated to tax documents tab');
  }

  /**
   * Get tax documents count
   */
  async getTaxDocumentsCount(): Promise<number> {
    await this.goToTaxDocuments();
    return await this.helper.count(this.selectors.taxDocumentItem);
  }

  /**
   * Download tax document
   */
  async downloadTaxDocument(index: number = 0) {
    await this.goToTaxDocuments();
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.locator(this.selectors.taxDocumentItem).nth(index)
      .locator(this.selectors.downloadButton).click();
    
    logger.debug({ index }, 'Tax document download initiated');
    return await downloadPromise;
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.helper.click(this.selectors.paginationNext);
    await this.waitForStatementsToLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.helper.click(this.selectors.paginationPrev);
    await this.waitForStatementsToLoad();
  }

  /**
   * Get pagination info
   */
  async getPaginationInfo(): Promise<string> {
    return await this.helper.getText(this.selectors.paginationInfo);
  }
}