import { APIRequestContext, request, APIResponse, BrowserContext } from '@playwright/test';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { Config } from './config';
import { logger } from './logger';

/**
 * Enhanced response type that combines Playwright's APIResponse with Axios-like properties
 */
interface EnhancedAPIResponse extends APIResponse {
  data: any;
  status: number;
}

/**
 * Axios-compatible error structure
 */
interface ApiError extends Error {
  response?: {
    status: number;
    data: any;
    statusText?: string;
  };
  config?: {
    method?: string;
    url?: string;
  };
}

/**
 * Request options
 */
interface RequestOptions {
  params?: Record<string, any>;
  retries?: number;
  timeout?: number;
}

/**
 * API CLIENT (Playwright-based with Smart Retry & Session Sharing)
 * 
 * Features:
 * - Unified trace visibility with Playwright tests
 * - Automatic cookie/session sharing with browser contexts
 * - Smart retry logic with exponential backoff
 * - Axios-compatible interface for easy migration
 * - Schema validation with AJV
 * - Comprehensive logging with performance tracking
 * - Auto-correlation IDs for distributed tracing
 * 
 * Usage:
 * const api = new ApiClient('https://api.example.com', 'MyAPI');
 * const response = await api.get('/users');
 * console.log(response.data); // Axios-style access
 * 
 * // Bind to browser for session sharing (login bypass)
 * await api.bindToContext(browserContext);
 */
export class ApiClient {
  private ajv: Ajv;
  private requestContext: APIRequestContext | null = null;
  private readonly name: string;
  private authToken?: string;
  private baseURL: string;
  private customHeaders: Record<string, string> = {};
  private initializationPromise: Promise<void> | null = null;
  private timeout: number;
  private defaultRetries: number = 2;
  private boundToBrowser: boolean = false;

  constructor(
    baseURL: string, 
    name: string = 'API',
    timeout: number = Config.TIMEOUT || 30000
  ) {
    this.name = name;
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    
    logger.debug({ client: this.name, baseURL }, 'ApiClient initialized');
  }

  /**
   * Lazy initialization of Playwright request context
   * Ensures context is created only when needed and reused across requests
   */
  private async ensureContext(): Promise<APIRequestContext> {
    if (this.requestContext) {
      return this.requestContext;
    }

    // Prevent multiple simultaneous initializations
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeContext();
    }

    await this.initializationPromise;
    return this.requestContext!;
  }

  /**
   * Initialize the Playwright request context with all headers
   */
  private async initializeContext(): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      };

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      this.requestContext = await request.newContext({
        baseURL: this.baseURL,
        extraHTTPHeaders: headers,
        timeout: this.timeout,
      });

      logger.debug({ client: this.name }, 'Request context created');
    } catch (error: any) {
      logger.error({ client: this.name, error: error.message }, 'Failed to create request context');
      throw error;
    }
  }

  /**
   * Reset the request context (used when auth token or headers change)
   */
  private resetContext(): void {
    // Don't reset if bound to browser context
    if (this.boundToBrowser) {
      logger.debug({ client: this.name }, 'Context bound to browser, skipping reset');
      return;
    }

    if (this.requestContext) {
      this.requestContext.dispose().catch(err => {
        logger.warn({ client: this.name, error: err.message }, 'Error disposing request context');
      });
    }
    this.requestContext = null;
    this.initializationPromise = null;
  }

  /**
   * Bind API client to browser context for automatic session/cookie sharing
   * This is the "login bypass" feature - login via API, use session in browser
   * 
   * @param context - Playwright BrowserContext
   * 
   * Example:
   * await api.post('/login', { username, password });
   * await api.bindToContext(browserContext);
   * // Browser now has the session cookies!
   */
  async bindToContext(context: BrowserContext): Promise<void> {
    this.requestContext = context.request;
    this.boundToBrowser = true;
    logger.info({ client: this.name }, 'API client bound to browser context for session sharing');
  }

  /**
   * Unbind from browser context
   */
  unbindFromContext(): void {
    this.boundToBrowser = false;
    this.resetContext();
    logger.debug({ client: this.name }, 'API client unbound from browser context');
  }

  /**
   * Execute request with automatic retry logic for transient failures
   * Implements exponential backoff for 429 (rate limit) and 5xx (server errors)
   */
  private async executeWithRetry(
    action: () => Promise<APIResponse>,
    maxRetries: number,
    method: string,
    url: string
  ): Promise<APIResponse> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await action();
        const status = response.status();

        // Check if we should retry (rate limit or server errors)
        const shouldRetry = (status === 429 || status >= 500) && attempt < maxRetries;

        if (shouldRetry) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          logger.warn({
            client: this.name,
            method,
            url,
            status,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            retryIn: `${delay}ms`
          }, 'Retrying request due to transient error');

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Success or non-retryable error
        return response;

      } catch (error: any) {
        lastError = error;

        // Only retry on network errors if we have attempts left
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn({
            client: this.name,
            method,
            url,
            error: error.message,
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            retryIn: `${delay}ms`
          }, 'Retrying request due to network error');

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // No more retries, throw the error
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Generate correlation ID for request tracing
   */
  private generateCorrelationId(): string {
    return `${this.name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generic request method with comprehensive logging and error handling
   */
  private async executeRequest(
    method: string, 
    url: string, 
    data?: any,
    options: RequestOptions = {}
  ): Promise<EnhancedAPIResponse> {
    const ctx = await this.ensureContext();
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    const retries = options.retries ?? this.defaultRetries;

    // Build full URL with query params if provided
    let fullUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      fullUrl = `${url}${url.includes('?') ? '&' : '?'}${searchParams.toString()}`;
    }

    // Add correlation ID header for distributed tracing
    const requestHeaders = {
      'X-Correlation-ID': correlationId,
      'X-Request-Start': startTime.toString(),
    };

    logger.debug({ 
      client: this.name, 
      method, 
      url: fullUrl,
      correlationId,
      hasData: !!data,
      retries,
    }, 'API Request');

    // Execute request with retry logic
    const response = await this.executeWithRetry(
      async () => {
        switch (method.toUpperCase()) {
          case 'GET':
            return await ctx.get(fullUrl, { headers: requestHeaders });
          case 'POST':
            return await ctx.post(fullUrl, { data, headers: requestHeaders });
          case 'PUT':
            return await ctx.put(fullUrl, { data, headers: requestHeaders });
          case 'PATCH':
            return await ctx.patch(fullUrl, { data, headers: requestHeaders });
          case 'DELETE':
            return await ctx.delete(fullUrl, { headers: requestHeaders });
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }
      },
      retries,
      method,
      fullUrl
    );

    const duration = Date.now() - startTime;
    const status = response.status();

    // Parse response body intelligently based on content type
    let responseData: any = null;
    const contentType = response.headers()['content-type'] || '';
    
    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('text/')) {
        responseData = await response.text();
      } else if (contentType.includes('application/pdf') || 
                 contentType.includes('application/octet-stream') ||
                 contentType.includes('image/')) {
        // Binary content (PDFs, images, etc.)
        responseData = await response.body();
        logger.debug({ client: this.name, contentType }, 'Binary content received');
      } else {
        responseData = await response.body();
      }
    } catch (parseError) {
      logger.warn({ 
        client: this.name, 
        url: fullUrl,
        contentType,
        error: 'Failed to parse response body' 
      });
      responseData = null;
    }

    // Log response with performance metrics
    logger.info({
      client: this.name,
      method,
      url: response.url(),
      status,
      correlationId,
      duration: `${duration}ms`,
      contentType,
      responseSize: typeof responseData === 'string' ? responseData.length : 
                    responseData instanceof Buffer ? responseData.length : 
                    'N/A'
    }, 'API Response');

    // Handle error status codes (4xx, 5xx)
    if (status >= 400) {
      const error: ApiError = new Error(`Request failed with status ${status}`) as ApiError;
      error.response = {
        status,
        data: responseData,
        statusText: response.statusText(),
      };
      error.config = { method, url: fullUrl };

      logger.error({
        client: this.name,
        method,
        url: response.url(),
        status,
        correlationId,
        data: responseData,
        duration: `${duration}ms`,
      }, 'API Response Error');

      throw error;
    }

    // Create enhanced response with Axios-compatible properties
    const enhancedResponse = response as EnhancedAPIResponse;
    enhancedResponse.data = responseData;

    // Add status as a regular property for backward compatibility
    Object.defineProperty(enhancedResponse, 'status', {
      value: status,
      writable: false,
      enumerable: true,
    });

    return enhancedResponse;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<EnhancedAPIResponse> {
    return this.executeRequest('GET', url, undefined, { params });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any): Promise<EnhancedAPIResponse> {
    return this.executeRequest('POST', url, data);
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<EnhancedAPIResponse> {
    return this.executeRequest('PUT', url, data);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any): Promise<EnhancedAPIResponse> {
    return this.executeRequest('PATCH', url, data);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string): Promise<EnhancedAPIResponse> {
    return this.executeRequest('DELETE', url);
  }

  /**
   * Set default number of retries for all requests
   */
  setDefaultRetries(retries: number): void {
    this.defaultRetries = retries;
    logger.debug({ client: this.name, retries }, 'Default retries updated');
  }

  /**
   * Set authentication token and reset context
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.resetContext();
    logger.debug({ client: this.name }, 'Auth token set');
  }

  /**
   * Remove authentication token and reset context
   */
  removeAuthToken(): void {
    this.authToken = undefined;
    this.resetContext();
    logger.debug({ client: this.name }, 'Auth token removed');
  }

  /**
   * Set custom header and reset context
   */
  setHeader(key: string, value: string): void {
    this.customHeaders[key] = value;
    this.resetContext();
    logger.debug({ client: this.name, header: key }, 'Custom header set');
  }

  /**
   * Remove custom header and reset context
   */
  removeHeader(key: string): void {
    delete this.customHeaders[key];
    this.resetContext();
    logger.debug({ client: this.name, header: key }, 'Custom header removed');
  }

  /**
   * Get the underlying Playwright request context
   * Useful for advanced scenarios
   */
  async getContext(): Promise<APIRequestContext> {
    return this.ensureContext();
  }

  /**
   * Validate response data against JSON schema
   * 
   * @throws Error if validation fails
   * @returns true if validation passes
   * 
   * Example:
   * api.validateSchema(response.data, memberSchema);
   */
  validateSchema<T>(data: T, schema: JSONSchemaType<T>): boolean {
    const validate = this.ajv.compile(schema);
    const valid = validate(data);
    
    if (!valid) {
      const errors = validate.errors || [];
      logger.error({
        client: this.name,
        errors,
        dataPreview: JSON.stringify(data).substring(0, 200),
      }, 'Schema validation failed');
      
      throw new Error(
        `Schema validation failed: ${JSON.stringify(errors, null, 2)}`
      );
    }
    
    logger.debug({ client: this.name }, 'Schema validation passed');
    return true;
  }

  /**
   * Dispose of the request context
   * Call this in test cleanup to prevent resource leaks
   */
  async dispose(): Promise<void> {
    if (this.requestContext && !this.boundToBrowser) {
      await this.requestContext.dispose();
      this.requestContext = null;
      this.initializationPromise = null;
      logger.debug({ client: this.name }, 'Request context disposed');
    } else if (this.boundToBrowser) {
      logger.debug({ client: this.name }, 'Skipping disposal - bound to browser context');
    }
  }
}

// ✅ READY-TO-USE CLIENT INSTANCES
export const bannoApi = new ApiClient(Config.BANNO_API_URL, 'Banno');
export const symitarApi = new ApiClient(Config.SYMITAR_API_URL, 'Symitar');