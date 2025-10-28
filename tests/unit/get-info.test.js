// tests/unit/get-info.test.js

const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');

// Mock the Fragment class
jest.mock('../../src/model/fragment');

// Mock the hashEmail function to return the input unchanged for testing
jest.mock('../../src/hash', () => ({
  ...jest.requireActual('../../src/hash'),
  hashEmail: jest.fn((email) => email),
}));

describe('GET /v1/fragments/:id/info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/test-id/info');
    
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments/test-id/info')
      .auth('invalid@email.com', 'incorrect_password');
    
    expect(res.statusCode).toBe(401);
  });

  test('returns 404 for non-existent fragment', async () => {
    Fragment.byId.mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/fragments/non-existent-id/info')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'non-existent-id');
  });

  test('returns fragment metadata for text/plain content', async () => {
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 13,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 13,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      }),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id/info')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toEqual({
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 13,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
    });
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'test-id');
    expect(mockFragment.toJSON).toHaveBeenCalled();
  });

  test('returns fragment metadata for application/json content', async () => {
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'application/json',
      size: 28,
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id',
        ownerId: 'user1@email.com',
        type: 'application/json',
        size: 28,
        created: '2024-01-01T00:00:00.000Z',
        updated: '2024-01-01T00:00:00.000Z',
      }),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id/info')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
  });

  test('handles Fragment.byId() error', async () => {
    Fragment.byId.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .get('/v1/fragments/test-id/info')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal server error');
  });
});

