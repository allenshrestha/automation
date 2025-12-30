import { Page } from '@playwright/test';
import { PageHelper } from '@lib/core/page';
import { Wait } from '@lib/core/wait';
import { logger } from '@lib/core/logger';

export class BasePage {
  protected helper: PageHelper;

  constructor(protected page: Page) {
    this.helper = new PageHelper(page);
  }

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
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await Wait.forCondition(async () => {
      return (await this.page.locator('body').count()) > 0;
    });
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
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    const screenshot = await this.page.screenshot({ fullPage: true });
    logger.info({ name }, 'Screenshot captured');
    return screenshot;
  }

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
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(urlPattern: string | RegExp) {
    await Wait.forUrl(this.page, urlPattern);
  }

  /**
   * Accept alert dialog
   */
  async acceptDialog() {
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
      logger.debug({ message: dialog.message() }, 'Dialog accepted');
    });
  }

  /**
   * Dismiss alert dialog
   */
  async dismissDialog() {
    this.page.once('dialog', async (dialog) => {
      await dialog.dismiss();
      logger.debug({ message: dialog.message() }, 'Dialog dismissed');
    });
  }

  /**
   * Get dialog message
   */
  async getDialogMessage(): Promise<string> {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.dismiss();
        resolve(message);
      });
    });
  }
}