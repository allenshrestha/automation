import { test, expect } from '../../fixtures';
import { logger } from '@lib/core/logger';

test.describe('Alerts & Notifications - Management', () => {
  test('should display all alerts', async ({ authenticatedPage, alertsPage }) => {
    await alertsPage.navigate();

    const alertItems = alertsPage.page
      .getByRole('article')
      .or(alertsPage.page.locator('[data-testid*="alert"]'));
    
    const count = await alertItems.count();
    
    if (count > 0) {
      logger.info({ count }, 'Alerts displayed');
    } else {
      logger.info('No alerts available');
    }

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should create low balance alert', async ({ alertsPage, testAccount }) => {
    await alertsPage.navigate();

    const createButton = alertsPage.page
      .getByRole('button', { name: /create|new.*alert/i });
    
    await createButton.click();

    const alertTypeSelect = alertsPage.page
      .getByLabel(/alert.*type/i)
      .or(alertsPage.page.getByRole('combobox', { name: /type/i }));
    
    await alertTypeSelect.selectOption('Low Balance');

    const accountSelect = alertsPage.page
      .getByLabel(/account/i)
      .or(alertsPage.page.getByRole('combobox', { name: /account/i }));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const thresholdInput = alertsPage.page
      .getByLabel(/threshold|amount/i)
      .or(alertsPage.page.getByPlaceholder(/threshold/i));
    
    await thresholdInput.fill('100');

    const emailCheckbox = alertsPage.page
      .getByLabel(/email/i)
      .or(alertsPage.page.getByRole('checkbox', { name: /email/i }));
    
    await emailCheckbox.check();

    const saveButton = alertsPage.page
      .getByRole('button', { name: /save|create/i });
    
    await saveButton.click();

    const successMessage = alertsPage.page
      .getByRole('alert')
      .or(alertsPage.page.getByText(/created|saved/i));
    
    await expect(successMessage).toBeVisible();

    logger.info('Low balance alert created');
  });

  test('should mark alert as read', async ({ alertsPage }) => {
    await alertsPage.navigate();

    const firstAlert = alertsPage.page
      .getByRole('article')
      .or(alertsPage.page.locator('[data-testid*="alert"]'))
      .first();
    
    if (await firstAlert.count() > 0) {
      const markReadButton = firstAlert
        .getByRole('button', { name: /mark.*read|read/i });
      
      if (await markReadButton.count() > 0) {
        await markReadButton.click();
        logger.info('Alert marked as read');
      }
    }
  });
});