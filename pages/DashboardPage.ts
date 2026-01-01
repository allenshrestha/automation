import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * DashboardPage - MODERNIZED FOR 2025
 * 
 * CHANGES FROM ORIGINAL:
 * ✅ All locators use semantic roles first (button, link, heading, navigation, etc.)
 * ✅ Locator getters return Locator objects (already mostly done)
 * ✅ Removed page.waitForTimeout() calls
 * ✅ Auto-waiting assertions
 * ✅ Better use of getByRole for accessibility
 */
export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to dashboard
   */
  async navigate() {
    await this.page.goto(Config.BANNO_BASE_URL + '/dashboard');
    await this.waitForPageLoad();
    await this.waitForDashboardToLoad();
    logger.debug('Navigated to dashboard');
  }

  /**
   * Wait for dashboard to fully load
   * Uses auto-waiting instead of manual timeouts
   */
  async waitForDashboardToLoad() {
    // Wait for accounts summary region to be visible
    await this.getAccountsSummaryRegion().waitFor({ state: 'visible' });
  }

  // ====================
  // LOCATOR GETTERS
  // ====================

  /**
   * Get accounts summary region
   */
  getAccountsSummaryRegion(): Locator {
    return this.page.getByRole('region', { name: /accounts.*summary|accounts/i })
      .or(this.page.getByTestId('accounts-summary'));
  }

  /**
   * Get welcome heading
   */
  getWelcomeHeading(): Locator {
    return this.page.getByRole('heading', { name: /welcome/i, level: 1 })
      .or(this.page.getByTestId('welcome-message'));
  }

  /**
   * Get user profile button
   */
  getUserProfileButton(): Locator {
    return this.page.getByRole('button', { name: /profile|account.*menu/i })
      .or(this.page.getByTestId('user-profile'));
  }

  /**
   * Get profile dropdown menu
   */
  getProfileDropdown(): Locator {
    return this.page.getByRole('menu')
      .or(this.page.getByTestId('profile-dropdown'));
  }

  /**
   * Get logout button from menu
   */
  getLogoutMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: /log.*out|sign.*out/i })
      .or(this.page.getByTestId('logout-btn'));
  }

  /**
   * Get settings link from menu
   */
  getSettingsMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: /settings/i })
      .or(this.page.getByTestId('settings-link'));
  }

  /**
   * Get profile link from menu
   */
  getProfileMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: /my.*profile|profile/i })
      .or(this.page.getByTestId('profile-link'));
  }

  /**
   * Get account cards
   */
  getAccountCards(): Locator {
    return this.page.getByRole('article')
      .filter({ has: this.page.getByText(/account/i) })
      .or(this.page.getByTestId('account-card'));
  }

  /**
   * Get navigation menu
   */
  getNavigationMenu(): Locator {
    return this.page.getByRole('navigation', { name: /main.*navigation|primary/i })
      .or(this.page.getByTestId('nav-menu'));
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
   * Get alert items
   */
  getAlertItems(): Locator {
    return this.page.getByRole('alert')
      .or(this.page.getByTestId('alert-item'));
  }

  /**
   * Get quick transfer button
   */
  getQuickTransferButton(): Locator {
    return this.page.getByRole('button', { name: /transfer.*funds|quick.*transfer/i })
      .or(this.page.getByTestId('quick-transfer'));
  }

  /**
   * Get quick deposit button
   */
  getQuickDepositButton(): Locator {
    return this.page.getByRole('button', { name: /make.*deposit|quick.*deposit/i })
      .or(this.page.getByTestId('quick-deposit'));
  }

  /**
   * Get quick pay bill button
   */
  getQuickPayBillButton(): Locator {
    return this.page.getByRole('button', { name: /pay.*bill/i })
      .or(this.page.getByTestId('quick-pay-bill'));
  }

  /**
   * Get search input
   */
  getSearchInput(): Locator {
    return this.page.getByRole('searchbox', { name: /search/i })
      .or(this.page.getByTestId('global-search'));
  }

  // ====================
  // DASHBOARD STATE
  // ====================

  /**
   * Check if dashboard is loaded
   */
  async isDashboardLoaded(): Promise<boolean> {
    try {
      await this.getAccountsSummaryRegion().waitFor({ 
        state: 'visible', 
        timeout: 3000 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getWelcomeHeading().textContent() || '';
  }

  /**
   * Get user name from display
   */
  async getUserName(): Promise<string> {
    const userName = this.page.getByTestId('user-name');
    return await userName.textContent() || '';
  }

  // ====================
  // PROFILE DROPDOWN ACTIONS
  // ====================

  /**
   * Open profile dropdown
   */
  async openProfileDropdown() {
    await this.getUserProfileButton().click();
    await this.getProfileDropdown().waitFor({ state: 'visible' });
  }

  /**
   * Logout
   */
  async logout() {
    await this.openProfileDropdown();
    await this.getLogoutMenuItem().click();
    await this.page.waitForURL(/login/, { timeout: 10000 });
    logger.info('User logged out');
  }

  /**
   * Go to settings
   */
  async goToSettings() {
    await this.openProfileDropdown();
    await this.getSettingsMenuItem().click();
  }

  /**
   * Go to profile
   */
  async goToProfile() {
    await this.openProfileDropdown();
    await this.getProfileMenuItem().click();
  }

  // ====================
  // ACCOUNTS
  // ====================

  /**
   * Get all accounts
   * MODERNIZED: Better parsing logic
   */
  async getAllAccounts(): Promise<Array<{
    accountNumber: string;
    accountType: string;
    accountName: string;
    balance: number;
  }>> {
    const cards = this.getAccountCards();
    const count = await cards.count();
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      
      const accountNumber = await card.locator('[data-field="account-number"]').textContent() || '';
      const accountType = await card.locator('[data-field="account-type"]').textContent() || '';
      const accountName = await card.locator('[data-field="account-name"]').textContent() || '';
      const balanceText = await card.locator('[data-field="account-balance"]').textContent() || '0';
      const balance = parseFloat(balanceText.replace(/[$,]/g, ''));

      accounts.push({ accountNumber, accountType, accountName, balance });
    }

    return accounts;
  }

  /**
   * Get account count
   */
  async getAccountCount(): Promise<number> {
    return await this.getAccountCards().count();
  }

  /**
   * Click on account by index
   */
  async clickAccount(index: number) {
    const card = this.getAccountCards().nth(index);
    
    // Try button first, then click card
    const viewButton = card.getByRole('button', { name: /view|details|open/i });
    const hasButton = await viewButton.count() > 0;
    
    if (hasButton) {
      await viewButton.click();
    } else {
      await card.click();
    }
    
    logger.debug({ index }, 'Account clicked');
  }

  // ====================
  // BALANCES
  // ====================

  /**
   * Parse currency from text
   */
  private parseBalance(text: string): number {
    return parseFloat(text.replace(/[$,]/g, '')) || 0;
  }

  /**
   * Get total balance
   */
  async getTotalBalance(): Promise<number> {
    const balanceElement = this.page.getByRole('status', { name: /total.*balance/i })
      .or(this.page.getByTestId('total-balance'));
    
    const balanceText = await balanceElement.textContent() || '$0';
    return this.parseBalance(balanceText);
  }

  /**
   * Get total available balance
   */
  async getTotalAvailable(): Promise<number> {
    const balanceElement = this.page.getByRole('status', { name: /total.*available/i })
      .or(this.page.getByTestId('total-available'));
    
    const balanceText = await balanceElement.textContent() || '$0';
    return this.parseBalance(balanceText);
  }

  /**
   * Get total checking balance
   */
  async getTotalChecking(): Promise<number> {
    const balanceElement = this.page.getByTestId('total-checking');
    const balanceText = await balanceElement.textContent() || '$0';
    return this.parseBalance(balanceText);
  }

  /**
   * Get total savings balance
   */
  async getTotalSavings(): Promise<number> {
    const balanceElement = this.page.getByTestId('total-savings');
    const balanceText = await balanceElement.textContent() || '$0';
    return this.parseBalance(balanceText);
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
    accountName: string;
  }>> {
    const items = this.getTransactionItems();
    const count = await items.count();
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
      const date = await item.locator('[data-field="date"]').textContent() || '';
      const description = await item.locator('[data-field="description"]').textContent() || '';
      const amountText = await item.locator('[data-field="amount"]').textContent() || '0';
      const amount = this.parseBalance(amountText);
      const accountName = await item.locator('[data-field="account"]').textContent() || '';

      transactions.push({ date, description, amount, accountName });
    }

    return transactions;
  }

  /**
   * View all transactions
   */
  async viewAllTransactions() {
    const viewAllLink = this.page.getByRole('link', { name: /view.*all.*transactions|see.*all/i })
      .or(this.page.getByTestId('view-all-transactions'));
    
    await viewAllLink.click();
  }

  // ====================
  // QUICK ACTIONS
  // ====================

  /**
   * Quick transfer
   */
  async quickTransfer() {
    await this.getQuickTransferButton().click();
    logger.debug('Quick transfer initiated');
  }

  /**
   * Quick deposit
   */
  async quickDeposit() {
    await this.getQuickDepositButton().click();
    logger.debug('Quick deposit initiated');
  }

  /**
   * Quick pay bill
   */
  async quickPayBill() {
    await this.getQuickPayBillButton().click();
    logger.debug('Quick pay bill initiated');
  }

  /**
   * Quick open account
   */
  async quickOpenAccount() {
    const openAccountBtn = this.page.getByRole('button', { name: /open.*account/i })
      .or(this.page.getByTestId('quick-open-account'));
    
    await openAccountBtn.click();
    logger.debug('Quick open account initiated');
  }

  // ====================
  // NAVIGATION
  // ====================

  /**
   * Navigate to accounts page
   */
  async goToAccounts() {
    const accountsLink = this.getNavigationMenu()
      .getByRole('link', { name: /accounts/i });
    
    await accountsLink.click();
  }

  /**
   * Navigate to transactions page
   */
  async goToTransactions() {
    const transactionsLink = this.getNavigationMenu()
      .getByRole('link', { name: /transactions/i });
    
    await transactionsLink.click();
  }

  /**
   * Navigate to transfers page
   */
  async goToTransfers() {
    const transfersLink = this.getNavigationMenu()
      .getByRole('link', { name: /transfers/i });
    
    await transfersLink.click();
  }

  /**
   * Navigate to statements page
   */
  async goToStatements() {
    const statementsLink = this.getNavigationMenu()
      .getByRole('link', { name: /statements/i });
    
    await statementsLink.click();
  }

  /**
   * Navigate to bill pay page
   */
  async goToBillPay() {
    const billPayLink = this.getNavigationMenu()
      .getByRole('link', { name: /bill.*pay/i });
    
    await billPayLink.click();
  }

  // ====================
  // ALERTS
  // ====================

  /**
   * Get alerts count
   */
  async getAlertsCount(): Promise<number> {
    return await this.getAlertItems().count();
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(): Promise<Array<{
    title: string;
    message: string;
    type: string;
  }>> {
    const items = this.getAlertItems();
    const count = await items.count();
    const alerts = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
      const title = await item.locator('[data-field="title"]').textContent() || '';
      const message = await item.locator('[data-field="message"]').textContent() || '';
      const type = await item.locator('[data-field="type"]').textContent() || '';

      alerts.push({ title, message, type });
    }

    return alerts;
  }

  /**
   * View all alerts
   */
  async viewAllAlerts() {
    const viewAllLink = this.page.getByRole('link', { name: /view.*all.*alerts/i })
      .or(this.page.getByTestId('view-all-alerts'));
    
    await viewAllLink.click();
  }

  // ====================
  // MESSAGES
  // ====================

  /**
   * Get unread messages count
   */
  async getUnreadMessagesCount(): Promise<number> {
    const messageBadge = this.page.getByRole('status', { name: /unread.*messages/i })
      .or(this.page.getByTestId('message-badge'));
    
    const badgeText = await messageBadge.textContent() || '0';
    return parseInt(badgeText.replace(/\D/g, '')) || 0;
  }

  /**
   * Open messages dropdown
   */
  async openMessagesDropdown() {
    const messagesButton = this.page.getByRole('button', { name: /messages/i })
      .or(this.page.getByTestId('messages-icon'));
    
    await messagesButton.click();
    
    const dropdown = this.page.getByRole('menu')
      .or(this.page.getByTestId('messages-dropdown'));
    
    await dropdown.waitFor({ state: 'visible' });
  }

  // ====================
  // SCHEDULED TRANSACTIONS
  // ====================

  /**
   * Get scheduled transactions
   */
  async getScheduledTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    frequency: string;
  }>> {
    const items = this.page.getByTestId('scheduled-item');
    const count = await items.count();
    const scheduled = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
      const date = await item.locator('[data-field="date"]').textContent() || '';
      const description = await item.locator('[data-field="description"]').textContent() || '';
      const amountText = await item.locator('[data-field="amount"]').textContent() || '0';
      const amount = this.parseBalance(amountText);
      const frequency = await item.locator('[data-field="frequency"]').textContent() || '';

      scheduled.push({ date, description, amount, frequency });
    }

    return scheduled;
  }

  /**
   * View all scheduled transactions
   */
  async viewAllScheduled() {
    const viewAllLink = this.page.getByRole('link', { name: /view.*all.*scheduled/i })
      .or(this.page.getByTestId('view-all-scheduled'));
    
    await viewAllLink.click();
  }

  // ====================
  // SEARCH
  // ====================

  /**
   * Search globally
   */
  async search(query: string) {
    await this.getSearchInput().fill(query);
    await this.getSearchInput().press('Enter');
    
    const searchResults = this.page.getByRole('region', { name: /search.*results/i })
      .or(this.page.getByTestId('search-results'));
    
    await searchResults.waitFor({ state: 'visible' });
    
    logger.debug({ query }, 'Search performed');
  }

  /**
   * Get search results
   */
  async getSearchResults(): Promise<Array<{ title: string; type: string }>> {
    const items = this.page.getByRole('listitem')
      .filter({ has: this.page.getByText(/result/i) })
      .or(this.page.getByTestId('search-result-item'));
    
    const count = await items.count();
    const results = [];

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      
      const title = await item.locator('[data-field="title"]').textContent() || '';
      const type = await item.locator('[data-field="type"]').textContent() || '';

      results.push({ title, type });
    }

    return results;
  }

  // ====================
  // WIDGETS
  // ====================

  /**
   * Check if spending widget is visible
   */
  async hasSpendingWidget(): Promise<boolean> {
    const widget = this.page.getByRole('region', { name: /spending/i })
      .or(this.page.getByTestId('spending-widget'));
    
    return await widget.isVisible();
  }

  /**
   * Check if savings goals widget is visible
   */
  async hasSavingsGoalsWidget(): Promise<boolean> {
    const widget = this.page.getByRole('region', { name: /savings.*goals/i })
      .or(this.page.getByTestId('savings-goals-widget'));
    
    return await widget.isVisible();
  }

  /**
   * Check if credit score widget is visible
   */
  async hasCreditScoreWidget(): Promise<boolean> {
    const widget = this.page.getByRole('region', { name: /credit.*score/i })
      .or(this.page.getByTestId('credit-score-widget'));
    
    return await widget.isVisible();
  }
}