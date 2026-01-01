import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * StatementsPage - FULLY MODERNIZED 2025
 * 
 * CHANGES:
 * ✅ Removed 40+ string selectors
 * ✅ Added locator getter methods
 * ✅ Uses getByRole/getByLabel first
 * ✅ Removed all page.waitForTimeout() calls
 * ✅ Kept good download handling patterns
 * ✅ Auto-waiting patterns throughout
 */
export class StatementsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ====================
  // NAVIGATION
  // ====================

  /**
   * Navigate to statements page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/statements');
    await this.waitForPageLoad();
    logger.debug('Navigated to statements page');
  }

  // ====================
  // LOCATOR GETTERS
  // ====================

  /**
   * Get page title
   */
  getPageTitle(): Locator {
    return this.page.getByRole('heading', { name: /statements/i, level: 1 })
      .or(this.page.getByTestId('statements-page-title'));
  }

  /**
   * Get loading spinner
   */
  getLoadingSpinner(): Locator {
    return this.page.getByRole('status', { name: /loading/i })
      .or(this.page.getByTestId('loading'));
  }

  // ACCOUNT SELECTION

  /**
   * Get account select dropdown
   */
  getAccountSelect(): Locator {
    return this.page.getByLabel(/account|select.*account/i)
      .or(this.page.getByRole('combobox', { name: /account/i }))
      .or(this.page.getByTestId('account-select'));
  }

  // DATE RANGE FILTERS

  /**
   * Get start date input
   */
  getStartDateInput(): Locator {
    return this.page.getByLabel(/start.*date|from.*date/i)
      .or(this.page.getByTestId('start-date'));
  }

  /**
   * Get end date input
   */
  getEndDateInput(): Locator {
    return this.page.getByLabel(/end.*date|to.*date/i)
      .or(this.page.getByTestId('end-date'));
  }

  /**
   * Get date range preset dropdown
   */
  getDateRangePreset(): Locator {
    return this.page.getByLabel(/date.*range|preset/i)
      .or(this.page.getByTestId('date-range-preset'));
  }

  /**
   * Get search button
   */
  getSearchButton(): Locator {
    return this.page.getByRole('button', { name: /search|apply/i })
      .or(this.page.getByTestId('search-statements'));
  }

  // STATEMENT LIST

  /**
   * Get statements list container
   */
  getStatementsList(): Locator {
    return this.page.getByRole('list', { name: /statements/i })
      .or(this.page.getByTestId('statements-list'));
  }

  /**
   * Get statement items
   */
  getStatementItems(): Locator {
    return this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/statement/i) })
      .or(this.page.getByTestId('statement-item'));
  }

  /**
   * Get no statements message
   */
  getNoStatementsMessage(): Locator {
    return this.page.getByText(/no.*statements/i)
      .or(this.page.getByTestId('no-statements'));
  }

  // BUTTONS

  /**
   * Get generate statement button
   */
  getGenerateButton(): Locator {
    return this.page.getByRole('button', { name: /generate/i })
      .or(this.page.getByTestId('generate-statement'));
  }

  /**
   * Get download button (for specific statement)
   */
  getDownloadButton(index: number = 0): Locator {
    return this.getStatementItems()
      .nth(index)
      .getByRole('button', { name: /download/i })
      .or(this.getStatementItems().nth(index).getByTestId('download-statement'));
  }

  /**
   * Get view button
   */
  getViewButton(index: number = 0): Locator {
    return this.getStatementItems()
      .nth(index)
      .getByRole('button', { name: /view/i })
      .or(this.getStatementItems().nth(index).getByTestId('view-statement'));
  }

  /**
   * Get email button
   */
  getEmailButton(index: number = 0): Locator {
    return this.getStatementItems()
      .nth(index)
      .getByRole('button', { name: /email/i })
      .or(this.getStatementItems().nth(index).getByTestId('email-statement'));
  }

  // BULK ACTIONS

  /**
   * Get select all checkbox
   */
  getSelectAllCheckbox(): Locator {
    return this.page.getByRole('checkbox', { name: /select.*all/i })
      .or(this.page.getByTestId('select-all'));
  }

  /**
   * Get statement checkbox
   */
  getStatementCheckbox(index: number): Locator {
    return this.getStatementItems()
      .nth(index)
      .getByRole('checkbox')
      .or(this.getStatementItems().nth(index).getByTestId('statement-checkbox'));
  }

  /**
   * Get bulk download button
   */
  getBulkDownloadButton(): Locator {
    return this.page.getByRole('button', { name: /bulk.*download/i })
      .or(this.page.getByTestId('bulk-download'));
  }

  // MODALS

  /**
   * Get statement viewer modal
   */
  getViewerModal(): Locator {
    return this.page.getByRole('dialog', { name: /statement.*viewer/i })
      .or(this.page.getByTestId('statement-viewer'));
  }

  /**
   * Get viewer close button
   */
  getViewerCloseButton(): Locator {
    return this.getViewerModal()
      .getByRole('button', { name: /close/i })
      .or(this.page.getByTestId('viewer-close'));
  }

  /**
   * Get email modal
   */
  getEmailModal(): Locator {
    return this.page.getByRole('dialog', { name: /email/i })
      .or(this.page.getByTestId('email-modal'));
  }

  /**
   * Get email address input
   */
  getEmailAddressInput(): Locator {
    return this.getEmailModal()
      .getByLabel(/email.*address/i)
      .or(this.page.getByTestId('email-address'));
  }

  /**
   * Get send email button
   */
  getSendEmailButton(): Locator {
    return this.getEmailModal()
      .getByRole('button', { name: /send/i })
      .or(this.page.getByTestId('send-email'));
  }

  /**
   * Get generate modal
   */
  getGenerateModal(): Locator {
    return this.page.getByRole('dialog', { name: /generate/i })
      .or(this.page.getByTestId('generate-modal'));
  }

  /**
   * Get generate period select
   */
  getGeneratePeriodSelect(): Locator {
    return this.getGenerateModal()
      .getByLabel(/period/i)
      .or(this.page.getByTestId('generate-period'));
  }

  /**
   * Get generate format select
   */
  getGenerateFormatSelect(): Locator {
    return this.getGenerateModal()
      .getByLabel(/format/i)
      .or(this.page.getByTestId('generate-format'));
  }

  /**
   * Get confirm generate button
   */
  getConfirmGenerateButton(): Locator {
    return this.getGenerateModal()
      .getByRole('button', { name: /confirm|generate/i })
      .or(this.page.getByTestId('confirm-generate'));
  }

  // MESSAGES

  /**
   * Get success message
   */
  getSuccessMessage(): Locator {
    return this.page.getByRole('alert')
      .filter({ hasText: /success|complete|sent/i })
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

  // PAGINATION

  /**
   * Get next page button
   */
  getNextPageButton(): Locator {
    return this.page.getByRole('button', { name: /next/i })
      .or(this.page.getByTestId('pagination-next'));
  }

  /**
   * Get previous page button
   */
  getPreviousPageButton(): Locator {
    return this.page.getByRole('button', { name: /prev|previous/i })
      .or(this.page.getByTestId('pagination-prev'));
  }

  /**
   * Get pagination info
   */
  getPaginationInfo(): Locator {
    return this.page.getByRole('status', { name: /page|showing/i })
      .or(this.page.getByTestId('pagination-info'));
  }

  // TAX DOCUMENTS

  /**
   * Get tax documents tab
   */
  getTaxDocumentsTab(): Locator {
    return this.page.getByRole('tab', { name: /tax.*documents/i })
      .or(this.page.getByTestId('tax-documents-tab'));
  }

  /**
   * Get tax document items
   */
  getTaxDocumentItems(): Locator {
    return this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/tax|1099|1098/i) })
      .or(this.page.getByTestId('tax-document-item'));
  }

  // ====================
  // ACTIONS
  // ====================

  /**
   * Select account
   */
  async selectAccount(accountNumber: string) {
    await this.getAccountSelect().selectOption(accountNumber);
    // Wait for statements to load
    await this.waitForStatementsToLoad();
    logger.debug({ accountNumber }, 'Account selected');
  }

  /**
   * Select date range preset
   */
  async selectDateRangePreset(preset: 'current-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'ytd' | 'custom') {
    await this.getDateRangePreset().selectOption(preset);
    await this.waitForStatementsToLoad();
    logger.debug({ preset }, 'Date range preset selected');
  }

  /**
   * Set custom date range
   */
  async setCustomDateRange(startDate: string, endDate: string) {
    await this.selectDateRangePreset('custom');
    await this.getStartDateInput().fill(startDate);
    await this.getEndDateInput().fill(endDate);
    await this.getSearchButton().click();
    await this.waitForStatementsToLoad();
  }

  /**
   * Wait for statements to load
   */
  private async waitForStatementsToLoad() {
    // Wait for loading to complete
    await this.getLoadingSpinner().waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Get statements count
   */
  async getStatementsCount(): Promise<number> {
    const hasStatements = await this.getStatementsList().isVisible();
    if (!hasStatements) return 0;
    return await this.getStatementItems().count();
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
      const item = this.getStatementItems().nth(i);
      statements.push({
        date: await item.locator('[data-field="statement-date"]').textContent() || '',
        period: await item.locator('[data-field="statement-period"]').textContent() || '',
        status: await item.locator('[data-field="statement-status"]').textContent() || '',
      });
    }

    return statements;
  }

  /**
   * Generate statement
   */
  async generateStatement(period: string, format: 'PDF' | 'CSV' = 'PDF') {
    await this.getGenerateButton().click();
    await this.getGenerateModal().waitFor({ state: 'visible' });

    await this.getGeneratePeriodSelect().selectOption(period);
    await this.getGenerateFormatSelect().selectOption(format);
    
    const downloadPromise = this.page.waitForEvent('download');
    await this.getConfirmGenerateButton().click();
    
    logger.info({ period, format }, 'Statement generation initiated');
    return await downloadPromise;
  }

  /**
   * Download statement by index
   */
  async downloadStatement(index: number = 0) {
    const downloadPromise = this.page.waitForEvent('download');
    await this.getDownloadButton(index).click();
    
    logger.debug({ index }, 'Statement download initiated');
    return await downloadPromise;
  }

  /**
   * View statement by index
   */
  async viewStatement(index: number = 0) {
    await this.getViewButton(index).click();
    await this.getViewerModal().waitFor({ state: 'visible' });
    
    logger.debug({ index }, 'Statement viewer opened');
  }

  /**
   * Close statement viewer
   */
  async closeViewer() {
    await this.getViewerCloseButton().click();
    await this.getViewerModal().waitFor({ state: 'hidden' });
  }

  /**
   * Email statement
   */
  async emailStatement(index: number, emailAddress: string, subject?: string, message?: string) {
    await this.getEmailButton(index).click();
    await this.getEmailModal().waitFor({ state: 'visible' });

    await this.getEmailAddressInput().fill(emailAddress);
    
    if (subject) {
      const subjectInput = this.getEmailModal().getByLabel(/subject/i);
      await subjectInput.fill(subject);
    }
    
    if (message) {
      const messageInput = this.getEmailModal().getByLabel(/message/i);
      await messageInput.fill(message);
    }

    await this.getSendEmailButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });
    
    logger.info({ emailAddress, index }, 'Statement emailed');
  }

  /**
   * Select all statements
   */
  async selectAllStatements() {
    await this.getSelectAllCheckbox().check();
    logger.debug('All statements selected');
  }

  /**
   * Select statement by index
   */
  async selectStatement(index: number) {
    await this.getStatementCheckbox(index).check();
  }

  /**
   * Bulk download selected statements
   */
  async bulkDownload() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.getBulkDownloadButton().click();
    logger.info('Bulk download initiated');
    return await downloadPromise;
  }

  /**
   * Bulk email selected statements
   */
  async bulkEmail(emailAddress: string) {
    const bulkEmailBtn = this.page.getByRole('button', { name: /bulk.*email/i })
      .or(this.page.getByTestId('bulk-email'));
    
    await bulkEmailBtn.click();
    await this.getEmailModal().waitFor({ state: 'visible' });

    await this.getEmailAddressInput().fill(emailAddress);
    await this.getSendEmailButton().click();
    await this.getSuccessMessage().waitFor({ state: 'visible' });
    
    logger.info({ emailAddress }, 'Bulk email sent');
  }

  // ====================
  // MESSAGE QUERIES
  // ====================

  /**
   * Check if success message is shown
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.getSuccessMessage().isVisible();
  }

  /**
   * Get success message
   */
  async getSuccessMessageText(): Promise<string> {
    return await this.getSuccessMessage().textContent() || '';
  }

  /**
   * Check if error message is shown
   */
  async hasError(): Promise<boolean> {
    return await this.getErrorMessage().isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessageText(): Promise<string> {
    return await this.getErrorMessage().textContent() || '';
  }

  /**
   * Check if no statements message is shown
   */
  async hasNoStatements(): Promise<boolean> {
    return await this.getNoStatementsMessage().isVisible();
  }

  // ====================
  // TAX DOCUMENTS
  // ====================

  /**
   * Go to tax documents tab
   */
  async goToTaxDocuments() {
    await this.getTaxDocumentsTab().click();
    logger.debug('Navigated to tax documents tab');
  }

  /**
   * Get tax documents count
   */
  async getTaxDocumentsCount(): Promise<number> {
    await this.goToTaxDocuments();
    return await this.getTaxDocumentItems().count();
  }

  /**
   * Download tax document
   */
  async downloadTaxDocument(index: number = 0) {
    await this.goToTaxDocuments();
    
    const downloadPromise = this.page.waitForEvent('download');
    
    await this.getTaxDocumentItems()
      .nth(index)
      .getByRole('button', { name: /download/i })
      .or(this.getTaxDocumentItems().nth(index).getByTestId('download-button'))
      .click();
    
    logger.debug({ index }, 'Tax document download initiated');
    return await downloadPromise;
  }

  // ====================
  // PAGINATION
  // ====================

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.getNextPageButton().click();
    await this.waitForStatementsToLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.getPreviousPageButton().click();
    await this.waitForStatementsToLoad();
  }

  /**
   * Get pagination info
   */
  async getPaginationInfoText(): Promise<string> {
    return await this.getPaginationInfo().textContent() || '';
  }
}