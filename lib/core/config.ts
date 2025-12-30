import dotenv from 'dotenv';

dotenv.config();

/**
 * CONFIGURATION MANAGER
 * Centralized configuration for test automation
 */
export class Config {
  // Application URLs
  static readonly BANNO_BASE_URL = process.env.BANNO_BASE_URL || '';
  static readonly BANNO_API_URL = process.env.BANNO_API_URL || '';
  static readonly SYMITAR_API_URL = process.env.SYMITAR_API_URL || '';
  
  // Authentication
  static readonly API_KEY = process.env.API_KEY || '';
  static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
  static readonly USERNAME = process.env.USERNAME || '';
  static readonly PASSWORD = process.env.PASSWORD || '';
  
  // Database
  static readonly DB_HOST = process.env.DB_HOST || 'localhost';
  static readonly DB_PORT = parseInt(process.env.DB_PORT || '5432');
  static readonly DB_NAME = process.env.DB_NAME || '';
  static readonly DB_USER = process.env.DB_USER || '';
  static readonly DB_PASSWORD = process.env.DB_PASSWORD || '';
  
  // Test Configuration
  static readonly TIMEOUT = parseInt(process.env.TIMEOUT || '30000');
  static readonly HEADLESS = process.env.HEADLESS !== 'false';
  static readonly SLOW_MO = parseInt(process.env.SLOW_MO || '0');
  static readonly LOG_LEVEL = process.env.LOG_LEVEL || 'info';
  static readonly WORKERS = parseInt(process.env.WORKERS || '1');
  static readonly CI = process.env.CI || 'false';
  static readonly ENVIRONMENT = process.env.ENVIRONMENT || 'development';
  
  // Feature Flags
  static readonly ENABLE_SECURITY = process.env.ENABLE_SECURITY === 'true';
  
  static get(key: string, fallback: string = ''): string {
    return process.env[key] || fallback;
  }
  
  static getSummary() {
    return {
      environment: this.ENVIRONMENT,
      baseUrl: this.BANNO_BASE_URL,
      enabledFeatures: [
        this.ENABLE_SECURITY && 'Security Testing',
      ].filter(Boolean),
    };
  }
}