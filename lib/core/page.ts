import { Page, Locator } from '@playwright/test';
import { logger } from './logger';

/**
 * PAGE HELPER - MODERNIZED FOR 2025
 * 
 * ⚠️ IMPORTANT: This helper now encourages modern Playwright locator strategies
 * 
 * PREFERRED APPROACH (in your Page Objects):
 * - Use page.getByRole(), getByLabel(), getByText() directly
 * - Only use this helper for complex scenarios or backward compatibility
 * 
 * Features:
 * - Simplified page interactions
 * - Automatic waiting (built into Playwright)
 * - Modern locator support
 * - Comprehensive logging
 * 
 * Migration Guide:
 * OLD:  await helper.fill('#email', 'test@example.com');
 * NEW:  await page.getByLabel('Email').fill('test@example.com');
 * 
 * OLD:  await helper.click('button[type="submit"]');
 * NEW:  await page.getByRole('button', { name: 'Submit' }).click();
 */

export class PageHelper {
  constructor(private page: Page) {}

  /**
   * 🔴 DEPRECATED: Use page.getByLabel().fill() instead
   * 
   * Fill input field
   * @deprecated Use modern locators: page.getByLabel('Email').fill(value)
   */
  async fill(selector: string, value: string, clearFirst: boolean = true) {
    logger.warn({ selector }, '⚠️ Using legacy selector-based fill. Consider migrating to getByLabel() or getByRole()');
    
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    if (clearFirst) await locator.clear();
    await locator.fill(value);
    logger.debug({ selector, value: '***' }, 'Filled input');
  }

  /**
   * 🔴 DEPRECATED: Use page.getByRole().click() instead
   * 
   * Click element
   * @deprecated Use modern locators: page.getByRole('button', { name: 'Submit' }).click()
   */
  async click(selector: string, options?: { force?: boolean; timeout?: number }) {
    logger.warn({ selector }, '⚠️ Using legacy selector-based click. Consider migrating to getByRole()');
    
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout: options?.timeout });
    await locator.click({ force: options?.force });
    logger.debug({ selector }, 'Clicked element');
  }

  /**
   * 🔴 DEPRECATED: Use page.getByLabel().inputValue() instead
   * 
   * Get input value
   * @deprecated Use modern locators: await page.getByLabel('Email').inputValue()
   */
  async getValue(selector: string): Promise<string> {
    logger.warn({ selector }, '⚠️ Using legacy selector-based getValue. Consider migrating to getByLabel()');
    
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return (await locator.inputValue()) || '';
  }

  /**
   * 🔴 DEPRECATED: Use page.getByText().textContent() instead
   * 
   * Get text content
   * @deprecated Use modern locators: await page.getByText('Balance').textContent()
   */
  async getText(selector: string): Promise<string> {
    logger.warn({ selector }, '⚠️ Using legacy selector-based getText. Consider migrating to getByText()');
    
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) || '';
  }

  /**
   * ✅ MODERN: Works with any locator (including getByRole)
   * 
   * Fill a locator (works with modern locators)
   * This is the preferred method for complex scenarios
   */
  async fillLocator(locator: Locator, value: string, clearFirst: boolean = true) {
    await locator.waitFor({ state: 'visible' });
    if (clearFirst) await locator.clear();
    await locator.fill(value);
    logger.debug({ value: '***' }, 'Filled locator');
  }

  /**
   * ✅ MODERN: Works with any locator
   * 
   * Click a locator (works with modern locators)
   */
  async clickLocator(locator: Locator, options?: { force?: boolean; timeout?: number }) {
    await locator.waitFor({ state: 'visible', timeout: options?.timeout });
    await locator.click({ force: options?.force });
    logger.debug('Clicked locator');
  }

  /**
   * Check if element is visible
   * Works with both selectors and locators
   */
  async isVisible(selectorOrLocator: string | Locator, timeout: number = 5000): Promise<boolean> {
    try {
      if (typeof selectorOrLocator === 'string') {
        await this.page.waitForSelector(selectorOrLocator, { timeout, state: 'visible' });
      } else {
        await selectorOrLocator.waitFor({ state: 'visible', timeout });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element (supports both selectors and locators)
   */
  async waitFor(
    selectorOrLocator: string | Locator, 
    state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible', 
    timeout?: number
  ) {
    if (typeof selectorOrLocator === 'string') {
      await this.page.waitForSelector(selectorOrLocator, { state, timeout });
    } else {
      await selectorOrLocator.waitFor({ state, timeout });
    }
  }

  /**
   * 🔴 DEPRECATED: Use page.getByLabel().selectOption() instead
   * 
   * Select dropdown option
   * @deprecated Use modern locators: page.getByLabel('Account Type').selectOption('Checking')
   */
  async select(selector: string, value: string) {
    logger.warn({ selector }, '⚠️ Using legacy selector-based select. Consider migrating to getByLabel()');
    
    await this.page.locator(selector).selectOption(value);
    logger.debug({ selector, value }, 'Selected option');
  }

  /**
   * ✅ MODERN: Upload file (locator-compatible)
   * 
   * Upload file - works with modern locators
   */
  async uploadFile(locator: Locator | string, filePath: string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.setInputFiles(filePath);
    logger.debug({ filePath }, 'File uploaded');
  }

  /**
   * ✅ MODERN: Check checkbox (locator-compatible)
   */
  async check(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.check();
    logger.debug('Checkbox checked');
  }

  /**
   * ✅ MODERN: Uncheck checkbox (locator-compatible)
   */
  async uncheck(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.uncheck();
    logger.debug('Checkbox unchecked');
  }

  /**
   * ✅ MODERN: Set checkbox state
   */
  async setCheckbox(locator: Locator | string, checked: boolean) {
    if (checked) {
      await this.check(locator);
    } else {
      await this.uncheck(locator);
    }
  }

  /**
   * ✅ MODERN: Scroll to element (locator-compatible)
   */
  async scrollTo(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.scrollIntoViewIfNeeded();
    logger.debug('Scrolled to element');
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
    logger.debug('Network idle');
  }

  /**
   * Wait for URL
   */
  async waitForUrl(urlPattern: string | RegExp, timeout: number = 30000) {
    await this.page.waitForURL(urlPattern, { timeout });
    logger.debug({ urlPattern }, 'URL matched');
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string, timeout: number = 30000) {
    const response = await this.page.waitForResponse(
      (response) => response.url().includes(urlPattern),
      { timeout }
    );
    logger.debug({ urlPattern, status: response.status() }, 'API response received');
    return response;
  }

  /**
   * Wait for custom condition
   */
  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 30000,
    interval: number = 500
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        logger.debug('Wait condition met');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Wait condition not met within ${timeout}ms`);
  }

  /**
   * 🔴 DEPRECATED: Use page.locator().count() directly
   * 
   * Get element count
   * @deprecated Use directly: await page.locator(selector).count()
   */
  async count(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Press keyboard key
   */
  async press(key: string) {
    await this.page.keyboard.press(key);
    logger.debug({ key }, 'Key pressed');
  }

  /**
   * ✅ MODERN: Hover (locator-compatible)
   */
  async hover(locator: Locator | string) {
    const element = typeof locator === 'string' ? this.page.locator(locator) : locator;
    await element.hover();
    logger.debug('Hovered element');
  }

  /**
   * Static helper for backward compatibility
   */
  static async forUrl(page: Page, urlPattern: string | RegExp, timeout: number = 30000) {
    await page.waitForURL(urlPattern, { timeout });
    logger.debug({ urlPattern }, 'URL matched');
  }

  /**
   * Static helper for backward compatibility
   */
  static async forElementToDisappear(locator: Locator, timeout: number = 30000) {
    await locator.waitFor({ state: 'hidden', timeout });
    logger.debug('Element disappeared');
  }

  /**
   * ✅ NEW: Get by role (convenience wrapper)
   * 
   * Modern locator helper - encourages best practices
   */
  getByRole(role: 'button' | 'link' | 'textbox' | 'heading' | 'checkbox' | 'radio' | 'combobox', options?: {
    name?: string | RegExp;
    exact?: boolean;
  }): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * ✅ NEW: Get by label (convenience wrapper)
   */
  getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByLabel(text, options);
  }

  /**
   * ✅ NEW: Get by text (convenience wrapper)
   */
  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.page.getByText(text, options);
  }

  /**
   * ✅ NEW: Get by test id (fallback for complex scenarios)
   * 
   * Use only when getByRole/getByLabel won't work
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }
}

/**
 * MIGRATION CHEAT SHEET
 * ====================
 * 
 * Login Form Example:
 * 
 * ❌ OLD WAY (2023):
 * await helper.fill('#username', 'admin');
 * await helper.fill('#password', 'secret');
 * await helper.click('button[type="submit"]');
 * 
 * ✅ NEW WAY (2025):
 * await page.getByLabel('Username').fill('admin');
 * await page.getByLabel('Password').fill('secret');
 * await page.getByRole('button', { name: 'Sign In' }).click();
 * 
 * Account Selection Example:
 * 
 * ❌ OLD WAY:
 * await helper.click('[data-testid="account-selector"]');
 * await helper.select('[data-testid="account-dropdown"]', 'checking');
 * 
 * ✅ NEW WAY:
 * await page.getByLabel('Account Type').selectOption('checking');
 * 
 * Button Click Example:
 * 
 * ❌ OLD WAY:
 * await helper.click('[data-testid="make-deposit"]');
 * 
 * ✅ NEW WAY:
 * await page.getByRole('button', { name: 'Make Deposit' }).click();
 */