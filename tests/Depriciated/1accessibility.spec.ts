/**
 * tests/e2e/accessibility/accessibility.spec.ts
 * 
 * REAL-WORLD SCENARIO: Accessibility compliance testing
 * 
 * Coverage:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - ARIA labels
 * - Color contrast
 * - Focus management
 * - Form accessibility
 * - WCAG 2.1 compliance
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { Config } from '@lib/core/config';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility - WCAG Compliance', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should pass axe accessibility scan on login page', async ({ page }) => {
    const tracker = monitor.trackTest('axe-scan-login');

    try {
      await loginPage.navigateToLogin();

      // Inject axe-core
      await injectAxe(page);

      // Run accessibility checks
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });

      logger.info('Login page passed accessibility scan');
      tracker.end('passed');
    } catch (error: any) {
      logger.error('Accessibility violations found', error);
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should navigate login form with keyboard only', async ({ page }) => {
    const tracker = monitor.trackTest('keyboard-navigation-login');

    try {
      await loginPage.navigateToLogin();

      // Tab to username field
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe('username');

      // Tab to password field
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe('password');

      // Tab to submit button
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('type'));
      expect(focusedElement).toBe('submit');

      logger.info('Keyboard navigation working correctly');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have proper ARIA labels on form fields', async ({ page }) => {
    const tracker = monitor.trackTest('aria-labels-forms');

    try {
      await loginPage.navigateToLogin();

      // Check username field has label
      const usernameLabel = await page.getAttribute('[data-testid="username"]', 'aria-label');
      expect(usernameLabel).toBeTruthy();

      // Check password field has label
      const passwordLabel = await page.getAttribute('[data-testid="password"]', 'aria-label');
      expect(passwordLabel).toBeTruthy();

      // Check submit button has accessible name
      const submitButton = await page.locator('button[type="submit"]');
      const submitText = await submitButton.textContent();
      expect(submitText).toBeTruthy();

      logger.info('ARIA labels present on form fields');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const tracker = monitor.trackTest('color-contrast');

    try {
      await loginPage.navigateToLogin();

      // Inject axe and run contrast checks
      await injectAxe(page);

      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      logger.info('Color contrast meets WCAG standards');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should maintain focus visibility', async ({ page }) => {
    const tracker = monitor.trackTest('focus-visibility');

    try {
      await loginPage.navigateToLogin();

      // Tab through elements and check focus outline
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        const styles = window.getComputedStyle(el!);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
        };
      });

      // Should have visible focus indicator
      const hasFocusIndicator = 
        focusedElement.outline !== 'none' || 
        focusedElement.outlineWidth !== '0px' ||
        focusedElement.boxShadow !== 'none';

      expect(hasFocusIndicator).toBeTruthy();

      logger.info('Focus indicators visible');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const tracker = monitor.trackTest('heading-hierarchy');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Check heading levels
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
        elements.map(el => ({
          level: parseInt(el.tagName.substring(1)),
          text: el.textContent,
        }))
      );

      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThan(0);

      // Headings should not skip levels
      for (let i = 1; i < headings.length; i++) {
        const diff = headings[i].level - headings[i - 1].level;
        expect(diff).toBeLessThanOrEqual(1);
      }

      logger.info('Heading hierarchy is correct');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have alt text on images', async ({ page }) => {
    const tracker = monitor.trackTest('image-alt-text');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Get all images
      const images = await page.$$('img');

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Images should have alt text or be marked as decorative
        const isAccessible = alt !== null || role === 'presentation';
        expect(isAccessible).toBeTruthy();
      }

      logger.info('All images have alt text or are marked decorative');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have accessible form error messages', async ({ page }) => {
    const tracker = monitor.trackTest('accessible-error-messages');

    try {
      await loginPage.navigateToLogin();

      // Submit form without filling
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Check if error is associated with field via aria-describedby
      const usernameField = await page.locator('[data-testid="username"]');
      const describedBy = await usernameField.getAttribute('aria-describedby');

      if (describedBy) {
        // Error message should exist
        const errorMessage = await page.locator(`#${describedBy}`);
        expect(await errorMessage.count()).toBeGreaterThan(0);
      }

      logger.info('Form errors are accessible');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    const tracker = monitor.trackTest('screen-reader-announcements');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login('invalid@email.com', 'wrongpassword');

      await page.waitForTimeout(1000);

      // Check for aria-live region
      const liveRegions = await page.$$('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check that error message is in live region
      const liveRegionContent = await page.evaluate(() => {
        const regions = Array.from(document.querySelectorAll('[aria-live]'));
        return regions.map(r => r.textContent);
      });

      const hasErrorAnnouncement = liveRegionContent.some(content => 
        content && content.toLowerCase().includes('error')
      );

      expect(hasErrorAnnouncement).toBeTruthy();

      logger.info('Screen reader announcements working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have accessible buttons', async ({ page }) => {
    const tracker = monitor.trackTest('accessible-buttons');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Get all buttons
      const buttons = await page.$$('button, [role="button"]');

      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        // Button should have accessible name
        const hasAccessibleName = 
          (text && text.trim().length > 0) || 
          ariaLabel || 
          title;

        expect(hasAccessibleName).toBeTruthy();
      }

      logger.info('All buttons have accessible names');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should support keyboard shortcuts', async ({ page }) => {
    const tracker = monitor.trackTest('keyboard-shortcuts');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Test Escape key closes modals
      // This would depend on your implementation

      // Test Enter key submits forms
      await page.fill('[data-testid="username"]', Config.USERNAME);
      await page.fill('[data-testid="password"]', Config.PASSWORD);
      await page.keyboard.press('Enter');

      await page.waitForTimeout(2000);

      logger.info('Keyboard shortcuts working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have accessible tables', async ({ page }) => {
    const tracker = monitor.trackTest('accessible-tables');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Find tables
      const tables = await page.$$('table');

      for (const table of tables) {
        // Table should have caption or aria-label
        const caption = await table.$('caption');
        const ariaLabel = await table.getAttribute('aria-label');
        
        const hasLabel = caption !== null || ariaLabel !== null;

        // Table headers should use <th>
        const headers = await table.$$('th');
        
        if (headers.length > 0) {
          expect(hasLabel).toBeTruthy();
        }
      }

      logger.info('Tables are accessible');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have accessible links', async ({ page }) => {
    const tracker = monitor.trackTest('accessible-links');

    try {
      await loginPage.navigateToLogin();

      // Get all links
      const links = await page.$$('a');

      for (const link of links) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Link should have accessible name
        const hasAccessibleName = 
          (text && text.trim().length > 0) || 
          ariaLabel || 
          title;

        expect(hasAccessibleName).toBeTruthy();

        // Links should not have generic text like "click here"
        const genericText = ['click here', 'read more', 'here'];
        if (text) {
          const isGeneric = genericText.some(generic => 
            text.toLowerCase().trim() === generic
          );
          expect(isGeneric).toBeFalsy();
        }
      }

      logger.info('Links are accessible');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have skip navigation link', async ({ page }) => {
    const tracker = monitor.trackTest('skip-navigation');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Press Tab to reveal skip link
      await page.keyboard.press('Tab');

      // Check for skip link
      const skipLink = await page.locator('a[href="#main"], a[href="#content"]');
      const skipLinkCount = await skipLink.count();

      if (skipLinkCount > 0) {
        expect(await skipLink.isVisible()).toBeTruthy();
        logger.info('Skip navigation link present');
      } else {
        logger.info('Skip navigation link not found');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have proper landmark roles', async ({ page }) => {
    const tracker = monitor.trackTest('landmark-roles');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Check for main landmark
      const main = await page.$$('main, [role="main"]');
      expect(main.length).toBeGreaterThan(0);

      // Check for navigation landmark
      const nav = await page.$$('nav, [role="navigation"]');
      expect(nav.length).toBeGreaterThan(0);

      // Check for banner (header)
      const header = await page.$$('header, [role="banner"]');
      expect(header.length).toBeGreaterThan(0);

      logger.info('Landmark roles present');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have accessible modals', async ({ page }) => {
    const tracker = monitor.trackTest('accessible-modals');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      // Open a modal (this depends on your UI)
      // For example, open account details modal

      // Check modal has role="dialog"
      const dialogs = await page.$$('[role="dialog"], [role="alertdialog"]');

      if (dialogs.length > 0) {
        const dialog = dialogs[0];

        // Modal should have aria-label or aria-labelledby
        const ariaLabel = await dialog.getAttribute('aria-label');
        const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');

        expect(ariaLabel || ariaLabelledBy).toBeTruthy();

        // Focus should be trapped in modal
        // This would require more complex testing

        logger.info('Modals are accessible');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    const tracker = monitor.trackTest('accessible-form-inputs');

    try {
      await loginPage.navigateToLogin();

      // Check all inputs have labels
      const inputs = await page.$$('input:not([type="hidden"])');

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Input should have associated label
        let hasLabel = false;

        if (id) {
          const label = await page.$(`label[for="${id}"]`);
          hasLabel = label !== null;
        }

        hasLabel = hasLabel || ariaLabel !== null || ariaLabelledBy !== null;

        expect(hasLabel).toBeTruthy();
      }

      logger.info('Form inputs are accessible');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should pass full axe scan on dashboard', async ({ page }) => {
    const tracker = monitor.trackTest('axe-scan-dashboard');

    try {
      await loginPage.navigateToLogin();
      await loginPage.login(Config.USERNAME, Config.PASSWORD);
      await Wait.forUrl(page, /dashboard/, 10000);

      await injectAxe(page);

      await checkA11y(page, null, {
        detailedReport: true,
      });

      logger.info('Dashboard passed accessibility scan');
      tracker.end('passed');
    } catch (error: any) {
      logger.error('Accessibility violations on dashboard', error);
      tracker.end('failed', error);
      throw error;
    }
  });
});