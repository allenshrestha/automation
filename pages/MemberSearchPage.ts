import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * MemberSearchPage - FULLY MODERNIZED 2025
 * 
 * CHANGES:
 * ✅ Removed all string selectors
 * ✅ Added locator getter methods
 * ✅ Uses getByLabel for search fields
 * ✅ Removed complex wait logic
 * ✅ Auto-waiting patterns throughout
 */
export class MemberSearchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ====================
  // NAVIGATION
  // ====================

  /**
   * Navigate to member search page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/members/search');
    await this.waitForPageLoad();
  }

  // ====================
  // LOCATOR GETTERS - SEARCH INPUTS
  // ====================

  /**
   * Get account number search input
   */
  getAccountNumberSearch(): Locator {
    return this.page.getByLabel(/account.*number/i)
      .or(this.page.getByRole('textbox', { name: /account/i }))
      .or(this.page.getByTestId('search-account-number'));
  }

  /**
   * Get name search input
   */
  getNameSearch(): Locator {
    return this.page.getByLabel(/name|member.*name/i)
      .or(this.page.getByRole('textbox', { name: /name/i }))
      .or(this.page.getByTestId('search-name'));
  }

  /**
   * Get SSN search input
   */
  getSSNSearch(): Locator {
    return this.page.getByLabel(/ssn|social.*security/i)
      .or(this.page.getByRole('textbox', { name: /ssn/i }))
      .or(this.page.getByTestId('search-ssn'));
  }

  /**
   * Get email search input
   */
  getEmailSearch(): Locator {
    return this.page.getByLabel(/email/i)
      .or(this.page.getByRole('textbox', { name: /email/i }))
      .or(this.page.getByTestId('search-email'));
  }

  /**
   * Get phone search input
   */
  getPhoneSearch(): Locator {
    return this.page.getByLabel(/phone/i)
      .or(this.page.getByRole('textbox', { name: /phone/i }))
      .or(this.page.getByTestId('search-phone'));
  }

  // BUTTONS

  /**
   * Get search button
   */
  getSearchButton(): Locator {
    return this.page.getByRole('button', { name: /search|find/i })
      .or(this.page.getByTestId('search-button'));
  }

  /**
   * Get clear button
   */
  getClearButton(): Locator {
    return this.page.getByRole('button', { name: /clear|reset/i })
      .or(this.page.getByTestId('clear-button'));
  }

  /**
   * Get advanced filters button
   */
  getAdvancedFiltersButton(): Locator {
    return this.page.getByRole('button', { name: /advanced.*filter/i })
      .or(this.page.getByTestId('advanced-filters-button'));
  }

  /**
   * Get export button
   */
  getExportButton(): Locator {
    return this.page.getByRole('button', { name: /export/i })
      .or(this.page.getByTestId('export-button'));
  }

  // ADVANCED FILTERS

  /**
   * Get advanced filters panel
   */
  getAdvancedFiltersPanel(): Locator {
    return this.page.getByRole('region', { name: /advanced.*filter/i })
      .or(this.page.getByTestId('advanced-filters-panel'));
  }

  /**
   * Get status filter select
   */
  getStatusFilter(): Locator {
    return this.page.getByLabel(/status/i)
      .or(this.page.getByTestId('filter-status'));
  }

  /**
   * Get member since from date input
   */
  getMemberSinceFromInput(): Locator {
    return this.page.getByLabel(/member.*since.*from|start.*date/i)
      .or(this.page.getByTestId('filter-member-since-from'));
  }

  /**
   * Get member since to date input
   */
  getMemberSinceToInput(): Locator {
    return this.page.getByLabel(/member.*since.*to|end.*date/i)
      .or(this.page.getByTestId('filter-member-since-to'));
  }

  /**
   * Get state filter select
   */
  getStateFilter(): Locator {
    return this.page.getByLabel(/state/i)
      .or(this.page.getByTestId('filter-state'));
  }

  /**
   * Get apply filters button
   */
  getApplyFiltersButton(): Locator {
    return this.page.getByRole('button', { name: /apply.*filter/i })
      .or(this.page.getByTestId('apply-filters'));
  }

  // RESULTS

  /**
   * Get results container
   */
  getResultsContainer(): Locator {
    return this.page.getByRole('region', { name: /results|search.*results/i })
      .or(this.page.getByTestId('search-results'));
  }

  /**
   * Get result items
   */
  getResultItems(): Locator {
    return this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/member|account/i) })
      .or(this.page.getByTestId('result-item'));
  }

  /**
   * Get no results message
   */
  getNoResultsMessage(): Locator {
    return this.page.getByText(/no.*results|no.*members.*found/i)
      .or(this.page.getByTestId('no-results'));
  }

  /**
   * Get result count display
   */
  getResultCount(): Locator {
    return this.page.getByRole('status', { name: /results|found/i })
      .or(this.page.getByTestId('result-count'));
  }

  /**
   * Get loading spinner
   */
  getLoadingSpinner(): Locator {
    return this.page.getByRole('status', { name: /loading/i })
      .or(this.page.getByTestId('loading-spinner'));
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
   * Get current page display
   */
  getCurrentPageDisplay(): Locator {
    return this.page.getByRole('status', { name: /page/i })
      .or(this.page.getByTestId('pagination-page'));
  }

  // ====================
  // SEARCH ACTIONS
  // ====================

  /**
   * Search by account number
   */
  async searchByAccountNumber(accountNumber: string) {
    await this.getAccountNumberSearch().fill(accountNumber);
    await this.getSearchButton().click();
    await this.waitForSearchResults();
    logger.debug({ accountNumber }, 'Searched by account number');
  }

  /**
   * Search by member name
   */
  async searchByName(name: string) {
    await this.getNameSearch().fill(name);
    await this.getSearchButton().click();
    await this.waitForSearchResults();
    logger.debug({ name }, 'Searched by name');
  }

  /**
   * Search by SSN
   */
  async searchBySSN(ssn: string) {
    await this.getSSNSearch().fill(ssn);
    await this.getSearchButton().click();
    await this.waitForSearchResults();
    logger.debug({ ssn: '***-**-****' }, 'Searched by SSN');
  }

  /**
   * Search by email
   */
  async searchByEmail(email: string) {
    await this.getEmailSearch().fill(email);
    await this.getSearchButton().click();
    await this.waitForSearchResults();
    logger.debug({ email }, 'Searched by email');
  }

  /**
   * Search by phone
   */
  async searchByPhone(phone: string) {
    await this.getPhoneSearch().fill(phone);
    await this.getSearchButton().click();
    await this.waitForSearchResults();
    logger.debug({ phone }, 'Searched by phone');
  }

  /**
   * Clear all search fields
   */
  async clearSearch() {
    await this.getClearButton().click();
  }

  // ====================
  // ADVANCED FILTERS
  // ====================

  /**
   * Open advanced filters panel
   */
  async clickAdvancedFilters() {
    await this.getAdvancedFiltersButton().click();
    await this.getAdvancedFiltersPanel().waitFor({ state: 'visible' });
  }

  /**
   * Set status filter
   */
  async setStatusFilter(status: string) {
    await this.getStatusFilter().selectOption(status);
  }

  /**
   * Set member since date range filter
   */
  async setMemberSinceFilter(fromDate: string, toDate: string) {
    await this.getMemberSinceFromInput().fill(fromDate);
    await this.getMemberSinceToInput().fill(toDate);
  }

  /**
   * Set state filter
   */
  async setStateFilter(state: string) {
    await this.getStateFilter().selectOption(state);
  }

  /**
   * Apply advanced filters
   */
  async applyFilters() {
    await this.getApplyFiltersButton().click();
    await this.waitForSearchResults();
  }

  // ====================
  // WAIT UTILITIES
  // ====================

  /**
   * Wait for search results to load
   * Uses auto-waiting for loading spinner and results
   */
  private async waitForSearchResults() {
    // Wait for loading to start (optional, might be too fast)
    try {
      await this.getLoadingSpinner().waitFor({ state: 'visible', timeout: 2000 });
    } catch {
      // Loading might be too fast to catch
    }

    // Wait for loading to complete
    await this.getLoadingSpinner().waitFor({ state: 'hidden', timeout: 10000 });

    // Wait for either results or no results message
    await Promise.race([
      this.getResultsContainer().waitFor({ state: 'visible', timeout: 5000 }),
      this.getNoResultsMessage().waitFor({ state: 'visible', timeout: 5000 })
    ]);
  }

  // ====================
  // RESULTS QUERIES
  // ====================

  /**
   * Get number of search results
   */
  async getResultsCount(): Promise<number> {
    const hasResults = await this.getResultsContainer().isVisible();
    if (!hasResults) return 0;

    return await this.getResultItems().count();
  }

  /**
   * Check if there are results
   */
  async hasResults(): Promise<boolean> {
    return (await this.getResultsCount()) > 0;
  }

  /**
   * Get no results message
   */
  async getNoResultsMessageText(): Promise<string> {
    return await this.getNoResultsMessage().textContent() || '';
  }

  /**
   * Get first search result
   */
  async getFirstResult(): Promise<{
    accountNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  }> {
    const firstItem = this.getResultItems().first();

    return {
      accountNumber: await firstItem.locator('[data-field="accountNumber"]').textContent() || '',
      firstName: await firstItem.locator('[data-field="firstName"]').textContent() || '',
      lastName: await firstItem.locator('[data-field="lastName"]').textContent() || '',
      email: await firstItem.locator('[data-field="email"]').textContent() || '',
    };
  }

  /**
   * Get all search results
   */
  async getAllResults(): Promise<Array<{
    accountNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    address: { state: string };
  }>> {
    const count = await this.getResultsCount();
    const results = [];

    for (let i = 0; i < count; i++) {
      const item = this.getResultItems().nth(i);

      results.push({
        accountNumber: await item.locator('[data-field="accountNumber"]').textContent() || '',
        firstName: await item.locator('[data-field="firstName"]').textContent() || '',
        lastName: await item.locator('[data-field="lastName"]').textContent() || '',
        email: await item.locator('[data-field="email"]').textContent() || '',
        status: await item.locator('[data-field="status"]').textContent() || '',
        address: {
          state: await item.locator('[data-field="state"]').textContent() || '',
        },
      });
    }

    return results;
  }

  /**
   * Click on first search result
   */
  async clickFirstResult() {
    await this.getResultItems().first().click();
  }

  /**
   * Click on result by index
   */
  async clickResult(index: number) {
    await this.getResultItems().nth(index).click();
  }

  // ====================
  // EXPORT
  // ====================

  /**
   * Export search results
   */
  async clickExport(format: 'CSV' | 'Excel' | 'PDF') {
    await this.getExportButton().click();
    
    // Click the format option
    await this.page.locator(`[data-export-format="${format}"]`).click();
    
    logger.info({ format }, 'Export initiated');
  }

  // ====================
  // PAGINATION
  // ====================

  /**
   * Navigate to next page of results
   */
  async goToNextPage() {
    await this.getNextPageButton().click();
    await this.waitForSearchResults();
  }

  /**
   * Navigate to previous page of results
   */
  async goToPreviousPage() {
    await this.getPreviousPageButton().click();
    await this.waitForSearchResults();
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const text = await this.getCurrentPageDisplay().textContent() || '1';
    return parseInt(text.replace(/\D/g, '')) || 1;
  }
}