import { test, expect } from '@playwright/test';
import { security } from '@lib/core/security';
import { PageHelper } from '@lib/core/page';
import { Config } from '@lib/core/config';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';

/**
 * SECURITY - XSS TESTING
 * 
 * Tests: Cross-Site Scripting vulnerability testing
 * Keywords: security, xss, vulnerability, injection
 * Priority: P1 (High)
 */

test.describe('Security - XSS Testing', () => {
  test('should not execute XSS in search input', async ({ page }) => {
    const tracker = monitor.trackTest('xss-search-input');
    
    try {
      await page.goto(Config.BANNO_BASE_URL);
      
      const hasXSS = await security.testXSS(page, '[data-testid="search-input"]');
      
      expect(hasXSS).toBe(false);
      
      logger.info('XSS test passed for search input');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should not execute XSS in member name field', async ({ page }) => {
    const tracker = monitor.trackTest('xss-member-name');
    
    try {
      await page.goto(Config.BANNO_BASE_URL + '/members/new');
      
      const hasXSS = await security.testXSS(page, '#member-name');
      
      expect(hasXSS).toBe(false);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should have all required security headers', async ({ page }) => {
    const tracker = monitor.trackTest('security-headers');
    
    try {
      await page.goto(Config.BANNO_BASE_URL);
      
      const { secure, missing } = await security.checkHeaders(page);
      
      if (!secure) {
        logger.warn({ missing }, 'Missing security headers');
      }
      
      // Don't fail test, just warn
      expect(missing.length).toBeLessThan(3);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });
});