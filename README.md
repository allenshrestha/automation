## 🧪 Running Tests

# All tests
npm test

# Specific suites
npm run test:api
npm run test:e2e
npm run test:security

# With UI
npm run test:ui

# Debug mode
npm run test:debug

# Headed mode
npm run test:headed

# Generate code
npm run codegen

## 📊 Reports

# View Playwright report
npm run report

# View metrics dashboard
npm run metrics

# Health check
npm run health
```

Reports are generated in:
- `reports/playwright/` - Playwright HTML report
- `reports/metrics-dashboard.html` - Custom metrics
- `reports/results.json` - JSON results


## Core Utilities

### Config
```typescript
import { Config } from '@lib/core/config';

// Get configuration values
Config.BANNO_BASE_URL        // Base URL
Config.API_KEY               // API key
Config.TIMEOUT               // Timeout (ms)

// Helper methods
Config.get('KEY', 'fallback')           // Get env var
Config.isEnabled('feature')              // Check feature flag
Config.getSummary()                      // Get config summary
```

### Logger
```typescript
import { logger } from '@lib/core/logger';

// Log levels
logger.debug({ data }, 'Debug message');
logger.info({ data }, 'Info message');
logger.warn({ data }, 'Warning message');
logger.error({ error }, 'Error message');

// Create child logger
const testLogger = logger.child({ testName: 'my-test' });
testLogger.info('Test started');
```

### API Client
```typescript
import { bannoApi, symitarApi } from '@lib/core/api';

// HTTP methods
await bannoApi.get<User>('/users/123');
await bannoApi.post<User>('/users', userData);
await bannoApi.put<User>('/users/123', userData);
await bannoApi.patch<User>('/users/123', { status: 'active' });
await bannoApi.delete('/users/123');

// Authentication
bannoApi.setAuthToken('Bearer token');
bannoApi.removeAuthToken();

// Schema validation
bannoApi.validateSchema(response.data, userSchema);
```

### Auth
```typescript
import { Auth } from '@lib/core/auth';

// JWT operations
const token = Auth.generateToken({ userId: '123' }, '1h');
const decoded = Auth.verifyToken(token);
const payload = Auth.decodeToken(token);
const expired = Auth.isExpired(token);
const expiry = Auth.getExpiration(token);
```

### Test Data
```typescript
import { TestData } from '@lib/core/data';

// Generate data
const member = TestData.member();
const account = TestData.account();
const transaction = TestData.transaction();
const loan = TestData.loan();
const card = TestData.card();

// Batch generation
const members = TestData.batch(TestData.member, 10);

// Reproducible data
TestData.setSeed(12345);
```

### Page Helper
```typescript
import { PageHelper } from '@lib/core/page';

const helper = new PageHelper(page);

// Interactions
await helper.fill('#email', 'test@example.com');
await helper.click('button[type="submit"]');
const text = await helper.getText('.message');
const visible = await helper.isVisible('.element');

// Advanced
await helper.select('#dropdown', 'option1');
await helper.uploadFile('#file', './path/to/file');
await helper.check('#checkbox');
await helper.scrollTo('.element');
await helper.waitForNetworkIdle();
```

### Wait Utilities
```typescript
import { Wait } from '@lib/core/wait';

// Custom conditions
await Wait.forCondition(async () => {
  return await page.locator('.loaded').isVisible();
}, 30000);

// Multiple elements
await Wait.forMultipleElements(page, ['.header', '.footer']);

// API response
await Wait.forApiResponse(page, '/api/users');

// URL change
await Wait.forUrl(page, /dashboard/);
```

### Network
```typescript
import { Network } from '@lib/core/network';

// Mock responses
await Network.mock(page, '/api/users', { users: [] });

// Block resources
await Network.blockResources(page, ['image', 'font']);

// Modify headers
await Network.modifyHeaders(page, '/api/*', { 
  'X-Custom': 'value' 
});

// Capture traffic
const requests = Network.captureRequests(page, '/api/');
const responses = Network.captureResponses(page, '/api/');

// Simulate issues
await Network.simulateSlowNetwork(page, 5000);
await Network.simulateFailure(page, '/api/users');
```

### Files
```typescript
import { Files } from '@lib/core/files';

// CSV operations
const data = await Files.readCSV<Member>('./members.csv');
Files.writeCSV('./output.csv', data);

// Excel operations
const rows = await Files.readExcel('./data.xlsx', 'Sheet1');
await Files.writeExcel('./output.xlsx', rows, 'Sheet1');

// Utilities
Files.exists('./path/to/file');
Files.ensureDir('./path/to/directory');
```

### Database
```typescript
import { db } from '@lib/core/db';

// Query
const result = await db.query(
  'SELECT * FROM members WHERE id = $1',
  ['123']
);

// Transaction
await db.transaction([
  { sql: 'INSERT INTO ...', params: [...] },
  { sql: 'UPDATE ...', params: [...] }
]);

// Cleanup
await db.cleanup('test_members', "email LIKE '%@test.com'");
await db.truncate('test_table');
await db.close();
```

### Monitor
```typescript
import { monitor } from '@lib/core/monitor';

// Track tests
const tracker = monitor.trackTest('my-test');
// ... test execution ...
tracker.end('passed');  // or 'failed', error

// Get metrics
const stats = monitor.getStats();
const flaky = monitor.getFlakyTests(0.1);
const slow = monitor.getSlowestTests(5);

// Generate report
monitor.generateReport();
```

### Visual
```typescript
import { visual } from '@lib/core/visual';

// Capture & compare
await visual.capture(page, 'homepage');
const result = await visual.compare('homepage', 0.05);

if (!result.match) {
  console.log('Diff:', result.diffPath);
}

// Manage baselines
visual.updateBaseline('homepage');
visual.deleteBaseline('homepage');
```

---

// In your tests
import { TestData, TestFixtures } from '@test-data/index';

// Get specific data
const member = TestData.validMembers[0];
const account = TestData.checkingAccounts[0];
const credentials = TestData.getCredentials('valid');

// Use pre-configured scenarios
const loginScenario = TestFixtures.happyPathLogin;
const transferScenario = TestFixtures.transferScenario;

// Helper utilities
const masked = TestDataHelpers.maskAccountNumber('1234567890');
const payment = TestDataHelpers.calculateLoanPayment(25000, 4.99, 72);


