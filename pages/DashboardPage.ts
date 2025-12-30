import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class DashboardPage extends BasePage {
  private selectors = {
    // Page elements
    pageTitle: '[data-testid="dashboard-title"]',
    loadingSpinner: '[data-testid="loading"]',
    welcomeMessage: '[data-testid="welcome-message"]',
    
    // User profile
    userProfile: '[data-testid="user-profile"]',
    userName: '[data-testid="user-name"]',
    userEmail: '[data-testid="user-email"]',
    profileDropdown: '[data-testid="profile-dropdown"]',
    logoutButton: '[data-testid="logout-btn"]',
    settingsLink: '[data-testid="settings-link"]',
    profileLink: '[data-testid="profile-link"]',
    
    // Account summary
    accountsSummary: '[data-testid="accounts-summary"]',
    accountCard: '[data-testid="account-card"]',
    accountNumber: '[data-field="account-number"]',
    accountType: '[data-field="account-type"]',
    accountBalance: '[data-field="account-balance"]',
    accountName: '[data-field="account-name"]',
    viewAccountButton: '[data-testid="view-account"]',
    
    // Total balances
    totalBalance: '[data-testid="total-balance"]',
    totalAvailable: '[data-testid="total-available"]',
    totalChecking: '[data-testid="total-checking"]',
    totalSavings: '[data-testid="total-savings"]',
    
    // Recent transactions
    recentTransactions: '[data-testid="recent-transactions"]',
    transactionItem: '[data-testid="transaction-item"]',
    viewAllTransactions: '[data-testid="view-all-transactions"]',
    
    // Quick actions
    quickActions: '[data-testid="quick-actions"]',
    transferButton: '[data-testid="quick-transfer"]',
    depositButton: '[data-testid="quick-deposit"]',
    payBillButton: '[data-testid="quick-pay-bill"]',
    openAccountButton: '[data-testid="quick-open-account"]',
    
    // Navigation menu
    navigationMenu: '[data-testid="nav-menu"]',
    accountsMenuItem: '[data-testid="nav-accounts"]',
    transactionsMenuItem: '[data-testid="nav-transactions"]',
    transfersMenuItem: '[data-testid="nav-transfers"]',
    statementsMenuItem: '[data-testid="nav-statements"]',
    billPayMenuItem: '[data-testid="nav-bill-pay"]',
    
    // Alerts and notifications
    alertsSection: '[data-testid="alerts-section"]',
    alertItem: '[data-testid="alert-item"]',
    alertBadge: '[data-testid="alert-badge"]',
    notificationsIcon: '[data-testid="notifications-icon"]',
    viewAllAlerts: '[data-testid="view-all-alerts"]',
    
    // Messages/Inbox
    messagesIcon: '[data-testid="messages-icon"]',
    messageBadge: '[data-testid="message-badge"]',
    messagesDropdown: '[data-testid="messages-dropdown"]',
    messageItem: '[data-testid="message-item"]',
    
    // Scheduled transactions
    scheduledSection: '[data-testid="scheduled-section"]',
    scheduledItem: '[data-testid="scheduled-item"]',
    viewAllScheduled: '[data-testid="view-all-scheduled"]',
    
    // Widgets
    spendingWidget: '[data-testid="spending-widget"]',
    savingsGoalsWidget: '[data-testid="savings-goals-widget"]',
    creditScoreWidget: '[data-testid="credit-score-widget"]',
    
    // Search
    searchInput: '[data-testid="global-search"]',
    searchResults: '[data-testid="search-results"]',
    searchResultItem: '[data-testid="search-result-item"]',
  };

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
   */
  async waitForDashboardToLoad() {
    await Wait.forCondition(
      async () => !(await this.helper.isVisible(this.selectors.loadingSpinner, 1000)),
      10000
    );
    await this.helper.waitFor(this.selectors.accountsSummary);
  }

  /**
   * Check if dashboard is loaded
   */
  async isDashboardLoaded(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.accountsSummary);
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.helper.getText(this.selectors.welcomeMessage);
  }

  /**
   * Get user name from profile
   */
  async getUserName(): Promise<string> {
    return await this.helper.getText(this.selectors.userName);
  }

  /**
   * Open profile dropdown
   */
  async openProfileDropdown() {
    await this.helper.click(this.selectors.userProfile);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.profileDropdown),
      3000
    );
  }

  /**
   * Logout
   */
  async logout() {
    await this.openProfileDropdown();
    await this.helper.click(this.selectors.logoutButton);
    await Wait.forUrl(this.page, /login/);
    logger.info('User logged out');
  }

  /**
   * Go to settings
   */
  async goToSettings() {
    await this.openProfileDropdown();
    await this.helper.click(this.selectors.settingsLink);
  }

  /**
   * Go to profile
   */
  async goToProfile() {
    await this.openProfileDropdown();
    await this.helper.click(this.selectors.profileLink);
  }

  /**
   * Get all accounts
   */
  async getAllAccounts(): Promise<Array<{
    accountNumber: string;
    accountType: string;
    accountName: string;
    balance: number;
  }>> {
    const count = await this.helper.count(this.selectors.accountCard);
    const accounts = [];

    for (let i = 0; i < count; i++) {
      const card = this.page.locator(this.selectors.accountCard).nth(i);
      accounts.push({
        accountNumber: await card.locator(this.selectors.accountNumber).textContent() || '',
        accountType: await card.locator(this.selectors.accountType).textContent() || '',
        accountName: await card.locator(this.selectors.accountName).textContent() || '',
        balance: parseFloat(
          (await card.locator(this.selectors.accountBalance).textContent())?.replace(/[$,]/g, '') || '0'
        ),
      });
    }

    return accounts;
  }

  /**
   * Get account count
   */
  async getAccountCount(): Promise<number> {
    return await this.helper.count(this.selectors.accountCard);
  }

  /**
   * Click on account by index
   */
  async clickAccount(index: number) {
    await this.page.locator(this.selectors.accountCard).nth(index)
      .locator(this.selectors.viewAccountButton).click();
    logger.debug({ index }, 'Account clicked');
  }

  /**
   * Get total balance
   */
  async getTotalBalance(): Promise<number> {
    const balanceText = await this.helper.getText(this.selectors.totalBalance);
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Get total available balance
   */
  async getTotalAvailable(): Promise<number> {
    const balanceText = await this.helper.getText(this.selectors.totalAvailable);
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Get total checking balance
   */
  async getTotalChecking(): Promise<number> {
    const balanceText = await this.helper.getText(this.selectors.totalChecking);
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Get total savings balance
   */
  async getTotalSavings(): Promise<number> {
    const balanceText = await this.helper.getText(this.selectors.totalSavings);
    return parseFloat(balanceText.replace(/[$,]/g, ''));
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    accountName: string;
  }>> {
    const count = await this.helper.count(this.selectors.transactionItem);
    const transactions = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.transactionItem).nth(i);
      transactions.push({
        date: await item.locator('[data-field="date"]').textContent() || '',
        description: await item.locator('[data-field="description"]').textContent() || '',
        amount: parseFloat(
          (await item.locator('[data-field="amount"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        accountName: await item.locator('[data-field="account"]').textContent() || '',
      });
    }

    return transactions;
  }

  /**
   * View all transactions
   */
  async viewAllTransactions() {
    await this.helper.click(this.selectors.viewAllTransactions);
  }

  /**
   * Quick transfer
   */
  async quickTransfer() {
    await this.helper.click(this.selectors.transferButton);
    logger.debug('Quick transfer initiated');
  }

  /**
   * Quick deposit
   */
  async quickDeposit() {
    await this.helper.click(this.selectors.depositButton);
    logger.debug('Quick deposit initiated');
  }

  /**
   * Quick pay bill
   */
  async quickPayBill() {
    await this.helper.click(this.selectors.payBillButton);
    logger.debug('Quick pay bill initiated');
  }

  /**
   * Quick open account
   */
  async quickOpenAccount() {
    await this.helper.click(this.selectors.openAccountButton);
    logger.debug('Quick open account initiated');
  }

  /**
   * Navigate to accounts page
   */
  async goToAccounts() {
    await this.helper.click(this.selectors.accountsMenuItem);
  }

  /**
   * Navigate to transactions page
   */
  async goToTransactions() {
    await this.helper.click(this.selectors.transactionsMenuItem);
  }

  /**
   * Navigate to transfers page
   */
  async goToTransfers() {
    await this.helper.click(this.selectors.transfersMenuItem);
  }

  /**
   * Navigate to statements page
   */
  async goToStatements() {
    await this.helper.click(this.selectors.statementsMenuItem);
  }

  /**
   * Navigate to bill pay page
   */
  async goToBillPay() {
    await this.helper.click(this.selectors.billPayMenuItem);
  }

  /**
   * Get alerts count
   */
  async getAlertsCount(): Promise<number> {
    return await this.helper.count(this.selectors.alertItem);
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(): Promise<Array<{
    title: string;
    message: string;
    type: string;
  }>> {
    const count = await this.getAlertsCount();
    const alerts = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.alertItem).nth(i);
      alerts.push({
        title: await item.locator('[data-field="title"]').textContent() || '',
        message: await item.locator('[data-field="message"]').textContent() || '',
        type: await item.locator('[data-field="type"]').textContent() || '',
      });
    }

    return alerts;
  }

  /**
   * View all alerts
   */
  async viewAllAlerts() {
    await this.helper.click(this.selectors.viewAllAlerts);
  }

  /**
   * Get unread messages count
   */
  async getUnreadMessagesCount(): Promise<number> {
    const badgeText = await this.helper.getText(this.selectors.messageBadge);
    return parseInt(badgeText) || 0;
  }

  /**
   * Open messages dropdown
   */
  async openMessagesDropdown() {
    await this.helper.click(this.selectors.messagesIcon);
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.messagesDropdown),
      3000
    );
  }

  /**
   * Get scheduled transactions
   */
  async getScheduledTransactions(): Promise<Array<{
    date: string;
    description: string;
    amount: number;
    frequency: string;
  }>> {
    const count = await this.helper.count(this.selectors.scheduledItem);
    const scheduled = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.scheduledItem).nth(i);
      scheduled.push({
        date: await item.locator('[data-field="date"]').textContent() || '',
        description: await item.locator('[data-field="description"]').textContent() || '',
        amount: parseFloat(
          (await item.locator('[data-field="amount"]').textContent())?.replace(/[$,]/g, '') || '0'
        ),
        frequency: await item.locator('[data-field="frequency"]').textContent() || '',
      });
    }

    return scheduled;
  }

  /**
   * View all scheduled transactions
   */
  async viewAllScheduled() {
    await this.helper.click(this.selectors.viewAllScheduled);
  }

  /**
   * Search globally
   */
  async search(query: string) {
    await this.helper.fill(this.selectors.searchInput, query);
    await this.page.keyboard.press('Enter');
    
    await Wait.forCondition(
      async () => await this.helper.isVisible(this.selectors.searchResults),
      5000
    );
    
    logger.debug({ query }, 'Search performed');
  }

  /**
   * Get search results
   */
  async getSearchResults(): Promise<Array<{
    title: string;
    type: string;
  }>> {
    const count = await this.helper.count(this.selectors.searchResultItem);
    const results = [];

    for (let i = 0; i < count; i++) {
      const item = this.page.locator(this.selectors.searchResultItem).nth(i);
      results.push({
        title: await item.locator('[data-field="title"]').textContent() || '',
        type: await item.locator('[data-field="type"]').textContent() || '',
      });
    }

    return results;
  }

  /**
   * Check if spending widget is visible
   */
  async hasSpendingWidget(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.spendingWidget);
  }

  /**
   * Check if savings goals widget is visible
   */
  async hasSavingsGoalsWidget(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.savingsGoalsWidget);
  }

  /**
   * Check if credit score widget is visible
   */
  async hasCreditScoreWidget(): Promise<boolean> {
    return await this.helper.isVisible(this.selectors.creditScoreWidget);
  }
}