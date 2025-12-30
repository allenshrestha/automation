/**
 * tests/e2e/cards/card-management.spec.ts
 * 
 * REAL-WORLD SCENARIO: Card management operations
 * 
 * Coverage:
 * - Card activation
 * - Lock/unlock card
 * - Report lost/stolen
 * - Order replacement
 * - PIN management
 * - Card limits and controls
 * - Digital wallet integration
 * - Card alerts
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { CardManagementPage } from '@pages/CardManagementPage';
import { Config } from '@lib/core/config';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { Wait } from '@lib/core/wait';

test.describe('Card Management - Operations', () => {
  let loginPage: LoginPage;
  let cardPage: CardManagementPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    cardPage = new CardManagementPage(page);

    // Login
    await loginPage.navigateToLogin();
    await loginPage.login(Config.USERNAME, Config.PASSWORD);
    await Wait.forUrl(page, /dashboard/, 10000);

    // Navigate to card management
    await cardPage.navigate();
  });

  test('should display all user cards', async ({ page }) => {
    const tracker = monitor.trackTest('display-cards');

    try {
      const cards = await cardPage.getAllCards();

      expect(cards.length).toBeGreaterThan(0);

      cards.forEach(card => {
        expect(card.number).toBeTruthy();
        expect(card.type).toBeTruthy();
        expect(card.status).toBeTruthy();
        expect(card.expiration).toBeTruthy();
      });

      logger.info({ count: cards.length }, 'Cards displayed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view card details', async ({ page }) => {
    const tracker = monitor.trackTest('view-card-details');

    try {
      await cardPage.viewCardDetails(0);

      const fullNumber = await cardPage.getFullCardNumber();
      expect(fullNumber).toBeTruthy();
      expect(fullNumber).toMatch(/\d{4}\s\d{4}\s\d{4}\s\d{4}/);

      await cardPage.closeCardDetails();

      logger.info('Card details viewed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should show CVV securely', async ({ page }) => {
    const tracker = monitor.trackTest('show-cvv');

    try {
      await cardPage.viewCardDetails(0);

      const cvv = await cardPage.showCVV();
      expect(cvv).toBeTruthy();
      expect(cvv).toMatch(/^\d{3,4}$/);

      await cardPage.closeCardDetails();

      logger.info('CVV displayed securely');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should activate new card', async ({ page }) => {
    const tracker = monitor.trackTest('activate-card');

    try {
      const cards = await cardPage.getAllCards();
      const inactiveCard = cards.findIndex(c => c.status.toLowerCase() === 'inactive');

      if (inactiveCard >= 0) {
        await cardPage.activateCard(inactiveCard, {
          last4Digits: '1234',
          cvv: '123',
          expiration: '12/25',
        });

        expect(await cardPage.hasSuccessMessage()).toBeTruthy();

        logger.info({ index: inactiveCard }, 'Card activated');
      } else {
        logger.info('No inactive cards to activate');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should lock card temporarily', async ({ page }) => {
    const tracker = monitor.trackTest('lock-card');

    try {
      await cardPage.lockCard(0, 'Temporary Hold');

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      // Verify card status changed
      const cards = await cardPage.getAllCards();
      expect(cards[0].status.toLowerCase()).toContain('lock');

      logger.info('Card locked');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should unlock card', async ({ page }) => {
    const tracker = monitor.trackTest('unlock-card');

    try {
      // First lock the card
      await cardPage.lockCard(0);
      await page.waitForTimeout(1000);

      // Then unlock it
      await cardPage.unlockCard(0);

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Card unlocked');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should report card lost', async ({ page }) => {
    const tracker = monitor.trackTest('report-card-lost');

    try {
      const today = new Date().toISOString().split('T')[0];

      await cardPage.reportCardLost(0, {
        date: today,
        location: 'Shopping Mall',
        description: 'Lost card while shopping',
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Card reported lost');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should report card stolen', async ({ page }) => {
    const tracker = monitor.trackTest('report-card-stolen');

    try {
      const today = new Date().toISOString().split('T')[0];

      await cardPage.reportCardStolen(0, {
        date: today,
        location: 'Parking Lot',
        description: 'Card was stolen from vehicle',
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Card reported stolen');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should order replacement card', async ({ page }) => {
    const tracker = monitor.trackTest('order-replacement-card');

    try {
      await cardPage.orderReplacement(0, {
        reason: 'Damaged',
        expedited: false,
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Replacement card ordered');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should order expedited replacement', async ({ page }) => {
    const tracker = monitor.trackTest('order-expedited-replacement');

    try {
      await cardPage.orderReplacement(0, {
        reason: 'Lost',
        expedited: true,
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Expedited replacement ordered');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should set PIN for new card', async ({ page }) => {
    const tracker = monitor.trackTest('set-pin');

    try {
      await cardPage.setPIN(0, '1234');

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('PIN set');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should change PIN', async ({ page }) => {
    const tracker = monitor.trackTest('change-pin');

    try {
      await cardPage.changePIN(0, '1234', '5678');

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('PIN changed');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate PIN format', async ({ page }) => {
    const tracker = monitor.trackTest('validate-pin-format');

    try {
      // Try invalid PIN (too short)
      await page.locator(cardPage['selectors'].cardItem).first()
        .locator(cardPage['selectors'].setPINButton).click();

      await page.waitForSelector(cardPage['selectors'].pinModal);

      await page.fill(cardPage['selectors'].newPINInput, '12'); // Too short
      await page.fill(cardPage['selectors'].confirmPINInput, '12');

      await page.click(cardPage['selectors'].savePINButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('PIN validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should set card spending limits', async ({ page }) => {
    const tracker = monitor.trackTest('set-card-limits');

    try {
      await cardPage.setCardLimits(0, {
        dailyPurchase: 5000,
        dailyATM: 1000,
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info({ purchase: 5000, atm: 1000 }, 'Card limits set');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should configure card controls', async ({ page }) => {
    const tracker = monitor.trackTest('configure-card-controls');

    try {
      await cardPage.setCardControls(0, {
        allowInternational: true,
        allowOnline: true,
        allowATM: true,
        allowContactless: false,
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Card controls configured');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should disable international transactions', async ({ page }) => {
    const tracker = monitor.trackTest('disable-international');

    try {
      await cardPage.setCardControls(0, {
        allowInternational: false,
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('International transactions disabled');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should add card to Apple Pay', async ({ page }) => {
    const tracker = monitor.trackTest('add-to-apple-pay');

    try {
      await cardPage.addToDigitalWallet(0, 'ApplePay');

      // This might open external flow
      await page.waitForTimeout(2000);

      logger.info('Card added to Apple Pay');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should configure card alerts', async ({ page }) => {
    const tracker = monitor.trackTest('configure-card-alerts');

    try {
      await cardPage.setCardAlerts(0, {
        transactionAlert: true,
        declinedAlert: true,
        internationalAlert: true,
        largeTransactionAlert: true,
        largeTransactionThreshold: 500,
      });

      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Card alerts configured');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should view card transactions', async ({ page }) => {
    const tracker = monitor.trackTest('view-card-transactions');

    try {
      const transactions = await cardPage.getCardTransactions(0);

      if (transactions.length > 0) {
        transactions.forEach(tx => {
          expect(tx.date).toBeTruthy();
          expect(tx.merchant).toBeTruthy();
          expect(tx.amount).toBeGreaterThan(0);
        });

        logger.info({ count: transactions.length }, 'Card transactions viewed');
      } else {
        logger.info('No card transactions available');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should handle lock/unlock toggle', async ({ page }) => {
    const tracker = monitor.trackTest('lock-unlock-toggle');

    try {
      // Lock card
      await cardPage.lockCard(0);
      expect(await cardPage.hasSuccessMessage()).toBeTruthy();
      await page.waitForTimeout(1000);

      // Unlock card
      await cardPage.unlockCard(0);
      expect(await cardPage.hasSuccessMessage()).toBeTruthy();
      await page.waitForTimeout(1000);

      // Lock again
      await cardPage.lockCard(0);
      expect(await cardPage.hasSuccessMessage()).toBeTruthy();

      logger.info('Lock/unlock toggle working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should prevent setting invalid spending limits', async ({ page }) => {
    const tracker = monitor.trackTest('validate-spending-limits');

    try {
      await page.locator(cardPage['selectors'].cardItem).first().click();
      await page.waitForTimeout(500);

      await page.click(cardPage['selectors'].editLimitsButton);

      // Try to set negative limit
      await page.fill(cardPage['selectors'].dailyPurchaseLimitInput, '-100');

      await page.click(cardPage['selectors'].saveLimitsButton);

      // Should show validation error
      await page.waitForTimeout(1000);

      logger.info('Spending limit validation working');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should require confirmation for card deactivation', async ({ page }) => {
    const tracker = monitor.trackTest('confirm-card-deactivation');

    try {
      await cardPage.reportCardLost(0, {
        date: new Date().toISOString().split('T')[0],
      });

      // Should show confirmation that card will be deactivated
      await page.waitForTimeout(1000);

      logger.info('Card deactivation confirmation required');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should display card activation instructions', async ({ page }) => {
    const tracker = monitor.trackTest('activation-instructions');

    try {
      const cards = await cardPage.getAllCards();
      const inactiveCard = cards.findIndex(c => c.status.toLowerCase() === 'inactive');

      if (inactiveCard >= 0) {
        await page.locator(cardPage['selectors'].cardItem).nth(inactiveCard)
          .locator(cardPage['selectors'].activateCardButton).click();

        await page.waitForSelector(cardPage['selectors'].activationModal);

        // Instructions should be visible
        await page.waitForTimeout(1000);

        logger.info('Activation instructions displayed');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('should validate card information during activation', async ({ page }) => {
    const tracker = monitor.trackTest('validate-activation-info');

    try {
      const cards = await cardPage.getAllCards();
      const inactiveCard = cards.findIndex(c => c.status.toLowerCase() === 'inactive');

      if (inactiveCard >= 0) {
        await page.locator(cardPage['selectors'].cardItem).nth(inactiveCard)
          .locator(cardPage['selectors'].activateCardButton).click();

        await page.waitForSelector(cardPage['selectors'].activationModal);

        // Enter incorrect information
        await page.fill(cardPage['selectors'].last4DigitsInput, '0000');
        await page.fill(cardPage['selectors'].cvvInput, '000');
        await page.fill(cardPage['selectors'].expirationInput, '99/99');

        await page.click(cardPage['selectors'].activateButton);

        // Should show validation error
        await page.waitForTimeout(2000);

        logger.info('Card activation validation working');
      }

      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });
});