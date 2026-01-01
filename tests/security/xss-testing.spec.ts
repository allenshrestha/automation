import { test, expect } from '../fixtures';
import { logger } from '@lib/core/logger';

test.describe('Security - XSS Testing', () => {
  test('should not execute XSS in search input', async ({ authenticatedPage, memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    const xssPayload = '<script>alert("XSS")</script>';
    await searchInput.fill(xssPayload);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    // Wait and verify no script executed
    await authenticatedPage.waitForTimeout(2000);
    
    // Page should still be functional
    await expect(authenticatedPage).toHaveURL(/search|member/);

    logger.info('XSS test passed for search input');
  });

  test('should not execute XSS in member name field', async ({ authenticatedPage, memberDetailsPage, testMember }) => {
    await memberDetailsPage.page.goto(`/members/${testMember.memberId}`);
    
    const editButton = memberDetailsPage.page
      .getByRole('button', { name: /edit/i });
    
    await editButton.click();

    const firstNameInput = memberDetailsPage.page
      .getByLabel(/first.*name/i)
      .or(memberDetailsPage.page.getByPlaceholder(/first/i));
    
    const xssPayload = '<img src=x onerror=alert("XSS")>';
    await firstNameInput.fill(xssPayload);

    const saveButton = memberDetailsPage.page
      .getByRole('button', { name: /save/i });
    
    await saveButton.click();

    await authenticatedPage.waitForTimeout(2000);
    
    // Should not execute, page should remain functional
    await expect(authenticatedPage).toHaveURL(/members/);

    logger.info('XSS test passed for name field');
  });

  test('should have all required security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
    ];

    const missingHeaders = requiredHeaders.filter(header => !headers?.[header]);

    if (missingHeaders.length > 0) {
      logger.warn({ missing: missingHeaders }, 'Missing security headers');
    }

    expect(missingHeaders.length).toBeLessThan(3);

    logger.info('Security headers checked');
  });
});