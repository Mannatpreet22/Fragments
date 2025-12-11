// tests/unit/delete.test.js

const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');

// Mock the Fragment class
jest.mock('../../src/model/fragment');

// Mock the hashEmail function to return the input unchanged for testing
jest.mock('../../src/hash', () => ({
  ...jest.requireActual('../../src/hash'),
  hashEmail: jest.fn((email) => email), // Return email unchanged for tests
}));

describe('DELETE /v1/fragments/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app)
      .delete('/v1/fragments/test-id-123');
    
    expect(res.statusCode).toBe(401);
    // http-auth library returns plain text "Unauthorized" for 401
    // Our middleware may not get a chance to return JSON
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .delete('/v1/fragments/test-id-123')
      .auth('invalid@email.com', 'incorrect_password');
    
    expect(res.statusCode).toBe(401);
  });

  test('returns 404 for non-existent fragment', async () => {
    Fragment.byId = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .delete('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'non-existent-id');
    expect(Fragment.delete).not.toHaveBeenCalled();
  });

  test('returns 404 for fragment belonging to different user', async () => {
    // Fragment exists but belongs to different user
    Fragment.byId = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .delete('/v1/fragments/other-user-fragment-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('successfully deletes a fragment', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 10,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);
    Fragment.delete = jest.fn().mockResolvedValue(true);

    const res = await request(app)
      .delete('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    // createSuccessResponse spreads the data, so message is at root level
    expect(res.body.message).toBe('Fragment deleted successfully');
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'test-id-123');
    expect(Fragment.delete).toHaveBeenCalledWith('user1@email.com', 'test-id-123');
  });

  test('returns 500 if deletion fails', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 10,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);
    Fragment.delete = jest.fn().mockResolvedValue(false); // Deletion failed

    const res = await request(app)
      .delete('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(500);
    expect(res.body.error.message).toBe('Failed to delete fragment');
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'test-id-123');
    expect(Fragment.delete).toHaveBeenCalledWith('user1@email.com', 'test-id-123');
  });

  test('handles errors during deletion', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 10,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
    };

    Fragment.byId = jest.fn().mockResolvedValue(mockFragment);
    Fragment.delete = jest.fn().mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .delete('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(500);
    expect(res.body.error.message).toBe('Internal server error');
  });

  test('handles errors when checking fragment existence', async () => {
    Fragment.byId = jest.fn().mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .delete('/v1/fragments/test-id-123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(500);
    expect(res.body.error.message).toBe('Internal server error');
  });
});

