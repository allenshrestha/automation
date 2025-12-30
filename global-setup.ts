import { FullConfig } from '@playwright/test';
import { logger } from './lib/core/logger';
import { Config } from './lib/core/config';
import { Files } from './lib/core/files';

/**
 * Runs once before all tests
 * - Verify environment configuration
 * - Check connectivity
 * - Initialize required directories
 * - Display configuration summary
 */

async function globalSetup(config: FullConfig) {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SYMITAR/BANNO AUTOMATION FRAMEWORK');
  console.log('='.repeat(60) + '\n');

  // Display configuration summary
  const summary = Config.getSummary();
  logger.info({ summary }, 'Framework configuration loaded');

  console.log('📊 Configuration Summary:');
  console.log(`   Environment: ${summary.environment}`);
  console.log(`   Base URL: ${summary.baseUrl || 'Not configured'}`);
  
  // Verify connectivity
  if (Config.BANNO_BASE_URL) {
    try {
      const response = await fetch(Config.BANNO_BASE_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok || response.status === 401 || response.status === 403) {
        console.log('✅ Test environment is reachable');
        logger.info('Environment connectivity verified');
      }
    } catch (error) {
      console.warn('⚠️  Cannot reach test environment - tests may fail');
      logger.warn('⚠️  Cannot reach test environment - tests may fail');
    }
  } else {
    console.warn('⚠️  Cannot reach environment');
  }

  // Ensure required directories exist
  const directories = [
    'screenshots/baseline',
    'screenshots/actual',
    'screenshots/diff',
    'metrics',
    'reports',
    'test-data',
  ];

  directories.forEach((dir) => {
    Files.ensureDir(dir);
  });

  console.log('\n✨ Setup complete - starting tests...\n');

  return () => {
    logger.info('Global setup completed successfully');
  };
}

export default globalSetup;