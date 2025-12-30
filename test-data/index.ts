/**
 * TEST DATA INDEX - UNIFIED ACCESS POINT
 * 
 * This file provides BOTH:
 * 1. Static test data (from JSON files) - Same data every run
 * 2. Dynamic generators (via DataFactory) - Fresh data every run
 */

import * as path from 'path';
import * as fs from 'fs';
import { DataFactory } from '@lib/core/DataFactory'; // ✅ FIXED import path

// Import all static test data
import membersData from './members.json';
import accountsData from './accounts.json';
import transactionsData from './transactions.json';
import transfersData from './transfers.json';
import billpayData from './billpay.json';
import statementsData from './statements.json';
import loansData from './loans.json';
import cardsData from './cards.json';
import alertsData from './alerts.json';
import settingsData from './settings.json';

/**
 * TEST DATA - UNIFIED ACCESS
 * 
 * Usage Examples:
 * 
 * // Static data (same every time)
 * const member = TestData.validMembers[0];
 * const account = TestData.checkingAccounts[0];
 * 
 * // Dynamic data (random every time)
 * const newMember = TestData.generate.member();
 * const newAccount = TestData.generate.account();
 */
export class TestData {
  // ========================================
  // DYNAMIC GENERATORS (Fresh data each run)
  // ========================================
  static get generate() {
    return DataFactory;
  }

  // ========================================
  // STATIC DATA (Same data every run)
  // ========================================
  
  // Members
  static get members() { return membersData; }
  static get validMembers() { return membersData.validMembers; }
  static get inactiveMembers() { return membersData.inactiveMembers; }
  static get credentials() { return membersData.credentials; }

  // Accounts
  static get accounts() { return accountsData; }
  static get checkingAccounts() { return accountsData.checkingAccounts; }
  static get savingsAccounts() { return accountsData.savingsAccounts; }
  static get cdAccounts() { return accountsData.cdAccounts; }
  static get moneyMarketAccounts() { return accountsData.moneyMarketAccounts || []; }

  // Transactions
  static get transactions() { return transactionsData; }
  static get deposits() { return transactionsData.deposits; }
  static get withdrawals() { return transactionsData.withdrawals; }

  // Transfers
  static get internalTransfers() { return transfersData.internalTransfers; }
  static get externalTransfers() { return transfersData.externalTransfers; }
  static get wireTransfers() { return transfersData.wireTransfers; }

  // Bill Pay
  static get billpay() { return billpayData; }
  static get payees() { return billpayData.payees; }
  static get payments() { return billpayData.payments; }
  static get recurringPayments() { return billpayData.recurringPayments; }

  // Statements
  static get statements() { return statementsData.statements; }
  static get taxDocuments() { return statementsData.taxDocuments; }

  // Loans
  static get loans() { return loansData; }
  static get autoLoans() { return loansData.autoLoans; }
  static get personalLoans() { return loansData.personalLoans; }
  static get mortgages() { return loansData.mortgages; }
  static get creditCards() { return loansData.creditCards; }

  // Cards
  static get cards() { return cardsData; }
  static get debitCards() { return cardsData.debitCards; }

  // Alerts
  static get alerts() { return alertsData; }
  static get accountAlerts() { return alertsData.accountAlerts; }
  static get securityAlerts() { return alertsData.securityAlerts; }

  // Settings
  static get settings() { return settingsData; }
  static get userProfiles() { return settingsData.userProfiles; }
  static get securitySettings() { return settingsData.securitySettings; }

  // ========================================
  // SEARCH & LOOKUP METHODS
  // ========================================

  static getMemberByAccountNumber(accountNumber: string) {
    return this.validMembers.find(m => m.accountNumber === accountNumber);
  }

  static getAccountByNumber(accountNumber: string) {
    const allAccounts = [
      ...this.checkingAccounts,
      ...this.savingsAccounts,
      ...this.cdAccounts,
      ...this.moneyMarketAccounts
    ];
    return allAccounts.find(a => a.accountNumber === accountNumber);
  }

  static getAccountsByMember(memberNumber: string) {
    const allAccounts = [
      ...this.checkingAccounts,
      ...this.savingsAccounts,
      ...this.cdAccounts,
      ...this.moneyMarketAccounts
    ];
    return allAccounts.filter(a => a.memberNumber === memberNumber);
  }

  static getTransactionsByAccount(accountNumber: string) {
    const allTransactions: any[] = [
      ...this.deposits,
      ...this.withdrawals,
      ...this.internalTransfers,
      ...(transactionsData.fees || []),
      ...(transactionsData.interest || [])
    ];

    return allTransactions.filter(t => 
      t.accountNumber === accountNumber || 
      t.fromAccount === accountNumber || 
      t.toAccount === accountNumber
    );
  }

  // ========================================
  // RANDOMIZED ACCESS
  // ========================================

  static getRandomMember() {
    const members = this.validMembers;
    return members[Math.floor(Math.random() * members.length)];
  }

  static getRandomCheckingAccount() {
    const accounts = this.checkingAccounts;
    return accounts[Math.floor(Math.random() * accounts.length)];
  }

  static getCredentials(type: 'valid' | 'invalid' | 'admin' | 'teller' = 'valid') {
    const credMap = {
      valid: this.credentials.validUser,
      invalid: this.credentials.invalidUser,
      admin: this.credentials.adminUser,
      teller: this.credentials.tellerUser
    };
    return credMap[type];
  }

  // ========================================
  // CUSTOM DATA PERSISTENCE
  // ========================================

  static saveCustomData(filename: string, data: any) {
    const filePath = path.join(__dirname, 'custom', `${filename}.json`);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  static loadCustomData(filename: string) {
    const filePath = path.join(__dirname, 'custom', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }

  static cleanupCustomData() {
    const customDir = path.join(__dirname, 'custom');
    if (fs.existsSync(customDir)) {
      fs.readdirSync(customDir).forEach(file => 
        fs.unlinkSync(path.join(customDir, file))
      );
    }
  }
}

/**
 * TEST DATA HELPERS - UTILITY FUNCTIONS
 * 
 * Banking calculations, formatting, masking, validation
 */
export class TestDataHelpers {
  // ID Generation
  static generateAccountNumber(): string {
    return `${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(0, 12);
  }

  static generateTransactionId(type: string = 'TXN'): string {
    return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  static generateConfirmationNumber(): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CONF-${date}-${random}`;
  }

  // Formatting
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  }

  static formatDate(date: Date | string, format: string = 'MM/DD/YYYY'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    
    const formats: Record<string, string> = {
      'MM/DD/YYYY': `${mm}/${dd}/${yyyy}`,
      'YYYY-MM-DD': `${yyyy}-${mm}-${dd}`,
      'DD/MM/YYYY': `${dd}/${mm}/${yyyy}`
    };
    
    return formats[format] || formats['MM/DD/YYYY'];
  }

  // Banking Calculations
  static calculateInterest(principal: number, rate: number, days: number = 30): number {
    return principal * (rate / 100 / 365) * days;
  }

  static calculateLoanPayment(principal: number, annualRate: number, months: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment * 100) / 100;
  }

  // Masking
  static maskAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/\d(?=\d{4})/g, '*');
  }

  static maskSSN(ssn: string): string {
    return ssn.replace(/\d(?=\d{4})/g, '*');
  }

  static maskCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }

  // Validation
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPhone(phone: string): boolean {
    return /^\d{3}-\d{3}-\d{4}$/.test(phone);
  }

  static isValidSSN(ssn: string): boolean {
    return /^\d{3}-\d{2}-\d{4}$/.test(ssn);
  }

  static isValidZip(zip: string): boolean {
    return /^\d{5}$/.test(zip);
  }
}

/**
 * TEST FIXTURES - PRE-CONFIGURED SCENARIOS
 * 
 * Common test scenarios ready to use
 */
export class TestFixtures {
  static get happyPathLogin() {
    return {
      credentials: TestData.getCredentials('valid'),
      expectedMember: TestData.getMemberByAccountNumber('100000000001'),
      expectedAccounts: TestData.getAccountsByMember('100000000001')
    };
  }

  static get accountWithTransactions() {
    const account = TestData.getRandomCheckingAccount();
    return {
      account,
      transactions: TestData.getTransactionsByAccount(account.accountNumber),
      member: TestData.getMemberByAccountNumber(account.memberNumber)
    };
  }

  static get transferScenario() {
    const member = TestData.validMembers[0];
    const accounts = TestData.getAccountsByMember(member.accountNumber);
    return {
      member,
      fromAccount: accounts[0],
      toAccount: accounts[1] || accounts[0], // Fallback if only one account
      amount: 500.00
    };
  }

  static get billPaymentScenario() {
    return {
      member: TestData.validMembers[0],
      account: TestData.checkingAccounts[0],
      payee: TestData.payees[0],
      amount: 125.50
    };
  }

  static get lowBalanceScenario() {
    return {
      account: {
        ...TestData.checkingAccounts[0],
        balance: 50.00,
        availableBalance: 50.00
      },
      threshold: 100.00,
      alert: TestData.accountAlerts.find(a => a.alertType === 'Low Balance')
    };
  }
}

// Default export
export default TestData;