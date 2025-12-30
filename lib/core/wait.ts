import { Page, Locator } from '@playwright/test';
import { logger } from './logger';

/**
 * WAIT UTILITIES
 * 
 * ✅ ACTIVE NOW
 * 
 * Features:
 * - Custom wait conditions
 * - Wait for multiple elements
 * - Wait for API responses
 * - Timeout handling
 * 
 * Usage:
 * await Wait.forCondition(async () => await page.locator('.loaded').isVisible());
 * await Wait.forMultipleElements(page, ['.header', '.footer']);
 */

export class Wait {
  /**
   * Wait for custom condition
   */
  static async forCondition(
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
   * Wait for multiple elements to be visible
   */
  static async forMultipleElements(page: Page, selectors: string[], timeout: number = 30000) {
    const promises = selectors.map((selector) =>
      page.waitForSelector(selector, { timeout })
    );
    await Promise.all(promises);
    logger.debug({ selectors, count: selectors.length }, 'All elements loaded');
  }

  /**
   * Wait for API response matching URL pattern
   */
  static async forApiResponse(
    page: Page,
    urlPattern: string,
    timeout: number = 30000
  ) {
    const response = await page.waitForResponse(
      (response) => response.url().includes(urlPattern),
      { timeout }
    );
    logger.debug({ urlPattern, status: response.status() }, 'API response received');
    return response;
  }

  /**
   * Wait for element to disappear
   */
  static async forElementToDisappear(locator: Locator, timeout: number = 30000) {
    await locator.waitFor({ state: 'hidden', timeout });
    logger.debug('Element disappeared');
  }

  /**
   * Wait for page URL to match
   */
  static async forUrl(page: Page, urlPattern: string | RegExp, timeout: number = 30000) {
    await page.waitForURL(urlPattern, { timeout });
    logger.debug({ urlPattern }, 'URL matched');
  }

  /**
   * Wait for specific time (use sparingly)
   */
  static async forTime(ms: number) {
    logger.debug({ ms }, 'Waiting for fixed time');
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for element attribute to have value
   */
  static async forAttribute(
    locator: Locator,
    attribute: string,
    value: string,
    timeout: number = 30000
  ) {
    await this.forCondition(
      async () => {
        const attr = await locator.getAttribute(attribute);
        return attr === value;
      },
      timeout
    );
    logger.debug({ attribute, value }, 'Attribute matched');
  }
}