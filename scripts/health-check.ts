import { Config } from '../lib/core/config';
import { logger } from '../lib/core/logger';
import { db } from '../lib/core/db';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * FRAMEWORK HEALTH CHECK - MODERNIZED FOR 2025
 * 
 * Validates framework setup and dependencies before running tests.
 * 
 * Usage:
 * npm run health-check
 * 
 * Exit codes:
 * 0 = All checks passed
 * 1 = One or more errors found
 */

async function runHealthCheck(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 FRAMEWORK HEALTH CHECK');
  console.log('='.repeat(60) + '\n');

  const checks: HealthCheck[] = [];

  // Run all checks
  checks.push(checkConfiguration());
  checks.push(await checkDatabase());
  checks.push(await checkAPIConnectivity());
  checks.push(checkFileSystem());
  checks.push(checkDependencies());

  // Display results
  displayResults(checks);

  // Display configuration summary
  displayConfigSummary();

  // Exit with appropriate code
  const errorCount = checks.filter((c) => c.status === 'error').length;
  process.exit(errorCount > 0 ? 1 : 0);
}

/**
 * Display check results in a formatted table
 */
function displayResults(checks: HealthCheck[]): void {
  checks.forEach((check) => {
    const icon = getStatusIcon(check.status);
    console.log(`${icon} ${check.name}: ${check.message}`);
    
    if (check.details) {
      Object.entries(check.details).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
  });

  // Summary
  const okCount = checks.filter((c) => c.status === 'ok').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const errorCount = checks.filter((c) => c.status === 'error').length;

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${okCount}  ⚠️  Warnings: ${warningCount}  ❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Get status icon for display
 */
function getStatusIcon(status: 'ok' | 'warning' | 'error'): string {
  const icons = {
    ok: '✅',
    warning: '⚠️',
    error: '❌'
  };
  return icons[status];
}

/**
 * Display active configuration summary
 */
function displayConfigSummary(): void {
  const summary = Config.getSummary();
  console.log('📊 Active Configuration:');
  console.log(`   Environment: ${summary.environment}`);
  console.log(`   Base URL: ${summary.baseUrl || 'Not configured'}`);
  console.log(`   Enabled Features: ${summary.enabledFeatures.join(', ') || 'Core only'}`);
  console.log('\n');
}

/**
 * Check 1: Configuration validation
 */
function checkConfiguration(): HealthCheck {
  if (!Config.BANNO_BASE_URL) {
    return {
      name: 'Configuration',
      status: 'error',
      message: 'BANNO_BASE_URL not configured in .env',
    };
  }

  if (!Config.API_KEY && !Config.USERNAME) {
    return {
      name: 'Configuration',
      status: 'warning',
      message: 'No authentication configured (API_KEY or USERNAME/PASSWORD)',
    };
  }

  return {
    name: 'Configuration',
    status: 'ok',
    message: 'Configuration loaded successfully',
    details: {
      'Base URL': Config.BANNO_BASE_URL,
      'Environment': Config.ENVIRONMENT,
      'Log Level': Config.LOG_LEVEL,
    },
  };
}

/**
 * Check 2: Database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  if (!Config.DB_HOST || !Config.DB_NAME) {
    return {
      name: 'Database',
      status: 'warning',
      message: 'Database not configured (optional for most tests)',
    };
  }

  try {
    await db.query('SELECT 1 as health_check');
    return {
      name: 'Database',
      status: 'ok',
      message: 'Database connection successful',
      details: {
        'Host': Config.DB_HOST,
        'Database': Config.DB_NAME,
        'Port': Config.DB_PORT.toString(),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      name: 'Database',
      status: 'error',
      message: 'Database connection failed',
      details: {
        'Error': errorMessage,
        'Host': Config.DB_HOST,
      },
    };
  }
}

/**
 * Check 3: API connectivity
 */
async function checkAPIConnectivity(): Promise<HealthCheck> {
  if (!Config.BANNO_BASE_URL) {
    return {
      name: 'API Connectivity',
      status: 'warning',
      message: 'Base URL not configured',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(Config.BANNO_BASE_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Consider 200, 401, 403 as "reachable" since the server responded
    if (response.ok || response.status === 401 || response.status === 403) {
      return {
        name: 'API Connectivity',
        status: 'ok',
        message: 'API endpoint is reachable',
        details: {
          'Status': response.status.toString(),
          'URL': Config.BANNO_BASE_URL,
        },
      };
    }

    return {
      name: 'API Connectivity',
      status: 'warning',
      message: `API returned unexpected status: ${response.status}`,
      details: {
        'URL': Config.BANNO_BASE_URL,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      name: 'API Connectivity',
      status: 'error',
      message: 'API endpoint unreachable',
      details: {
        'Error': errorMessage,
        'URL': Config.BANNO_BASE_URL,
      },
    };
  }
}

/**
 * Check 4: File system structure
 */
function checkFileSystem(): HealthCheck {
  const requiredDirs = ['tests', 'lib', 'schemas', 'test-data'];
  const missingDirs: string[] = [];

  requiredDirs.forEach((dir) => {
    try {
      const fs = require('fs');
      fs.accessSync(dir);
    } catch {
      missingDirs.push(dir);
    }
  });

  if (missingDirs.length > 0) {
    return {
      name: 'File System',
      status: 'error',
      message: 'Required directories are missing',
      details: {
        'Missing': missingDirs.join(', '),
        'Action': 'Create missing directories or check working directory',
      },
    };
  }

  return {
    name: 'File System',
    status: 'ok',
    message: 'All required directories present',
    details: {
      'Checked': requiredDirs.join(', '),
    },
  };
}

/**
 * Check 5: NPM dependencies
 */
function checkDependencies(): HealthCheck {
  const requiredDeps = [
    '@playwright/test',
    'dotenv',
    'pino',
    'ajv',
    '@faker-js/faker',
  ];

  const missingDeps: string[] = [];

  requiredDeps.forEach((dep) => {
    try {
      require.resolve(dep);
    } catch {
      missingDeps.push(dep);
    }
  });

  if (missingDeps.length > 0) {
    return {
      name: 'Dependencies',
      status: 'error',
      message: 'Required NPM packages are missing',
      details: {
        'Missing': missingDeps.join(', '),
        'Fix': 'Run: npm install',
      },
    };
  }

  return {
    name: 'Dependencies',
    status: 'ok',
    message: 'All core dependencies installed',
    details: {
      'Checked': `${requiredDeps.length} packages`,
    },
  };
}

// Run health check
runHealthCheck().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('❌ Health check failed with unexpected error:', errorMessage);
  logger.error({ error: errorMessage }, 'Health check crashed');
  process.exit(1);
});