import { exec } from 'child_process';
import { promisify } from 'util';
import { Page } from '@playwright/test';
import { Config } from './config';
import { logger } from './logger';

const execAsync = promisify(exec);

/**
 * SECURITY TESTING
 * 
 * 
 * Features:
 * - Dependency vulnerability scanning
 * - XSS testing
 * - SQL injection testing
 * - Security headers validation
 * 
 * Usage:
 * const audit = await security.auditDependencies();
 * const hasXSS = await security.testXSS(page, '#input');
 */

export class Security {
  /**
   * Run npm audit for dependency vulnerabilities
   */
  async auditDependencies(): Promise<any> {
    try {
      const { stdout } = await execAsync('npm audit --json');
      const report = JSON.parse(stdout);
      
      logger.info({
        vulnerabilities: report.metadata?.vulnerabilities,
      }, 'Security audit completed');

      return report;
    } catch (error: any) {
      // npm audit returns error code if vulnerabilities found
      const report = JSON.parse(error.stdout || '{}');
      logger.warn({
        vulnerabilities: report.metadata?.vulnerabilities,
      }, 'Vulnerabilities found');
      return report;
    }
  }

  /**
   * Test for XSS vulnerabilities
   */
  async testXSS(page: Page, inputSelector: string): Promise<boolean> {
    if (!Config.ENABLE_SECURITY) {
      logger.debug('Security testing disabled');
      return false;
    }

    const xssPayloads = [
      '<script>alert("xss")</script>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      "';alert(String.fromCharCode(88,83,83))//",
      '<img src=x onerror=alert("xss")>',
      '<svg/onload=alert("xss")>',
    ];

    for (const payload of xssPayloads) {
      await page.fill(inputSelector, payload);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Check if script executed (in real app this would trigger alert)
      const hasAlert = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts.some(s => s.textContent?.includes('alert'));
      });

      if (hasAlert) {
        logger.warn({ payload, selector: inputSelector }, 'Potential XSS vulnerability detected');
        return true;
      }
    }

    logger.info({ selector: inputSelector }, 'No XSS vulnerabilities detected');
    return false;
  }

  /**
   * Test for SQL injection vulnerabilities
   */
  async testSQLInjection(url: string, param: string): Promise<boolean> {
    if (!Config.ENABLE_SECURITY) return false;

    const sqlPayloads = [
      "' OR '1'='1",
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "admin'--",
      "1' UNION SELECT NULL--",
      "' OR 1=1--",
    ];

    for (const payload of sqlPayloads) {
      try {
        const testUrl = `${url}?${param}=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl);
        const text = await response.text();

        // Check for SQL error messages
        const sqlErrors = [
          'sql syntax',
          'mysql',
          'postgresql',
          'ora-',
          'syntax error',
          'unclosed quotation',
        ];

        const hasError = sqlErrors.some(err => 
          text.toLowerCase().includes(err)
        );

        if (hasError) {
          logger.warn({ payload, url }, 'Potential SQL injection vulnerability');
          return true;
        }
      } catch (error) {
        // Network errors are okay
      }
    }

    logger.info({ url }, 'No SQL injection vulnerabilities detected');
    return false;
  }

  /**
   * Check security headers
   */
  async checkHeaders(page: Page): Promise<{ secure: boolean; missing: string[] }> {
    if (!Config.ENABLE_SECURITY) {
      return { secure: true, missing: [] };
    }

    const response = await page.goto(page.url());
    if (!response) return { secure: true, missing: [] };

    const headers = response.headers();
    const requiredHeaders = {
      'strict-transport-security': 'HSTS',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-frame-options': 'X-Frame-Options',
      'content-security-policy': 'CSP',
      'x-xss-protection': 'X-XSS-Protection',
    };

    const missing: string[] = [];
    Object.entries(requiredHeaders).forEach(([header, name]) => {
      if (!headers[header]) {
        missing.push(name);
      }
    });

    const secure = missing.length === 0;
    
    if (!secure) {
      logger.warn({ missing }, 'Missing security headers');
    } else {
      logger.info('All security headers present');
    }

    return { secure, missing };
  }

  /**
   * Check for sensitive data exposure in responses
   */
  async checkSensitiveData(responseBody: string): Promise<string[]> {
    const sensitivePatterns = [
      { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
      { name: 'Credit Card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ },
      { name: 'API Key', pattern: /api[_-]?key[\s:=]+[\w-]{20,}/ },
      { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/ },
      { name: 'Password', pattern: /password[\s:=]+\S+/i },
    ];

    const found: string[] = [];
    
    sensitivePatterns.forEach(({ name, pattern }) => {
      if (pattern.test(responseBody)) {
        found.push(name);
        logger.warn({ type: name }, 'Sensitive data exposed in response');
      }
    });

    return found;
  }
}

export const security = new Security();