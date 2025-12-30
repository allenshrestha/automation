import { defineConfig, devices } from '@playwright/test';
import { Config } from './lib/core/config';

export default defineConfig({
  testDir: './tests',
  
  // Robust boolean check for banking CI environments
  fullyParallel: !!process.env.PARALLEL && process.env.PARALLEL !== 'false',
  forbidOnly: Config.get('CI') === 'true',
  retries: Config.get('CI') === 'true' ? 2 : 1,
  workers: Config.WORKERS,
  timeout: Config.TIMEOUT,
  
  reporter: [
    ['html', { open: 'never', outputFolder: 'reports/playwright' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['list'],
  ],

  use: {
    baseURL: Config.BANNO_BASE_URL,
    // Enterprise headers for native API testing
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'X-API-Key': Config.API_KEY || '',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    headless: Config.HEADLESS,
    launchOptions: {
      slowMo: Config.SLOW_MO,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
});