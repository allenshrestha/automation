import jwt from 'jsonwebtoken';
import { Config } from './config';
import { logger } from './logger';

/**
 * AUTHENTICATION HELPER
 * 
 * 
 * Features:
 * - JWT token generation
 * - Token verification
 * - Token decoding
 * - Expiration checking
 * 
 * Usage:
 * const token = Auth.generateToken({ userId: '123' });
 * const decoded = Auth.verifyToken(token);
 * const isExpired = Auth.isExpired(token);
 */

export class Auth {
  /**
   * Generate JWT token
   * 
   * @param payload - Data to encode in token
   * @param expiresIn - Expiration time (e.g., '1h', '7d')
   */
  static generateToken(payload: object, expiresIn: string = '1h'): string {
    try {
      const token = jwt.sign(payload, Config.JWT_SECRET, { expiresIn });
      logger.debug({ expiresIn }, 'JWT token generated');
      return token;
    } catch (error: any) {
      logger.error({ error: error.message }, 'JWT generation failed');
      throw error;
    }
  }

  /**
   * Verify and decode JWT token
   * 
   * @param token - Token to verify
   * @returns Decoded payload
   */
  static verifyToken(token: string): any {
    try {
      const decoded = jwt.verify(token, Config.JWT_SECRET);
      logger.debug('JWT token verified');
      return decoded;
    } catch (error: any) {
      logger.error({ error: error.message }, 'JWT verification failed');
      throw error;
    }
  }

  /**
   * Decode JWT token without verification
   * 
   * @param token - Token
   * * Decode JWT token without verification
   * 
   * @param token - Token to decode
   * @returns Decoded payload or null
   */
  static decodeToken(token: string): any {
    try {
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error: any) {
      logger.error({ error: error.message }, 'JWT decode failed');
      return null;
    }
  }

  /**
   * Check if token is expired
   * 
   * @param token - Token to check
   * @returns True if expired
   */
  static isExpired(token: string): boolean {
    try {
      const decoded: any = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      const isExpired = Date.now() >= decoded.exp * 1000;
      logger.debug({ expired: isExpired }, 'Token expiration checked');
      return isExpired;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   * 
   * @param token - Token to check
   * @returns Expiration date or null
   */
  static getExpiration(token: string): Date | null {
    try {
      const decoded: any = jwt.decode(token);
      if (!decoded || !decoded.exp) return null;
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }
}