import { test as cardTest, expect as cardExpect } from '../../fixtures';
import { logger as cardLogger } from '@lib/core/logger';

cardTest.describe('Card Management - Operations', () => {
  cardTest('should display all user cards', async ({ cardManagementPage }) => {
    await cardManagementPage.navigate();

    const cardItems = cardManagementPage.page
      .getByRole('article')
      .or(cardManagementPage.page.locator('[data-testid*="card"]'));
    
    const count = await cardItems.count();
    cardExpect(count).toBeGreaterThan(0);

    cardLogger.info({ count }, 'Cards displayed');
  });

  cardTest('should lock card temporarily', async ({ cardManagementPage }) => {
    await cardManagementPage.navigate();

    const firstCard = cardManagementPage.page
      .getByRole('article')
      .or(cardManagementPage.page.locator('[data-testid*="card"]'))
      .first();
    
    const lockButton = firstCard
      .getByRole('button', { name: /lock|freeze/i });
    
    await lockButton.click();

    const confirmButton = cardManagementPage.page
      .getByRole('button', { name: /confirm|yes/i });
    
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }

    const successMessage = cardManagementPage.page
      .getByRole('alert')
      .or(cardManagementPage.page.getByText(/locked|frozen/i));
    
    await cardExpect(successMessage).toBeVisible();

    cardLogger.info('Card locked');
  });

  cardTest('should unlock card', async ({ cardManagementPage }) => {
    await cardManagementPage.navigate();

    const firstCard = cardManagementPage.page
      .getByRole('article')
      .or(cardManagementPage.page.locator('[data-testid*="card"]'))
      .first();
    
    const unlockButton = firstCard
      .getByRole('button', { name: /unlock|unfreeze/i });
    
    if (await unlockButton.count() > 0) {
      await unlockButton.click();

      const successMessage = cardManagementPage.page
        .getByRole('alert')
        .or(cardManagementPage.page.getByText(/unlocked|unfrozen/i));
      
      await cardExpect(successMessage).toBeVisible();

      cardLogger.info('Card unlocked');
    }
  });
});
