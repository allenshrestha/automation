import { Page, Route } from '@playwright/test';
import { logger } from './logger';

/**
 * NETWORK HELPER
 * 
 * Features:
 * - Mock API responses
 * - Block resources
 * - Modify requests
 * - Capture network traffic
 * 
 * Usage:
 * await Network.mock(page, '/api/users', { users: [] });
 * await Network.blockResources(page, ['image', 'font']);
 */

export class Network {
  /**
   * Mock API response
   */
  static async mock(page: Page, urlPattern: string, response: any, status: number = 200) {
    await page.route(urlPattern, (route) => {
      logger.debug({ urlPattern, status }, 'Mocking API response');
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Block resource types (images, fonts, etc.)
   */
  static async blockResources(page: Page, resourceTypes: string[]) {
    await page.route('**/*', (route) => {
      return resourceTypes.includes(route.request().resourceType())
        ? route.abort()
        : route.continue();
    });
    logger.debug({ resourceTypes }, 'Blocking resources');
  }

  /**
   * Modify request headers
   */
  static async modifyHeaders(page: Page, urlPattern: string, headers: Record<string, string>) {
    await page.route(urlPattern, (route) =>
      route.continue({
        headers: { ...route.request().headers(), ...headers },
      })
    );
    logger.debug({ urlPattern }, 'Modified request headers');
  }

  /**
   * Capture all requests matching pattern
   */
  static captureRequests(page: Page, urlPattern: string): any[] {
    const requests: any[] = [];

    page.on('request', (request) => {
      if (request.url().includes(urlPattern)) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
          timestamp: Date.now(),
        });
        logger.debug({ url: request.url(), method: request.method() }, 'Request captured');
      }
    });

    return requests;
  }

  /**
   * Capture all responses matching pattern
   */
  static captureResponses(page: Page, urlPattern: string): Promise<any[]> {
    const responses: any[] = [];

    page.on('response', async (response) => {
      if (response.url().includes(urlPattern)) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: await response.json().catch(() => null),
          timestamp: Date.now(),
        });
        logger.debug({ url: response.url(), status: response.status() }, 'Response captured');
      }
    });

    return Promise.resolve(responses);
  }

  /**
   * Simulate slow network
   */
  static async simulateSlowNetwork(page: Page, delayMs: number) {
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
    logger.debug({ delayMs }, 'Simulating slow network');
  }

  /**
   * Simulate network failure for specific URLs
   */
  static async simulateFailure(page: Page, urlPattern: string) {
    await page.route(urlPattern, (route) => {
      logger.debug({ urlPattern }, 'Simulating network failure');
      route.abort('failed');
    });
  }
}