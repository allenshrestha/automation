/**
 * tests/api/members/member-crud.spec.ts
 * 
 * MODERNIZED: Clean API tests without try-catch bloat
 * 
 * Tests: Create, Read, Update, Delete operations for members
 */

import { test, expect } from '@playwright/test';
import { bannoApi } from '@lib/core/api';
import { logger } from '@lib/core/logger';
import { memberSchema } from '@schemas/member.schema';

test.describe('Member API - CRUD Operations', () => {
  let createdMemberId: string;
  let authToken: string;

  test.beforeAll(async () => {
    const loginResponse = await bannoApi.post('/api/auth/login', {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
    });
    
    authToken = loginResponse.data.token;
    bannoApi.setAuthToken(authToken);
    
    logger.info('API authentication complete');
  });

  test('CREATE - should create new member', async () => {
    const memberData = {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe.${Date.now()}@example.com`,
      phone: '555-123-4567',
      dateOfBirth: '1990-01-01',
      ssn: '123-45-6789',
      address: {
        line1: '123 Main St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      },
    };
    
    const response = await bannoApi.post('/api/members', memberData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.email).toBe(memberData.email);
    
    bannoApi.validateSchema(response.data, memberSchema);
    
    createdMemberId = response.data.id;
    
    logger.info({ memberId: createdMemberId }, 'Member created successfully');
  });

  test('READ - should get member by ID', async () => {
    const response = await bannoApi.get(`/api/members/${createdMemberId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.id).toBe(createdMemberId);
    
    bannoApi.validateSchema(response.data, memberSchema);
    
    logger.info({ memberId: createdMemberId }, 'Member retrieved');
  });

  test('READ - should return 404 for non-existent member', async () => {
    const response = await bannoApi
      .get('/api/members/non-existent-id')
      .catch(e => e.response);
    
    expect(response.status).toBe(404);
    expect(response.data).toHaveProperty('error');
  });

  test('READ - should list all members', async () => {
    const response = await bannoApi.get('/api/members');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.members)).toBeTruthy();
    expect(response.data.members.length).toBeGreaterThan(0);
    
    response.data.members.forEach((member: any) => {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('email');
    });
    
    logger.info({ count: response.data.members.length }, 'Members listed');
  });

  test('READ - should support pagination', async () => {
    const page1 = await bannoApi.get('/api/members?page=1&pageSize=10');
    
    expect(page1.status).toBe(200);
    expect(page1.data.page).toBe(1);
    expect(page1.data.members.length).toBeLessThanOrEqual(10);
    
    logger.info('Pagination verified');
  });

  test('READ - should search members by email', async () => {
    const member = await bannoApi.get(`/api/members/${createdMemberId}`);
    const searchEmail = member.data.email;
    
    const response = await bannoApi.get(`/api/members?email=${searchEmail}`);
    
    expect(response.status).toBe(200);
    expect(response.data.members.length).toBeGreaterThan(0);
    
    const found = response.data.members.find((m: any) => m.id === createdMemberId);
    expect(found).toBeTruthy();
    
    logger.info({ searchEmail }, 'Search by email verified');
  });

  test('UPDATE - should update member details', async () => {
    const updates = {
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast',
      phone: '555-999-8888',
    };
    
    const response = await bannoApi.patch(`/api/members/${createdMemberId}`, updates);
    
    expect(response.status).toBe(200);
    expect(response.data.firstName).toBe(updates.firstName);
    expect(response.data.lastName).toBe(updates.lastName);
    expect(response.data.phone).toBe(updates.phone);
    
    logger.info({ updates }, 'Member updated');
  });

  test('UPDATE - should validate email format', async () => {
    const invalidUpdate = {
      email: 'invalid-email',
    };
    
    const response = await bannoApi
      .patch(`/api/members/${createdMemberId}`, invalidUpdate)
      .catch(e => e.response);
    
    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toMatch(/email|invalid/i);
  });

  test('UPDATE - should validate phone format', async () => {
    const invalidUpdate = {
      phone: '123',
    };
    
    const response = await bannoApi
      .patch(`/api/members/${createdMemberId}`, invalidUpdate)
      .catch(e => e.response);
    
    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
  });

  test('UPDATE - should not allow updating to duplicate email', async () => {
    // Create another member
    const anotherMember = await bannoApi.post('/api/members', {
      firstName: 'Jane',
      lastName: 'Smith',
      email: `jane.smith.${Date.now()}@example.com`,
      phone: '555-222-3333',
      dateOfBirth: '1992-05-15',
      ssn: '987-65-4321',
      address: {
        line1: '456 Oak Ave',
        city: 'Springfield',
        state: 'CA',
        zip: '90210',
      },
    });
    
    // Try to update first member with second member's email
    const response = await bannoApi
      .patch(`/api/members/${createdMemberId}`, {
        email: anotherMember.data.email,
      })
      .catch(e => e.response);
    
    expect(response.status).toBe(409);
    expect(response.data.error).toMatch(/email.*already.*exists/i);
    
    // Cleanup
    await bannoApi.delete(`/api/members/${anotherMember.data.id}`);
  });

  test('DELETE - should delete member', async () => {
    const response = await bannoApi.delete(`/api/members/${createdMemberId}`);
    
    expect(response.status).toBe(204);
    
    // Verify deletion
    const getResponse = await bannoApi
      .get(`/api/members/${createdMemberId}`)
      .catch(e => e.response);
    
    expect(getResponse.status).toBe(404);
    
    logger.info({ memberId: createdMemberId }, 'Member deleted');
  });

  test('DELETE - should return 404 for already deleted member', async () => {
    const response = await bannoApi
      .delete(`/api/members/${createdMemberId}`)
      .catch(e => e.response);
    
    expect(response.status).toBe(404);
  });

  test('CREATE - should validate required fields', async () => {
    const incompleteMember = {
      firstName: 'Test',
      // Missing required fields
    };
    
    const response = await bannoApi
      .post('/api/members', incompleteMember)
      .catch(e => e.response);
    
    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('error');
    expect(response.data.error).toMatch(/required/i);
  });

  test('CREATE - should validate SSN format', async () => {
    const invalidMember = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${Date.now()}@example.com`,
      phone: '555-111-2222',
      dateOfBirth: '1990-01-01',
      ssn: '123', // Invalid format
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '90210',
      },
    };
    
    const response = await bannoApi
      .post('/api/members', invalidMember)
      .catch(e => e.response);
    
    expect(response.status).toBe(400);
    expect(response.data.error).toMatch(/ssn|social security/i);
  });

  test('CREATE - should validate minimum age', async () => {
    const today = new Date();
    const tooYoung = new Date(today.getFullYear() - 10, 0, 1); // 10 years old
    
    const youngMember = {
      firstName: 'Young',
      lastName: 'Person',
      email: `young.${Date.now()}@example.com`,
      phone: '555-333-4444',
      dateOfBirth: tooYoung.toISOString().split('T')[0],
      ssn: '111-22-3333',
      address: {
        line1: '789 Youth Ave',
        city: 'Youngville',
        state: 'CA',
        zip: '90210',
      },
    };
    
    const response = await bannoApi
      .post('/api/members', youngMember)
      .catch(e => e.response);
    
    expect(response.status).toBe(400);
    expect(response.data.error).toMatch(/age|minimum/i);
  });

  test('READ - should filter members by status', async () => {
    const response = await bannoApi.get('/api/members?status=Active');
    
    expect(response.status).toBe(200);
    
    response.data.members.forEach((member: any) => {
      expect(member.status).toBe('Active');
    });
    
    logger.info('Status filter verified');
  });

  test('READ - should sort members by creation date', async () => {
    const response = await bannoApi.get('/api/members?sortBy=createdAt&order=desc');
    
    expect(response.status).toBe(200);
    
    const members = response.data.members;
    for (let i = 0; i < members.length - 1; i++) {
      const date1 = new Date(members[i].createdAt);
      const date2 = new Date(members[i + 1].createdAt);
      expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
    }
    
    logger.info('Sorting verified');
  });

  test.afterAll(async () => {
    logger.info('Member CRUD test suite completed');
  });
});