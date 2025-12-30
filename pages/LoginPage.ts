import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Config } from '@lib/core/config';

export class LoginPage extends BasePage {
  // Selectors
  private selectors = {
    usernameInput: '[data-testid="username"]',
    passwordInput: '[data-testid="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[data-testid="error-message"]',
    userProfile: '[data-testid="user-profile"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin() {
    await this.navigate(Config.BANNO_BASE_URL + '/login');
  }

  /**
   * Perform login
   */
  async login(username: string, password: string) {
    await this.helper.fill(this.selectors.usernameInput, username);
    await this.helper.fill(this.selectors.passwordInput, password);
    await this.helper.click(this.selectors.submitButton);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.helper.getText(this.selectors.errorMessage);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    return !(await this.helper.isVisible(this.selectors.submitButton, 2000));
  }
}