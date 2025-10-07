// tests/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');

// Mock the Fragment class
jest.mock('../../src/model/fragment');

describe('POST /v1/fragments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Fragment.isSupportedType to return true for supported types
    Fragment.isSupportedType = jest.fn((type) => {
      const supportedTypes = ['text/plain', 'text/html', 'application/json'];
      return supportedTypes.includes(type);
    });
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('test data');
    
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password')
      .set('Content-Type', 'text/plain')
      .send('test data');
    
    expect(res.statusCode).toBe(401);
  });

  test('returns 415 for missing Content-Type header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .send('test data');
    
    expect(res.statusCode).toBe(415);
  });

  test('returns 415 for invalid Content-Type header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'invalid/type')
      .send('test data');
    
    expect(res.statusCode).toBe(415);
  });

  test('returns 415 for unsupported content type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send('test data');
    
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported content type: image/jpeg');
  });

  test('returns 400 for empty request body', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');
    
    expect(res.statusCode).toBe(400);
  });

  test('creates fragment with text/plain content', async () => {
    const mockFragment = {
      id: 'test-id-123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-123',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 9,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
      }),
      save: jest.fn().mockResolvedValue(),
    };

    Fragment.mockImplementation(() => mockFragment);

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('test data');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.id).toBe('test-id-123');
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(9);
    expect(res.headers.location).toContain('/v1/fragments/test-id-123');
    expect(mockFragment.save).toHaveBeenCalled();
  });

  test('creates fragment with text/html content', async () => {
    const mockFragment = {
      id: 'test-id-456',
      ownerId: 'user1@email.com',
      type: 'text/html',
      size: 15,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-456',
        ownerId: 'user1@email.com',
        type: 'text/html',
        size: 15,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
      }),
      save: jest.fn().mockResolvedValue(),
    };

    Fragment.mockImplementation(() => mockFragment);

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<p>test data</p>');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/html');
    expect(res.body.fragment.size).toBe(15);
    expect(res.headers.location).toContain('/v1/fragments/test-id-456');
  });

  test('creates fragment with application/json content', async () => {
    const mockFragment = {
      id: 'test-id-789',
      ownerId: 'user1@email.com',
      type: 'application/json',
      size: 17,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-789',
        ownerId: 'user1@email.com',
        type: 'application/json',
        size: 17,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
      }),
      save: jest.fn().mockResolvedValue(),
    };

    Fragment.mockImplementation(() => mockFragment);

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"test": "data"}');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
    expect(res.body.fragment.size).toBe(17);
  });

  test('handles Fragment.save() error', async () => {
    const mockFragment = {
      id: 'test-id-error',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
      toJSON: jest.fn(),
      save: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    Fragment.mockImplementation(() => mockFragment);

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('test data');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal server error');
  });

  test('uses API_URL environment variable for Location header', async () => {
    const originalApiUrl = process.env.API_URL;
    process.env.API_URL = 'https://api.example.com';

    const mockFragment = {
      id: 'test-id-env',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 9,
      created: '2023-01-01T00:00:00.000Z',
      updated: '2023-01-01T00:00:00.000Z',
      toJSON: jest.fn().mockReturnValue({
        id: 'test-id-env',
        ownerId: 'user1@email.com',
        type: 'text/plain',
        size: 9,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
      }),
      save: jest.fn().mockResolvedValue(),
    };

    Fragment.mockImplementation(() => mockFragment);

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('test data');

    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toBe('https://api.example.com/v1/fragments/test-id-env');

    // Restore original value
    if (originalApiUrl) {
      process.env.API_URL = originalApiUrl;
    } else {
      delete process.env.API_URL;
    }
  });
});