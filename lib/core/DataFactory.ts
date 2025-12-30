import { faker } from '@faker-js/faker';
import { logger } from './logger';

/**
 * DATA FACTORY - DYNAMIC TEST DATA GENERATOR
 * 
 * Purpose: Generate random, unique test data on-the-fly
 * Use when: You need fresh data for each test run (no conflicts)
 * 
 * Examples:
 * - New user registration
 * - Duplicate email/phone testing
 * - Load testing (1000+ unique users)
 */
export class DataFactory {
  /**
   * Generate member data
   */
  static member(override = {}) {
    return {
      id: faker.string.uuid(),
      accountNumber: faker.string.numeric(12),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number('###-###-####'),
      ssn: faker.string.numeric(9),
      dateOfBirth: this.formatDateForAPI(faker.date.birthdate({ min: 18, max: 80, mode: 'age' })),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode('#####'),
        country: 'USA',
      },
      memberSince: faker.date.past({ years: 10 }),
      status: faker.helpers.arrayElement(['Active', 'Inactive', 'Suspended']),
      ...override
    };
  }

  /**
   * Generate account data
   */
  static account(override = {}) {
    const balance = parseFloat(faker.finance.amount({ min: 100, max: 50000, dec: 2 }));
    return {
      accountNumber: faker.string.numeric(12),
      accountType: faker.helpers.arrayElement(['Checking', 'Savings', 'Money Market', 'CD']),
      balance,
      availableBalance: balance * 0.95,
      interestRate: parseFloat(faker.finance.amount({ min: 0.01, max: 5.0, dec: 2 })),
      openDate: this.formatDateForAPI(faker.date.past({ years: 5 })),
      status: faker.helpers.arrayElement(['Active', 'Frozen', 'Closed']),
      routingNumber: '123456789',
      currency: 'USD',
      ...override
    };
  }

  /**
   * Generate transaction data
   */
  static transaction(accountNumber?: string) {
    return {
      transactionId: faker.string.uuid(),
      accountNumber: accountNumber || faker.string.numeric(12),
      type: faker.helpers.arrayElement(['Deposit', 'Withdrawal', 'Transfer', 'Fee', 'Interest']),
      amount: parseFloat(faker.finance.amount({ min: 1, max: 5000, dec: 2 })),
      description: faker.finance.transactionDescription(),
      date: faker.date.recent({ days: 30 }),
      balance: parseFloat(faker.finance.amount({ min: 100, max: 50000, dec: 2 })),
      status: faker.helpers.arrayElement(['Posted', 'Pending', 'Voided']),
      merchant: faker.company.name(),
      category: faker.helpers.arrayElement(['Groceries', 'Gas', 'Dining', 'Shopping', 'Bills']),
    };
  }

  /**
   * Generate loan data
   */
  static loan() {
    const principal = parseFloat(faker.finance.amount({ min: 5000, max: 500000, dec: 2 }));
    return {
      loanNumber: faker.string.numeric(10),
      loanType: faker.helpers.arrayElement(['Auto', 'Personal', 'Mortgage', 'Credit Card', 'Home Equity']),
      principal,
      balance: principal * faker.number.float({ min: 0.3, max: 0.95 }),
      interestRate: parseFloat(faker.finance.amount({ min: 3.0, max: 18.0, dec: 2 })),
      monthlyPayment: parseFloat(faker.finance.amount({ min: 100, max: 3000, dec: 2 })),
      originationDate: faker.date.past({ years: 5 }),
      maturityDate: faker.date.future({ years: 10 }),
      status: faker.helpers.arrayElement(['Current', 'Delinquent', 'Paid Off', 'Default']),
      nextPaymentDue: faker.date.soon({ days: 30 }),
    };
  }

  /**
   * Generate card data
   */
  static card() {
    const futureDate = faker.date.future({ years: 4 });
    return {
      cardNumber: faker.finance.creditCardNumber(),
      cvv: faker.finance.creditCardCVV(),
      expiryMonth: futureDate.getMonth() + 1,
      expiryYear: futureDate.getFullYear(),
      cardType: faker.helpers.arrayElement(['Visa', 'Mastercard', 'Amex', 'Discover']),
      cardholderName: faker.person.fullName(),
      status: faker.helpers.arrayElement(['Active', 'Blocked', 'Expired']),
    };
  }

  /**
   * Generate payee data
   */
  static payee() {
    return {
      payeeId: faker.string.uuid(),
      name: faker.company.name(),
      nickname: faker.company.buzzNoun(),
      accountNumber: faker.finance.accountNumber(10),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode('#####'),
      },
      phone: faker.phone.number('###-###-####'),
      category: faker.helpers.arrayElement(['Utilities', 'Credit Cards', 'Insurance', 'Housing']),
      status: 'Active',
    };
  }

  /**
   * Generate batch of data
   */
  static batch<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }

  /**
   * Set seed for reproducible data
   */
  static setSeed(seed: number) {
    faker.seed(seed);
    logger.debug({ seed }, 'Faker seed set');
  }

  /**
   * Internal helper: Format dates for API (YYYY-MM-DD)
   */
  private static formatDateForAPI(date: Date): string {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}