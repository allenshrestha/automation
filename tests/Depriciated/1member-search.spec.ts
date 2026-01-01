/**
 * tests/e2e/member-management/member-search.spec.ts
 * 
 * REAL-WORLD SCENARIO: Teller searches for member in branch
 * 
 * Business Flow:
 * 1. Teller logs in
 * 2. Searches for member by various criteria
 * 3. Views member details
 * 4. Updates member information
 * 5. Verifies changes
 */

import { test, expect } from '@playwright/test';
import { PageHelper } from '@lib/core/page';
import { Wait } from '@lib/core/wait';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Config } from '@lib/core/config';
import { Network } from '@lib/core/network';
import { LoginPage } from '@pages/LoginPage';
import { MemberSearchPage } from '@pages/MemberSearchPage';
import { MemberDetailsPage } from '@pages/MemberDetailsPage';

test.describe('Member Management - Search & Update', () => {
  let loginPage: LoginPage;
  let searchPage: MemberSearchPage;
  let detailsPage: MemberDetailsPage;
  let testMember: any;

  test.beforeAll(() => {
    // Generate test data once for all tests
    testMember = TestData.member();
    logger.info({ testMember }, 'Test data generated');
  });

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    searchPage = new MemberSearchPage(page);
    detailsPage = new MemberDetailsPage(page);

    // Login before each test
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);
  });

  test('should search member by account number', async ({ page }) => {
    const tracker = monitor.trackTest('member-search-by-account');

    try {
      // Navigate to member search
      await searchPage.navigate();

      // Search by account number
      await searchPage.searchByAccountNumber(testMember.accountNumber);

      // Verify search results
      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBeGreaterThan(0);

      // Verify first result contains account number
      const firstResult = await searchPage.getFirstResult();
      expect(firstResult.accountNumber).toContain(testMember.accountNumber);

      logger.info({ accountNumber: testMember.accountNumber, resultsCount }, 'Member found');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should search member by name with partial match', async ({ page }) => {
    const tracker = monitor.trackTest('member-search-by-name');

    try {
      await searchPage.navigate();

      // Search with partial name (first 3 letters)
      const partialName = testMember.lastName.substring(0, 3);
      await searchPage.searchByName(partialName);

      // Wait for results to load
      await Wait.forCondition(
        async () => (await searchPage.getResultsCount()) > 0,
        10000
      );

      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBeGreaterThan(0);

      // Verify results contain partial name
      const results = await searchPage.getAllResults();
      const hasMatch = results.some((r) =>
        r.lastName.toLowerCase().includes(partialName.toLowerCase())
      );
      expect(hasMatch).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle no results gracefully', async ({ page }) => {
    const tracker = monitor.trackTest('member-search-no-results');

    try {
      await searchPage.navigate();

      // Search with non-existent account
      await searchPage.searchByAccountNumber('999999999999');

      // Verify no results message
      const noResultsMessage = await searchPage.getNoResultsMessage();
      expect(noResultsMessage).toContain('No members found');

      // Verify results count is 0
      const resultsCount = await searchPage.getResultsCount();
      expect(resultsCount).toBe(0);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view member details from search results', async ({ page }) => {
    const tracker = monitor.trackTest('member-view-details');

    try {
      await searchPage.navigate();
      await searchPage.searchByAccountNumber(testMember.accountNumber);

      // Click first result
      await searchPage.clickFirstResult();

      // Wait for details page
      await Wait.forUrl(page, /members\/\d+/);

      // Verify details page loaded
      expect(await detailsPage.isLoaded()).toBeTruthy();

      // Verify member information displayed
      const memberInfo = await detailsPage.getMemberInfo();
      expect(memberInfo.accountNumber).toBe(testMember.accountNumber);
      expect(memberInfo.firstName).toBeTruthy();
      expect(memberInfo.lastName).toBeTruthy();

      logger.info({ memberInfo }, 'Member details loaded');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should update member phone number', async ({ page }) => {
    const tracker = monitor.trackTest('member-update-phone');

    try {
      // Navigate to member details
      await searchPage.navigate();
      await searchPage.searchByAccountNumber(testMember.accountNumber);
      await searchPage.clickFirstResult();

      // Wait for details page
      await detailsPage.waitForLoad();

      // Get original phone
      const originalPhone = await detailsPage.getPhone();

      // Click edit button
      await detailsPage.clickEdit();

      // Update phone number
      const newPhone = '555-123-4567';
      await detailsPage.updatePhone(newPhone);

      // Save changes
      await detailsPage.clickSave();

      // Wait for success message
      await Wait.forCondition(
        async () => await detailsPage.hasSuccessMessage(),
        5000
      );

      // Verify phone updated
      const updatedPhone = await detailsPage.getPhone();
      expect(updatedPhone).toBe(newPhone);

      logger.info({ originalPhone, newPhone }, 'Phone number updated');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate required fields on update', async ({ page }) => {
    const tracker = monitor.trackTest('member-update-validation');

    try {
      await searchPage.navigate();
      await searchPage.searchByAccountNumber(testMember.accountNumber);
      await searchPage.clickFirstResult();
      await detailsPage.waitForLoad();

      // Click edit
      await detailsPage.clickEdit();

      // Clear required field
      await detailsPage.clearEmail();

      // Try to save
      await detailsPage.clickSave();

      // Verify validation error
      const hasError = await detailsPage.hasValidationError('email');
      expect(hasError).toBeTruthy();

      const errorMessage = await detailsPage.getValidationErrorMessage('email');
      expect(errorMessage).toContain('required');

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should cancel edit without saving', async ({ page }) => {
    const tracker = monitor.trackTest('member-edit-cancel');

    try {
      await searchPage.navigate();
      await searchPage.searchByAccountNumber(testMember.accountNumber);
      await searchPage.clickFirstResult();
      await detailsPage.waitForLoad();

      // Get original phone
      const originalPhone = await detailsPage.getPhone();

      // Start editing
      await detailsPage.clickEdit();
      await detailsPage.updatePhone('555-999-9999');

      // Cancel instead of save
      await detailsPage.clickCancel();

      // Verify phone unchanged
      const currentPhone = await detailsPage.getPhone();
      expect(currentPhone).toBe(originalPhone);

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle concurrent updates gracefully', async ({ page, context }) => {
    const tracker = monitor.trackTest('member-concurrent-updates');

    try {
      // Open member in first tab
      await searchPage.navigate();
      await searchPage.searchByAccountNumber(testMember.accountNumber);
      await searchPage.clickFirstResult();
      await detailsPage.waitForLoad();
      await detailsPage.clickEdit();

      // Open same member in second tab
      const page2 = await context.newPage();
      const searchPage2 = new MemberSearchPage(page2);
      const detailsPage2 = new MemberDetailsPage(page2);

      await page2.goto(Config.BANNO_BASE_URL);
      await searchPage2.navigate();
      await searchPage2.searchByAccountNumber(testMember.accountNumber);
      await searchPage2.clickFirstResult();
      await detailsPage2.waitForLoad();
      await detailsPage2.clickEdit();

      // Update in second tab first
      await detailsPage2.updatePhone('555-222-2222');
      await detailsPage2.clickSave();
      await Wait.forCondition(() => detailsPage2.hasSuccessMessage(), 5000);

      // Try to save in first tab (should show conflict)
      await detailsPage.updatePhone('555-333-3333');
      await detailsPage.clickSave();

      // Verify conflict message or refresh needed
      const hasConflictMessage = await detailsPage.hasConflictMessage();
      expect(hasConflictMessage).toBeTruthy();

      await page2.close();
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should search with advanced filters', async ({ page }) => {
    const tracker = monitor.trackTest('member-advanced-search');

    try {
      await searchPage.navigate();

      // Open advanced filters
      await searchPage.clickAdvancedFilters();

      // Set multiple filters
      await searchPage.setStatusFilter('Active');
      await searchPage.setMemberSinceFilter('2020-01-01', '2023-12-31');
      await searchPage.setStateFilter('CA');

      // Apply filters
      await searchPage.applyFilters();

      // Wait for results
      await Wait.forCondition(() => searchPage.hasResults(), 10000);

      // Verify results match filters
      const results = await searchPage.getAllResults();
      expect(results.length).toBeGreaterThan(0);

      results.forEach((member) => {
        expect(member.status).toBe('Active');
        expect(member.address.state).toBe('CA');
      });

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should export search results to CSV', async ({ page }) => {
    const tracker = monitor.trackTest('member-export-csv');

    try {
      await searchPage.navigate();
      await searchPage.searchByName('Smith');

      // Wait for results
      await Wait.forCondition(() => searchPage.hasResults(), 10000);

      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await searchPage.clickExport('CSV');

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');

      // Save file
      const filepath = `./test-data/downloads/${download.suggestedFilename()}`;
      await download.saveAs(filepath);

      // Verify file exists
      expect(require('fs').existsSync(filepath)).toBeTruthy();

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });
});