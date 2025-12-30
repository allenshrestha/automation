import { Page, Locator } from '@playwright/test';
import { logger } from './logger';

/**
 * PAGE HELPER
 * 
 * Features:
 * - Simplified page interactions
 * - Automatic waiting
 * - Error handling
 * - Logging
 * 
 * Usage:
 * const helper = new PageHelper(page);
 * await helper.fill('#email', 'test@example.com');
 * await helper.click('button[type="submit"]');
 */

export class PageHelper {
  constructor(private page: Page) {}

  /**
   * Fill input field
   */
  async fill(selector: string, value: string, clearFirst: boolean = true) {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    if (clearFirst) await locator.clear();
    await locator.fill(value);
    logger.debug({ selector, value: '***' }, 'Filled input');
  }

  /**
   * Click element
   */
  async click(selector: string, options?: { force?: boolean; timeout?: number }) {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout: options?.timeout });
    await locator.click({ force: options?.force });
    logger.debug({ selector }, 'Clicked element');
  }
  /**
   * Get Value
   */
  async getValue(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return (await locator.inputValue()) || '';
  }
  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for element
   */
  async waitFor(selector: string, state: 'visible' | 'hidden' = 'visible', timeout?: number) {
    await this.page.waitForSelector(selector, { state, timeout });
  }

  /**
   * Select dropdown option
   */
  async select(selector: string, value: string) {
    await this.page.locator(selector).selectOption(value);
    logger.debug({ selector, value }, 'Selected option');
  }

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string) {
    await this.page.locator(selector).setInputFiles(filePath);
    logger.debug({ selector, filePath }, 'File uploaded');
  }

  /**
   * Check checkbox
   */
  async check(selector: string) {
    await this.page.locator(selector).check();
    logger.debug({ selector }, 'Checkbox checked');
  }

  /**
   * Uncheck checkbox
   */
  async uncheck(selector: string) {
    await this.page.locator(selector).uncheck();
    logger.debug({ selector }, 'Checkbox unchecked');
  }

  /**
   * Set checkbox
   */
  async setCheckbox(selector: string, checked: boolean) {
    if (checked) {
      await this.check(selector);
    } else {
      await this.uncheck(selector);
    }
  }

  /**
   * Scroll to element
   */
  async scrollTo(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
    logger.debug({ selector }, 'Scrolled to element');
  }

  /**
   * Wait for network idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
    logger.debug('Network idle');
  }

  /**
   * Wait for Url
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
   * Wait for Condition
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
   * Get element count
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
   * Hover over element
   */
  async hover(selector: string) {
    await this.page.locator(selector).hover();
    logger.debug({ selector }, 'Hovered element');
  }

  /**
   * Wait for URL (for backward compatibility with existing page objects)
   */
  static async forUrl(page: Page, urlPattern: string | RegExp, timeout: number = 30000) {
    await page.waitForURL(urlPattern, { timeout });
    logger.debug({ urlPattern }, 'URL matched');
  }

  /**
   * Wait for Element to Disappear (for backward compatibility with existing page objects)
   */
  static async forElementToDisappear(locator: Locator, timeout: number = 30000) {
    await locator.waitFor({ state: 'hidden', timeout });
    logger.debug('Element disappeared');
  }
}