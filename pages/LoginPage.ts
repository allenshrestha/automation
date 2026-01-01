import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';
import { logger } from '@lib/core/logger';

/**
 * LoginPage - Modernized for 2025
 * CHANGES: Uses getByLabel/getByRole instead of data-testid
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin() {
    await this.navigate(Config.BANNO_BASE_URL + '/login');
  }

  // ====================
  // LOCATORS (Modern)
  // ====================

  private getUsernameInput(): Locator {
    // Try label first, fallback to testid
    return this.page.getByLabel(/username|user id|account/i)
      .or(this.page.getByTestId('username'));
  }

  private getPasswordInput(): Locator {
    return this.page.getByLabel(/password/i)
      .or(this.page.getByTestId('password'));
  }

  private getSubmitButton(): Locator {
    return this.page.getByRole('button', { name: /submit|sign in|log in/i })
      .or(this.page.locator('button[type="submit"]'));
  }

  private getErrorMessage(): Locator {
    return this.page.getByRole('alert')
      .or(this.page.getByTestId('error-message'));
  }

  private getUserProfile(): Locator {
    return this.page.getByRole('button', { name: /profile|account/i })
      .or(this.page.getByTestId('user-profile'));
  }

  // ====================
  // ACTIONS
  // ====================

  /**
   * Perform login
   */
  async login(username: string, password: string) {
    await this.getUsernameInput().fill(username);
    await this.getPasswordInput().fill(password);
    await this.getSubmitButton().click();
    logger.info({ username }, 'Login attempted');
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    const errorLocator = this.getErrorMessage();
    const isVisible = await errorLocator.isVisible();
    return isVisible ? (await errorLocator.textContent() || '') : '';
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.getUserProfile().waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}