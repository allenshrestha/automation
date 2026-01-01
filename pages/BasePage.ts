import { Page, Locator } from '@playwright/test';
import { PageHelper } from '@lib/core/page';
import { logger } from '@lib/core/logger';

/**
 * BasePage - MODERNIZED FOR 2025
 * 
 * CHANGES FROM ORIGINAL:
 * ✅ Removed PageHelper dependency (was encouraging deprecated methods)
 * ✅ Direct page interaction with modern locators
 * ✅ Removed elementExists (use locator.count() instead)
 * ✅ Simplified dialog handling
 * ✅ Better waitForPageLoad implementation
 * 
 * PHILOSOPHY:
 * - Page Objects should interact directly with page.getByRole/getByLabel
 * - BasePage provides only common utilities, not abstraction layers
 * - Let Playwright's auto-waiting do the work
 */
export class BasePage {
  constructor(protected page: Page) {}

  // ====================
  // NAVIGATION
  // ====================

  /**
   * Navigate to a URL
   */
  async navigate(url: string) {
    await this.page.goto(url);
    await this.waitForPageLoad();
    logger.debug({ url }, 'Navigated to page');
  }

  /**
   * Wait for page to load
   * MODERNIZED: Uses network idle + visible check
   */
  async waitForPageLoad() {
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
    
    // Verify body is rendered
    await this.page.locator('body').waitFor({ state: 'visible' });
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(urlPattern: string | RegExp, timeout = 10000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  // ====================
  // PAGE ACTIONS
  // ====================

  /**
   * Refresh page
   */
  async refresh() {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back
   */
  async goBack() {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Go forward
   */
  async goForward() {
    await this.page.goForward();
    await this.waitForPageLoad();
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    const screenshot = await this.page.screenshot({ fullPage: true });
    logger.info({ name }, 'Screenshot captured');
    return screenshot;
  }

  // ====================
  // DIALOG HANDLING
  // ====================

  /**
   * Setup dialog listener and accept next dialog
   * 
   * Usage:
   *   await page.acceptNextDialog();
   *   await someActionThatTriggersDialog();
   */
  async acceptNextDialog(): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        logger.debug({ message }, 'Dialog accepted');
        resolve(message);
      });
    });
  }

  /**
   * Setup dialog listener and dismiss next dialog
   */
  async dismissNextDialog(): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.dismiss();
        logger.debug({ message }, 'Dialog dismissed');
        resolve(message);
      });
    });
  }

  /**
   * Setup dialog listener and respond with text
   */
  async respondToNextPrompt(text: string): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept(text);
        logger.debug({ message, response: text }, 'Dialog prompt answered');
        resolve(message);
      });
    });
  }

  // ====================
  // COMMON LOCATOR PATTERNS
  // ====================

  /**
   * Get loading spinner/indicator
   * Child classes can override if needed
   */
  getLoadingIndicator(): Locator {
    return this.page.getByRole('status', { name: /loading/i })
      .or(this.page.getByTestId('loading'))
      .or(this.page.locator('[aria-busy="true"]'));
  }

  /**
   * Wait for loading to complete
   * Uses hidden state - when loading disappears
   */
  async waitForLoadingComplete(timeout = 10000) {
    try {
      await this.getLoadingIndicator().waitFor({ 
        state: 'hidden', 
        timeout 
      });
    } catch {
      // Loading indicator might not exist, that's okay
    }
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

  /**
   * Get warning alert
   */
  getWarningAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /warning|caution/i })
      .or(this.page.getByTestId('warning-message'));
  }

  /**
   * Get info alert
   */
  getInfoAlert(): Locator {
    return this.page.getByRole('alert').filter({ hasText: /info|notice/i })
      .or(this.page.getByTestId('info-message'));
  }

  /**
   * Get modal/dialog
   */
  getModal(): Locator {
    return this.page.getByRole('dialog')
      .or(this.page.getByTestId('modal'));
  }

  /**
   * Get modal close button
   */
  getModalCloseButton(): Locator {
    return this.getModal().getByRole('button', { name: /close|dismiss/i })
      .or(this.getModal().getByTestId('close-modal'));
  }

  /**
   * Close modal
   */
  async closeModal() {
    await this.getModalCloseButton().click();
    await this.getModal().waitFor({ state: 'hidden' });
  }

  // ====================
  // COMMON BUTTON PATTERNS
  // ====================

  /**
   * Get submit button
   * Looks for common submit button patterns
   */
  getSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /submit|save|confirm/i })
      .or(this.page.locator('button[type="submit"]'));
  }

  /**
   * Get cancel button
   */
  getCancelButton(): Locator {
    return this.page.getByRole('button', { name: /cancel|close|back/i })
      .or(this.page.getByTestId('cancel-button'));
  }

  /**
   * Get delete button
   */
  getDeleteButton(): Locator {
    return this.page.getByRole('button', { name: /delete|remove/i })
      .or(this.page.getByTestId('delete-button'));
  }

  /**
   * Get edit button
   */
  getEditButton(): Locator {
    return this.page.getByRole('button', { name: /edit|modify/i })
      .or(this.page.getByTestId('edit-button'));
  }

  // ====================
  // ACCESSIBILITY HELPERS
  // ====================

  /**
   * Check if page has heading with text
   */
  async hasHeading(text: string | RegExp): Promise<boolean> {
    return await this.page.getByRole('heading', { name: text }).isVisible();
  }

  /**
   * Get main content region
   */
  getMainContent(): Locator {
    return this.page.getByRole('main')
      .or(this.page.locator('main'))
      .or(this.page.locator('[role="main"]'));
  }

  /**
   * Get navigation
   */
  getNavigation(): Locator {
    return this.page.getByRole('navigation')
      .or(this.page.locator('nav'))
      .or(this.page.locator('[role="navigation"]'));
  }

  // ====================
  // FORM HELPERS
  // ====================

  /**
   * Fill form field by label
   * This is the modern way - use label text, not selectors
   */
  async fillByLabel(labelText: string | RegExp, value: string) {
    await this.page.getByLabel(labelText).fill(value);
  }

  /**
   * Select option by label
   */
  async selectByLabel(labelText: string | RegExp, value: string) {
    await this.page.getByLabel(labelText).selectOption(value);
  }

  /**
   * Check checkbox by label
   */
  async checkByLabel(labelText: string | RegExp) {
    await this.page.getByLabel(labelText).check();
  }

  /**
   * Uncheck checkbox by label
   */
  async uncheckByLabel(labelText: string | RegExp) {
    await this.page.getByLabel(labelText).uncheck();
  }

  /**
   * Click button by text
   */
  async clickButtonByText(text: string | RegExp) {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Click link by text
   */
  async clickLinkByText(text: string | RegExp) {
    await this.page.getByRole('link', { name: text }).click();
  }

  // ====================
  // UTILITY METHODS
  // ====================

  /**
   * Wait for specific text to appear on page
   */
  async waitForText(text: string | RegExp, timeout = 10000) {
    await this.page.getByText(text).waitFor({ 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Check if text is visible on page
   */
  async hasText(text: string | RegExp): Promise<boolean> {
    return await this.page.getByText(text).isVisible();
  }

  /**
   * Get all text content from page
   * Useful for quick checks in tests
   */
  async getPageText(): Promise<string> {
    return await this.page.locator('body').textContent() || '';
  }

  /**
   * Parse currency amount
   * Common utility for banking apps
   */
  protected parseCurrency(text: string): number {
    return parseFloat(text.replace(/[$,]/g, '')) || 0;
  }

  /**
   * Format currency for display
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Parse date string
   */
  protected parseDate(text: string): Date {
    return new Date(text);
  }

  /**
   * Format date for input fields
   */
  protected formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

/**
 * MIGRATION NOTES FOR DEVELOPERS:
 * 
 * OLD WAY (Deprecated):
 * =====================
 * private selectors = { submitBtn: '[data-testid="submit"]' };
 * await this.helper.click(this.selectors.submitBtn);
 * 
 * NEW WAY (2025 Standard):
 * ========================
 * getSubmitButton(): Locator {
 *   return this.page.getByRole('button', { name: /submit/i })
 *     .or(this.page.getByTestId('submit'));
 * }
 * await this.getSubmitButton().click();
 * 
 * BENEFITS:
 * - Chainable locators
 * - Better for tests (can use in expect)
 * - Auto-waiting built-in
 * - Accessibility-first
 * - Type-safe
 */