import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';

export class MemberSearchPage extends BasePage {
  private selectors = {
    // Search inputs
    accountNumberInput: '[data-testid="search-account-number"]',
    nameInput: '[data-testid="search-name"]',
    ssnInput: '[data-testid="search-ssn"]',
    emailInput: '[data-testid="search-email"]',
    phoneInput: '[data-testid="search-phone"]',

    // Buttons
    searchButton: '[data-testid="search-button"]',
    clearButton: '[data-testid="clear-button"]',
    advancedFilterButton: '[data-testid="advanced-filters-button"]',
    exportButton: '[data-testid="export-button"]',

    // Advanced filters
    advancedFiltersPanel: '[data-testid="advanced-filters-panel"]',
    statusFilter: '[data-testid="filter-status"]',
    memberSinceFromInput: '[data-testid="filter-member-since-from"]',
    memberSinceToInput: '[data-testid="filter-member-since-to"]',
    stateFilter: '[data-testid="filter-state"]',
    applyFiltersButton: '[data-testid="apply-filters"]',

    // Results
    resultsContainer: '[data-testid="search-results"]',
    resultItem: '[data-testid="result-item"]',
    noResultsMessage: '[data-testid="no-results"]',
    resultCount: '[data-testid="result-count"]',
    loadingSpinner: '[data-testid="loading-spinner"]',

    // Pagination
    paginationNext: '[data-testid="pagination-next"]',
    paginationPrev: '[data-testid="pagination-prev"]',
    paginationPage: '[data-testid="pagination-page"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to member search page
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/members/search');
    await this.waitForPageLoad();
  }

  /**
   * Search by account number
   */
  async searchByAccountNumber(accountNumber: string) {
    await this.helper.fill(this.selectors.accountNumberInput, accountNumber);
    await this.helper.click(this.selectors.searchButton);

    await this.waitForSearchResults();
}
/**

Search by member name
*/
async searchByName(name: string) {
await this.helper.fill(this.selectors.nameInput, name);
await this.helper.click(this.selectors.searchButton);
await this.waitForSearchResults();
}

/**

Search by SSN
*/
async searchBySSN(ssn: string) {
await this.helper.fill(this.selectors.ssnInput, ssn);
await this.helper.click(this.selectors.searchButton);
await this.waitForSearchResults();
}

/**

Search by email
*/
async searchByEmail(email: string) {
await this.helper.fill(this.selectors.emailInput, email);
await this.helper.click(this.selectors.searchButton);
await this.waitForSearchResults();
}

/**

Search by phone
*/
async searchByPhone(phone: string) {
await this.helper.fill(this.selectors.phoneInput, phone);
await this.helper.click(this.selectors.searchButton);
await this.waitForSearchResults();
}

/**

Clear all search fields
*/
async clearSearch() {
await this.helper.click(this.selectors.clearButton);
}

/**

Open advanced filters panel
*/
async clickAdvancedFilters() {
await this.helper.click(this.selectors.advancedFilterButton);
await Wait.forCondition(
async () => await this.helper.isVisible(this.selectors.advancedFiltersPanel),
5000
);
}

/**

Set status filter
*/
async setStatusFilter(status: string) {
await this.helper.select(this.selectors.statusFilter, status);
}

/**

Set member since date range filter
*/
async setMemberSinceFilter(fromDate: string, toDate: string) {
await this.helper.fill(this.selectors.memberSinceFromInput, fromDate);
await this.helper.fill(this.selectors.memberSinceToInput, toDate);
}

/**

Set state filter
*/
async setStateFilter(state: string) {
await this.helper.select(this.selectors.stateFilter, state);
}

/**

Apply advanced filters
*/
async applyFilters() {
await this.helper.click(this.selectors.applyFiltersButton);
await this.waitForSearchResults();
}

/**

Wait for search results to load
*/
private async waitForSearchResults() {
// Wait for loading spinner to appear
await Wait.forCondition(
async () => await this.helper.isVisible(this.selectors.loadingSpinner),
2000
).catch(() => {}); // Spinner might be too fast

// Wait for loading spinner to disappear
await Wait.forCondition(
  async () => !(await this.helper.isVisible(this.selectors.loadingSpinner, 1000)),
  10000
);

// Wait for either results or no results message
await Wait.forCondition(
  async () =>
    (await this.helper.isVisible(this.selectors.resultsContainer)) ||
    (await this.helper.isVisible(this.selectors.noResultsMessage)),
  10000
);
}
/**

Get number of search results
*/
async getResultsCount(): Promise<number> {
const hasResults = await this.helper.isVisible(this.selectors.resultsContainer);
if (!hasResults) return 0;

return await this.helper.count(this.selectors.resultItem);
}
/**

Check if there are results
*/
async hasResults(): Promise<boolean> {
return (await this.getResultsCount()) > 0;
}

/**

Get no results message
*/
async getNoResultsMessage(): Promise<string> {
return await this.helper.getText(this.selectors.noResultsMessage);
}

/**

Get first search result
*/
async getFirstResult(): Promise<{
accountNumber: string;
firstName: string;
lastName: string;
email: string;
}> {
const firstItem = this.page.locator(this.selectors.resultItem).first();

return {
  accountNumber: await firstItem.locator('[data-field="accountNumber"]').textContent() || '',
  firstName: await firstItem.locator('[data-field="firstName"]').textContent() || '',
  lastName: await firstItem.locator('[data-field="lastName"]').textContent() || '',
  email: await firstItem.locator('[data-field="email"]').textContent() || '',
};
}
/**

Get all search results
*/
async getAllResults(): Promise
Array<{
accountNumber: string;
firstName: string;
lastName: string;
email: string;
status: string;
address: { state: string };
}>


{
const count = await this.getResultsCount();
const results = [];

for (let i = 0; i < count; i++) {
  const item = this.page.locator(this.selectors.resultItem).nth(i);

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

Click on first search result
*/
async clickFirstResult() {
await this.page.locator(this.selectors.resultItem).first().click();
}

/**

Click on result by index
*/
async clickResult(index: number) {
await this.page.locator(this.selectors.resultItem).nth(index).click();
}

/**

Export search results
*/
async clickExport(format: 'CSV' | 'Excel' | 'PDF') {
await this.helper.click(this.selectors.exportButton);
await this.page.locator([data-export-format="${format}"]).click();
}

/**

Navigate to next page of results
*/
async goToNextPage() {
await this.helper.click(this.selectors.paginationNext);
await this.waitForSearchResults();
}

/**

Navigate to previous page of results
*/
async goToPreviousPage() {
await this.helper.click(this.selectors.paginationPrev);
await this.waitForSearchResults();
}

/**

Get current page number
*/
async getCurrentPage(): Promise<number> {
const text = await this.helper.getText(this.selectors.paginationPage);
return parseInt(text);
}
}