import { test as searchTest, expect as searchExpect } from '../../fixtures';
import { logger as searchLogger } from '@lib/core/logger';

searchTest.describe('Member Management - Search & Update', () => {
  searchTest('should search member by email', async ({ 
    authenticatedPage, 
    memberSearchPage, 
    testMember 
  }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search|email/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill(testMember.email);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const resultRow = memberSearchPage.page
      .getByText(testMember.email)
      .or(memberSearchPage.page.getByRole('row'));
    
    await searchExpect(resultRow).toBeVisible();

    searchLogger.info({ email: testMember.email }, 'Member found');
  });

  searchTest('should handle no results gracefully', async ({ memberSearchPage }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill('999999999999');

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const noResultsMessage = memberSearchPage.page
      .getByText(/no.*results|no.*members/i);
    
    await searchExpect(noResultsMessage).toBeVisible();

    searchLogger.info('No results handled correctly');
  });

  searchTest('should view member details from search results', async ({ 
    memberSearchPage, 
    memberDetailsPage, 
    testMember 
  }) => {
    await memberSearchPage.navigate();
    
    const searchInput = memberSearchPage.page
      .getByLabel(/search|email/i)
      .or(memberSearchPage.page.getByPlaceholder(/search/i));
    
    await searchInput.fill(testMember.email);

    const searchButton = memberSearchPage.page
      .getByRole('button', { name: /search/i });
    
    await searchButton.click();

    const firstResult = memberSearchPage.page
      .getByText(testMember.email)
      .or(memberSearchPage.page.getByRole('row').first());
    
    await firstResult.click();

    await searchExpect(memberDetailsPage.page).toHaveURL(/members/);

    searchLogger.info('Member details loaded');
  });
});