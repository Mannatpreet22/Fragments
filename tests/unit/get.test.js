// tests/unit/get.test.js

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

describe('GET /v1/fragments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password');
    expect(res.statusCode).toBe(401);
  });

  test('authenticated users get a fragments array', async () => {
    const mockFragments = [
      {
        id: 'frag1',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 10,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
        toJSON: jest.fn().mockReturnValue({
          id: 'frag1',
          ownerId: 'user1@email.com',
          type: 'text/plain',
          size: 10,
          created: '2023-01-01T00:00:00.000Z',
          updated: '2023-01-01T00:00:00.000Z',
        }),
      },
      {
        id: 'frag2',
        ownerId: 'user1@email.com',
        type: 'text/html',
        size: 20,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
        toJSON: jest.fn().mockReturnValue({
          id: 'frag2',
          ownerId: 'user1@email.com',
          type: 'text/html',
          size: 20,
          created: '2023-01-01T00:00:00.000Z',
          updated: '2023-01-01T00:00:00.000Z',
        }),
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments).toHaveLength(2);
    expect(res.body.fragments[0].id).toBe('frag1');
    expect(res.body.fragments[1].id).toBe('frag2');
    expect(Fragment.byUser).toHaveBeenCalledWith('user1@email.com', false);
  });

  test('returns empty array when user has no fragments', async () => {
    Fragment.byUser.mockResolvedValue([]);

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments).toHaveLength(0);
  });

  test('handles Fragment.byUser() error', async () => {
    Fragment.byUser.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal server error');
  });

  test('returns fragments without data when expand is not set', async () => {
    const mockFragments = [
      {
        id: 'frag1',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 10,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments[0].data).toBeUndefined();
    expect(Fragment.byUser).toHaveBeenCalledWith('user1@email.com', false);
  });

  test('returns expanded fragments with data when expand=1', async () => {
    const testData = Buffer.from('test data');
    const mockFragments = [
      {
        id: 'frag1',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 9,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
        data: testData,
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments[0].data).toBeDefined();
    expect(res.body.fragments[0].data).toBe(testData.toString('base64'));
    expect(Fragment.byUser).toHaveBeenCalledWith('user1@email.com', true);
  });

  test('returns expanded fragments with data when expand=true', async () => {
    const testData = Buffer.from('test data');
    const mockFragments = [
      {
        id: 'frag1',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 9,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
        data: testData,
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments?expand=true')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments[0].data).toBeDefined();
    expect(res.body.fragments[0].data).toBe(testData.toString('base64'));
    expect(Fragment.byUser).toHaveBeenCalledWith('user1@email.com', true);
  });

  test('returns fragments without data when expand is false', async () => {
    const mockFragments = [
      {
        id: 'frag1',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 10,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
        data: Buffer.from('test'),
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments?expand=false')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.fragments[0].data).toBeUndefined();
    expect(Fragment.byUser).toHaveBeenCalledWith('user1@email.com', false);
  });
});


