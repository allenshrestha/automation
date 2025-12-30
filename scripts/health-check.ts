import { Config } from '../lib/core/config';
import { logger } from '../lib/core/logger';
import { db } from '../lib/core/db';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

async function runHealthCheck() {
  console.log('\n' + '='.repeat(60));
  console.log('🏥 FRAMEWORK HEALTH CHECK');
  console.log('='.repeat(60) + '\n');

  const checks: HealthCheck[] = [];

  // Check 1: Configuration
  checks.push(checkConfiguration());

  // Check 2: Database
  checks.push(await checkDatabase());

  // Check 3: API Connectivity
  checks.push(await checkAPIConnectivity());

  // Check 5: File System
  checks.push(checkFileSystem());

  // Check 6: Dependencies
  checks.push(checkDependencies());

  // Display results
  checks.forEach((check) => {
    const icon = check.status === 'ok' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
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

  // Configuration Summary
  const summary = Config.getSummary();
  console.log('📊 Active Configuration:');
  console.log(`   Environment: ${summary.environment}`);
  console.log(`   Base URL: ${summary.baseUrl || 'Not configured'}`);
  console.log(`   Enabled Features: ${summary.enabledFeatures.join(', ') || 'Core only'}`);

  console.log('\n');

  // Exit code
  process.exit(errorCount > 0 ? 1 : 0);
}

function checkConfiguration(): HealthCheck {
  if (!Config.BANNO_BASE_URL) {
    return {
      name: 'Configuration',
      status: 'error',
      message: 'BANNO_BASE_URL not configured',
    };
  }

  if (!Config.API_KEY && !Config.USERNAME) {
    return {
      name: 'Configuration',
      status: 'warning',
      message: 'No authentication configured',
    };
  }

  return {
    name: 'Configuration',
    status: 'ok',
    message: 'Configuration loaded',
    details: {
      'Base URL': Config.BANNO_BASE_URL,
      'Environment': Config.ENVIRONMENT,
    },
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  if (!Config.DB_HOST || !Config.DB_NAME) {
    return {
      name: 'Database',
      status: 'warning',
      message: 'Database not configured (optional)',
    };
  }

  try {
    await db.query('SELECT 1');
    return {
      name: 'Database',
      status: 'ok',
      message: 'Database connected',
      details: {
        'Host': Config.DB_HOST,
        'Database': Config.DB_NAME,
      },
    };
  } catch (error: any) {
    return {
      name: 'Database',
      status: 'error',
      message: 'Database connection failed',
      details: {
        'Error': error.message,
      },
    };
  }
}

async function checkAPIConnectivity(): Promise<HealthCheck> {
  if (!Config.BANNO_BASE_URL) {
    return {
      name: 'API Connectivity',
      status: 'warning',
      message: 'Base URL not configured',
    };
  }

  try {
    const response = await fetch(Config.BANNO_BASE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok || response.status === 401 || response.status === 403) {
      return {
        name: 'API Connectivity',
        status: 'ok',
        message: 'API reachable',
        details: {
          'Status': response.status,
          'URL': Config.BANNO_BASE_URL,
        },
      };
    }

    return {
      name: 'API Connectivity',
      status: 'warning',
      message: `API returned ${response.status}`,
    };
  } catch (error: any) {
    return {
      name: 'API Connectivity',
      status: 'error',
      message: 'API unreachable',
      details: {
        'Error': error.message,
      },
    };
  }
}

function checkFileSystem(): HealthCheck {
  const requiredDirs = ['tests', 'lib', 'schemas'];
  const missing = requiredDirs.filter((dir) => {
    try {
      require('fs').accessSync(dir);
      return false;
    } catch {
      return true;
    }
  });

  if (missing.length > 0) {
    return {
      name: 'File System',
      status: 'error',
      message: 'Missing directories',
      details: {
        'Missing': missing.join(', '),
      },
    };
  }

  return {
    name: 'File System',
    status: 'ok',
    message: 'All required directories present',
  };
}

function checkDependencies(): HealthCheck {
  const required = [
    '@playwright/test',
    'axios',
    'dotenv',
    'pino',
  ];

  const missing = required.filter((dep) => {
    try {
      require.resolve(dep);
      return false;
    } catch {
      return true;
    }
  });

  if (missing.length > 0) {
    return {
      name: 'Dependencies',
      status: 'error',
      message: 'Missing dependencies',
      details: {
        'Missing': missing.join(', '),
        'Fix': 'Run: npm install',
      },
    };
  }

  return {
    name: 'Dependencies',
    status: 'ok',
    message: 'All core dependencies installed',
  };
}

// Run health check
runHealthCheck().catch((error) => {
  console.error('Health check failed:', error);
  process.exit(1);
});