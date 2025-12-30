import { Pool, QueryResult, PoolClient } from 'pg';
import { Config } from './config';
import { logger } from './logger';

/**
 * DATABASE HELPER
 * 
 * Features:
 * - PostgreSQL connection pooling
 * - Query execution
 * - Transactions
 * - Cleanup utilities
 * 
 * Usage:
 * const result = await db.query('SELECT * FROM users WHERE id = $1', ['123']);
 * await db.cleanup('test_users');
 */

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: Config.DB_HOST,
      port: Config.DB_PORT,
      database: Config.DB_NAME,
      user: Config.DB_USER,
      password: Config.DB_PASSWORD,
      max: 10, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('connect', () => {
      logger.debug('Database client connected');
    });

    this.pool.on('error', (err) => {
      logger.error({ error: err.message }, 'Database pool error');
    });
  }

  /**
   * Execute SQL query
   */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      logger.debug({ sql, params }, 'Executing query');
      const start = Date.now();
      const result = await client.query(sql, params);
      const duration = Date.now() - start;
      logger.debug({ rows: result.rowCount, duration }, 'Query completed');
      return result;
    } catch (error: any) {
      logger.error({ sql, params, error: error.message }, 'Query failed');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(queries: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      logger.debug({ queryCount: queries.length }, 'Transaction started');

      const results: QueryResult[] = [];
      for (const { sql, params } of queries) {
        const result = await client.query(sql, params);
        results.push(result);
      }

      await client.query('COMMIT');
      logger.info({ queryCount: queries.length }, 'Transaction committed');
      return results;
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error({ error: error.message }, 'Transaction rolled back');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Clean up test data from table
   */
  async cleanup(table: string, condition?: string) {
    const sql = condition 
      ? `DELETE FROM ${table} WHERE ${condition}` 
      : `DELETE FROM ${table}`;
    
    const result = await this.query(sql);
    logger.info({ table, condition, deleted: result.rowCount }, 'Table cleaned');
  }

  /**
   * Truncate table (faster than DELETE)
   */
  async truncate(table: string) {
    await this.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    logger.info({ table }, 'Table truncated');
  }

  /**
   * Close all connections
   */
  async close() {
    await this.pool.end();
    logger.info('Database connections closed');
  }

  /**
   * Get client for manual transaction control
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }
}

export const db = new Database();