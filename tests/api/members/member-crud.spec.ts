import { test, expect } from '@playwright/test';
import { bannoApi } from '@lib/core/api';
import { TestData } from '@lib/core/data';
import { monitor } from '@lib/core/monitor';
import { logger } from '@lib/core/logger';
import { memberSchema } from '@schemas/member.schema';

/**
 * MEMBER API - CRUD OPERATIONS
 * 
 * Tests: Create, Read, Update, Delete operations for members
 * Keywords: api, crud, member, validation
 * Priority: P0 (Critical Path)
 */

test.describe('Member API - CRUD Operations', () => {
  let createdMemberId: string;

  test.beforeAll(async () => {
    logger.info('Starting Member CRUD test suite');
  });

  test('CREATE - should create new member', async () => {
    const tracker = monitor.trackTest('member-create');
    
    try {
      const memberData = TestData.member();
      
      const response = await bannoApi.post('/api/members', memberData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.email).toBe(memberData.email);
      
      // Validate schema
      bannoApi.validateSchema(response.data, memberSchema);
      
      // Store for other tests
      createdMemberId = response.data.id;
      
      logger.info({ memberId: createdMemberId }, 'Member created successfully');
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('READ - should get member by ID', async () => {
    const tracker = monitor.trackTest('member-read');
    
    try {
      const response = await bannoApi.get(`/api/members/${createdMemberId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(createdMemberId);
      
      // Validate schema
      bannoApi.validateSchema(response.data, memberSchema);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('READ - should return 404 for non-existent member', async () => {
    const tracker = monitor.trackTest('member-read-404');
    
    try {
      const response = await bannoApi.get('/api/members/non-existent-id').catch(e => e.response);
      
      expect(response.status).toBe(404);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('UPDATE - should update member details', async () => {
    const tracker = monitor.trackTest('member-update');
    
    try {
      const updates = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
      };
      
      const response = await bannoApi.patch(`/api/members/${createdMemberId}`, updates);
      
      expect(response.status).toBe(200);
      expect(response.data.firstName).toBe(updates.firstName);
      expect(response.data.lastName).toBe(updates.lastName);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test('DELETE - should delete member', async () => {
    const tracker = monitor.trackTest('member-delete');
    
    try {
      const response = await bannoApi.delete(`/api/members/${createdMemberId}`);
      
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await bannoApi.get(`/api/members/${createdMemberId}`).catch(e => e.response);
      expect(getResponse.status).toBe(404);
      
      tracker.end('passed');
    } catch (error: any) {
      tracker.end('failed', error);
      throw error;
    }
  });

  test.afterAll(async () => {
    logger.info('Member CRUD test suite completed');
  });
});