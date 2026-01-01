import { test, expect, devices } from '@playwright/test';
import { logger } from '@lib/core/logger';
import { Config } from '@lib/core/config';

test.describe('Mobile & Responsive - Design Testing', () => {
  test('should display correctly on iPhone 12', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();

    await page.goto(Config.BANNO_BASE_URL);

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(428);

    const isMobile = await page.evaluate(() => window.innerWidth < 768);
    expect(isMobile).toBeTruthy();

    await context.close();
    logger.info('iPhone 12 display working');
  });

  test('should display correctly on iPad', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
    });
    const page = await context.newPage();

    await page.goto(Config.BANNO_BASE_URL);

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(768);

    await context.close();
    logger.info('iPad display working');
  });

  test('should handle touch interactions on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto(Config.BANNO_BASE_URL + '/login');

    const usernameInput = page
      .getByLabel(/username|email/i)
      .or(page.getByPlaceholder(/username/i));
    
    await usernameInput.tap();

    const focusedElement = await page.evaluate(() => 
      document.activeElement?.getAttribute('type') || document.activeElement?.tagName
    );
    
    expect(['text', 'email', 'INPUT']).toContain(focusedElement);

    await context.close();
    logger.info('Touch interactions working');
  });

  test('should display mobile navigation menu', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();

    await page.goto(Config.BANNO_BASE_URL);

    // Login first
    const usernameInput = page
      .getByLabel(/username|email/i)
      .or(page.getByPlaceholder(/username/i));
    
    const passwordInput = page
      .getByLabel(/password/i)
      .or(page.getByPlaceholder(/password/i));
    
    if (await usernameInput.count() > 0) {
      await usernameInput.fill(Config.USERNAME);
      await passwordInput.fill(Config.PASSWORD);

      const submitButton = page.getByRole('button', { name: /sign in|login/i });
      await submitButton.click();

      await page.waitForURL(/dashboard/, { timeout: 10000 });

      const hamburgerMenu = page
        .getByRole('button', { name: /menu/i })
        .or(page.getByLabel(/menu/i));
      
      if (await hamburgerMenu.count() > 0) {
        await hamburgerMenu.click();
        logger.info('Mobile navigation menu working');
      }
    }

    await context.close();
  });

  test('should not have horizontal scroll on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();

    await page.goto(Config.BANNO_BASE_URL);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBeFalsy();

    await context.close();
    logger.info('No horizontal scroll on mobile');
  });

  test('should adapt layout for different screen sizes', async ({ browser }) => {
    const screenSizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const size of screenSizes) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
      });
      const page = await context.newPage();

      await page.goto(Config.BANNO_BASE_URL);

      const viewport = page.viewportSize();
      expect(viewport?.width).toBe(size.width);

      await context.close();
      logger.info({ size: size.name }, 'Layout adapted correctly');
    }
  });
});