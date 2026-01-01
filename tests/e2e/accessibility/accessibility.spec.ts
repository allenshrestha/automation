import { test as a11yTest, expect as a11yExpect } from '../../fixtures';
import { logger as a11yLogger } from '@lib/core/logger';
import { injectAxe, checkA11y } from 'axe-playwright';

a11yTest.describe('Accessibility - WCAG Compliance', () => {
  a11yTest('should pass axe accessibility scan on login page', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    await injectAxe(page);

    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });

    a11yLogger.info('Login page passed accessibility scan');
  });

  a11yTest('should navigate login form with keyboard only', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    await page.keyboard.press('Tab');
    
    const usernameInput = loginPage.getUsernameInput();
    await a11yExpect(usernameInput).toBeFocused();

    await page.keyboard.press('Tab');
    
    const passwordInput = loginPage.getPasswordInput();
    await a11yExpect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await a11yExpect(submitButton).toBeFocused();

    a11yLogger.info('Keyboard navigation working correctly');
  });

  a11yTest('should have proper ARIA labels on form fields', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    const usernameInput = loginPage.getUsernameInput();
    const usernameLabel = await usernameInput.getAttribute('aria-label');
    const usernameLabelled = await usernameInput.getAttribute('aria-labelledby');
    
    a11yExpect(usernameLabel || usernameLabelled).toBeTruthy();

    const passwordInput = loginPage.getPasswordInput();
    const passwordLabel = await passwordInput.getAttribute('aria-label');
    const passwordLabelled = await passwordInput.getAttribute('aria-labelledby');
    
    a11yExpect(passwordLabel || passwordLabelled).toBeTruthy();

    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    const submitText = await submitButton.textContent();
    a11yExpect(submitText).toBeTruthy();

    a11yLogger.info('ARIA labels present on form fields');
  });

  a11yTest('should have sufficient color contrast', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

    await injectAxe(page);

    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    a11yLogger.info('Color contrast meets WCAG standards');
  });

  a11yTest('should maintain focus visibility', async ({ page, loginPage }) => {
    await loginPage.navigateToLogin();

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

    const hasFocusIndicator = 
      focusedElement.outline !== 'none' || 
      focusedElement.outlineWidth !== '0px' ||
      focusedElement.boxShadow !== 'none';

    a11yExpect(hasFocusIndicator).toBeTruthy();

    a11yLogger.info('Focus indicators visible');
  });

  a11yTest('should have proper heading hierarchy', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    const headings = await authenticatedPage.$$eval('h1, h2, h3, h4, h5, h6', elements =>
      elements.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent,
      }))
    );

    const h1Count = headings.filter(h => h.level === 1).length;
    a11yExpect(h1Count).toBeGreaterThan(0);

    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i - 1].level;
      a11yExpect(diff).toBeLessThanOrEqual(1);
    }

    a11yLogger.info('Heading hierarchy is correct');
  });

  a11yTest('should have alt text on images', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    const images = await authenticatedPage.$$('img');

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      const isAccessible = alt !== null || role === 'presentation';
      a11yExpect(isAccessible).toBeTruthy();
    }

    a11yLogger.info('All images have alt text or are marked decorative');
  });

  a11yTest('should pass full axe scan on dashboard', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.waitForDashboardToLoad();

    await injectAxe(authenticatedPage);

    await checkA11y(authenticatedPage, null, {
      detailedReport: true,
    });

    a11yLogger.info('Dashboard passed accessibility scan');
  });
});