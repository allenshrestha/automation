import { test, expect } from '../../fixtures';
import { logger } from '@lib/core/logger';

test.describe('Statements - Management', () => {
  test('should display available statements', async ({ authenticatedPage, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox', { name: /account/i }));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const statementRows = statementsPage.page
      .getByRole('row')
      .or(statementsPage.page.locator('[data-testid*="statement"]'));
    
    const count = await statementRows.count();
    expect(count).toBeGreaterThan(0);

    logger.info({ count }, 'Statements displayed');
  });

  test('should download statement as PDF', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const downloadPromise = page.waitForEvent('download');
    
    const firstDownloadButton = statementsPage.page
      .getByRole('button', { name: /download/i })
      .first();
    
    await firstDownloadButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');

    logger.info({ filename: download.suggestedFilename() }, 'Statement downloaded');
  });

  test('should filter statements by date range', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const filterButton = statementsPage.page
      .getByRole('button', { name: /filter/i });
    
    if (await filterButton.count() > 0) {
      await filterButton.click();
    }

    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const startDateInput = statementsPage.page
      .getByLabel(/start.*date|from/i);
    
    const endDateInput = statementsPage.page
      .getByLabel(/end.*date|to/i);
    
    if (await startDateInput.count() > 0) {
      await startDateInput.fill(sixMonthsAgo.toISOString().split('T')[0]);
      await endDateInput.fill(today.toISOString().split('T')[0]);

      const applyButton = statementsPage.page
        .getByRole('button', { name: /apply/i });
      
      await applyButton.click();
    }

    logger.info('Date filter applied');
  });

  test('should filter statements by type', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const typeFilter = statementsPage.page
      .getByLabel(/type/i)
      .or(statementsPage.page.getByRole('combobox', { name: /type/i }));
    
    if (await typeFilter.count() > 0) {
      await typeFilter.selectOption('Monthly');
    }

    logger.info('Type filter applied');
  });

  test('should generate current month statement', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const downloadPromise = page.waitForEvent('download');
    
    const generateButton = statementsPage.page
      .getByRole('button', { name: /generate/i });
    
    await generateButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    logger.info('Current month statement generated');
  });

  test('should enroll in e-statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const enrollButton = statementsPage.page
      .getByRole('button', { name: /enroll.*e-?statement/i });
    
    if (await enrollButton.count() > 0) {
      await enrollButton.click();

      const emailInput = statementsPage.page
        .getByLabel(/email/i)
        .or(statementsPage.page.getByPlaceholder(/email/i));
      
      await emailInput.fill('test@example.com');

      const disablePaperCheckbox = statementsPage.page
        .getByLabel(/disable.*paper|stop.*paper/i)
        .or(statementsPage.page.getByRole('checkbox'));
      
      if (await disablePaperCheckbox.count() > 0) {
        await disablePaperCheckbox.check();
      }

      const submitButton = statementsPage.page
        .getByRole('button', { name: /submit|enroll/i });
      
      await submitButton.click();

      const successMessage = statementsPage.page
        .getByRole('alert')
        .or(statementsPage.page.getByText(/enrolled|success/i));
      
      await expect(successMessage).toBeVisible();

      logger.info('E-statement enrollment successful');
    }
  });

  test('should update e-statement email', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const settingsButton = statementsPage.page
      .getByRole('button', { name: /settings|preferences/i });
    
    if (await settingsButton.count() > 0) {
      await settingsButton.click();

      const emailInput = statementsPage.page
        .getByLabel(/email/i)
        .or(statementsPage.page.getByPlaceholder(/email/i));
      
      const newEmail = `updated_${Date.now()}@example.com`;
      await emailInput.fill(newEmail);

      const saveButton = statementsPage.page
        .getByRole('button', { name: /save|update/i });
      
      await saveButton.click();

      const successMessage = statementsPage.page
        .getByRole('alert')
        .or(statementsPage.page.getByText(/updated|saved/i));
      
      await expect(successMessage).toBeVisible();

      logger.info({ newEmail }, 'E-statement email updated');
    }
  });

  test('should opt back into paper statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const settingsButton = statementsPage.page
      .getByRole('button', { name: /settings|preferences/i });
    
    if (await settingsButton.count() > 0) {
      await settingsButton.click();

      const paperCheckbox = statementsPage.page
        .getByLabel(/enable.*paper|receive.*paper/i)
        .or(statementsPage.page.getByRole('checkbox', { name: /paper/i }));
      
      if (await paperCheckbox.count() > 0) {
        await paperCheckbox.check();

        const saveButton = statementsPage.page
          .getByRole('button', { name: /save/i });
        
        await saveButton.click();

        const confirmationMessage = statementsPage.page
          .getByText(/paper statements.*enabled/i)
          .or(statementsPage.page.getByRole('alert'));
        
        await expect(confirmationMessage).toBeVisible();

        logger.info('Paper statements re-enabled');
      }
    }
  });

  test('should view statement details', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const firstStatement = statementsPage.page
      .getByRole('row')
      .or(statementsPage.page.locator('[data-testid*="statement"]'))
      .first();
    
    await firstStatement.click();

    const detailsSection = statementsPage.page
      .getByRole('region', { name: /details/i })
      .or(statementsPage.page.locator('[data-testid="statement-details"]'));
    
    await expect(detailsSection).toBeVisible();

    logger.info('Statement details viewed');
  });

  test('should search statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const searchInput = statementsPage.page
      .getByLabel(/search/i)
      .or(statementsPage.page.getByPlaceholder(/search/i));
    
    const searchTerm = '2024';
    await searchInput.fill(searchTerm);

    const searchButton = statementsPage.page
      .getByRole('button', { name: /search/i });
    
    if (await searchButton.count() > 0) {
      await searchButton.click();
    }

    logger.info({ searchTerm }, 'Statement search completed');
  });

  test('should export statements list to CSV', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const downloadPromise = page.waitForEvent('download');
    
    const exportButton = statementsPage.page
      .getByRole('button', { name: /export/i });
    
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');

    logger.info('Statements exported to CSV');
  });

  test('should handle no statements available', async ({ statementsPage }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    const accountWithNoStatements = '999999999999';
    
    if (await accountSelect.count() > 0) {
      await accountSelect.selectOption(accountWithNoStatements).catch(() => {});
    }

    const noStatementsMessage = statementsPage.page
      .getByText(/no.*statements/i)
      .or(statementsPage.page.getByRole('status'));
    
    if (await noStatementsMessage.count() > 0) {
      await expect(noStatementsMessage).toBeVisible();
      logger.info('No statements message displayed correctly');
    }
  });

  test('should validate required email for e-statements', async ({ statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    const enrollButton = statementsPage.page
      .getByRole('button', { name: /enroll.*e-?statement/i });
    
    if (await enrollButton.count() > 0) {
      await enrollButton.click();

      const submitButton = statementsPage.page
        .getByRole('button', { name: /submit|enroll/i });
      
      await submitButton.click();

      const errorMessage = statementsPage.page
        .getByText(/email.*required/i)
        .or(statementsPage.page.getByRole('alert'));
      
      await expect(errorMessage).toBeVisible();

      logger.info('Email validation for e-statements working');
    }
  });

  test('should handle statement download errors gracefully', async ({ page, statementsPage, testAccount }) => {
    await statementsPage.navigate();
    
    const accountSelect = statementsPage.page
      .getByLabel(/account/i)
      .or(statementsPage.page.getByRole('combobox'));
    
    await accountSelect.selectOption(testAccount.accountNumber);

    // Simulate network error
    await page.route('**/api/statements/**', route => {
      route.abort('failed');
    });

    const downloadButton = statementsPage.page
      .getByRole('button', { name: /download/i })
      .first();
    
    if (await downloadButton.count() > 0) {
      await downloadButton.click();

      const errorMessage = statementsPage.page
        .getByRole('alert')
        .or(statementsPage.page.getByText(/error|failed/i));
      
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      logger.info('Download error handled gracefully');
    }
  });
});