import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { Config } from './config';
import { logger } from './logger';

/**
 * API CLIENT
 * 
 * Features:
 * - HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Schema validation with AJV
 * - Request/response logging
 * - Token authentication
 * - Timeout handling
 * 
 * Usage:
 * const api = new ApiClient('https://api.example.com');
 * const response = await api.get('/users');
 * api.validateSchema(response.data, userSchema);
 */

export class ApiClient {
  private client: AxiosInstance;
  private ajv: Ajv;
  private readonly name: string;

  constructor(baseURL: string, name: string = 'API') {
    this.name = name;
    this.client = axios.create({
      baseURL,
      timeout: Config.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug({
          client: this.name,
          method: config.method?.toUpperCase(),
          url: config.url,
        }, 'API Request');
        return config;
      },
      (error) => {
        logger.error({ client: this.name, error: error.message }, 'API Request Error');
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug({
          client: this.name,
          status: response.status,
          url: response.config.url,
          duration: response.headers['x-response-time'] || 'N/A',
        }, 'API Response');
        return response;
      },
      (error) => {
        logger.error({
          client: this.name,
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data,
        }, 'API Response Error');
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    logger.debug({ client: this.name }, 'Auth token set');
  }

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
    logger.debug({ client: this.name }, 'Auth token removed');
  }

  /**
   * Set custom header
   */
  setHeader(key: string, value: string) {
    this.client.defaults.headers.common[key] = value;
  }

  /**
   * Validate response against JSON schema
   * 
   * Example:
   * api.validateSchema(response.data, memberSchema);
   */
  validateSchema<T>(data: T, schema: JSONSchemaType<T>): boolean {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      logger.error({
        client: this.name,
        errors: validate.errors,
      }, 'Schema validation failed');
      throw new Error(`Schema validation failed: ${JSON.stringify(validate.errors)}`);
    }
    
    logger.debug({ client: this.name }, 'Schema validation passed');
    return valid;
  }
}

// ✅ READY-TO-USE CLIENT INSTANCES
export const bannoApi = new ApiClient(Config.BANNO_API_URL, 'Banno');
export const symitarApi = new ApiClient(Config.SYMITAR_API_URL, 'Symitar');