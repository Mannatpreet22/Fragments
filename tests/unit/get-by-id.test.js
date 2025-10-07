// tests/unit/get-by-id.test.js

const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');

// Mock the Fragment class
jest.mock('../../src/model/fragment');

describe('GET /v1/fragments/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get('/v1/fragments/test-id');
    
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('invalid@email.com', 'incorrect_password');
    
    expect(res.statusCode).toBe(401);
  });

  test('returns 404 for non-existent fragment', async () => {
    Fragment.byId.mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'non-existent-id');
  });

  test('returns 404 when fragment data is not found', async () => {
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      getData: jest.fn().mockResolvedValue(null),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment data not found');
    expect(mockFragment.getData).toHaveBeenCalled();
  });

  test('returns fragment data for text/plain content', async () => {
    const testData = Buffer.from('Hello, World!');
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 13,
      getData: jest.fn().mockResolvedValue(testData),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.headers['content-length']).toBe('13');
    expect(res.text).toBe('Hello, World!');
    expect(Fragment.byId).toHaveBeenCalledWith('user1@email.com', 'test-id');
    expect(mockFragment.getData).toHaveBeenCalled();
  });

  test('returns fragment data for text/html content', async () => {
    const testData = Buffer.from('<h1>Hello, World!</h1>');
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'text/html',
      size: 22,
      getData: jest.fn().mockResolvedValue(testData),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/html');
    expect(res.headers['content-length']).toBe('22');
    expect(res.text).toBe('<h1>Hello, World!</h1>');
  });

  test('returns fragment data for application/json content', async () => {
    const testData = Buffer.from('{"message": "Hello, World!"}');
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'application/json',
      size: 28,
      getData: jest.fn().mockResolvedValue(testData),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');
    expect(res.headers['content-length']).toBe('28');
    expect(res.text).toBe('{"message": "Hello, World!"}');
  });

  test('handles Fragment.byId() error', async () => {
    Fragment.byId.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal server error');
  });

  test('handles Fragment.getData() error', async () => {
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      getData: jest.fn().mockRejectedValue(new Error('Data retrieval error')),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal server error');
  });

  test('returns binary data correctly', async () => {
    const testData = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello" in binary
    const mockFragment = {
      id: 'test-id',
      ownerId: 'user1@email.com',
      type: 'application/octet-stream',
      size: 5,
      getData: jest.fn().mockResolvedValue(testData),
    };

    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app)
      .get('/v1/fragments/test-id')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/octet-stream');
    expect(res.headers['content-length']).toBe('5');
    expect(res.body).toEqual(testData);
  });
});