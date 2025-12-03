// tests/unit/fragment.test.js

const Fragment = require('../../src/model/fragment');
const data = require('../../src/model/data');
const memoryDB = require('../../src/model/data/memory/memory-db');

// Mock the data module
jest.mock('../../src/model/data');

describe('Fragment', () => {
  beforeEach(() => {
    // Clear the database before each test
    memoryDB.clear();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('creates fragment with required properties', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
      });

      expect(fragment.ownerId).toBe('user1');
      expect(fragment.type).toBe('text/plain');
      expect(fragment.size).toBe(10);
      expect(fragment.id).toBeDefined();
      expect(fragment.created).toBeDefined();
      expect(fragment.updated).toBeDefined();
      expect(fragment.data).toBeNull();
    });

    test('creates fragment with data', () => {
      const data = Buffer.from('test data');
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        data,
      });

      expect(fragment.data).toEqual(data);
    });

    test('generates unique IDs', () => {
      const fragment1 = new Fragment({ ownerId: 'user1', type: 'text/plain' });
      const fragment2 = new Fragment({ ownerId: 'user1', type: 'text/plain' });

      expect(fragment1.id).not.toBe(fragment2.id);
    });
  });

  describe('isSupportedType', () => {
    test('returns true for supported types', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true);
      expect(Fragment.isSupportedType('text/html')).toBe(true);
      expect(Fragment.isSupportedType('text/css')).toBe(true);
      expect(Fragment.isSupportedType('text/javascript')).toBe(true);
      expect(Fragment.isSupportedType('application/json')).toBe(true);
      expect(Fragment.isSupportedType('text/markdown')).toBe(true);
      expect(Fragment.isSupportedType('text/xml')).toBe(true);
      expect(Fragment.isSupportedType('application/xml')).toBe(true);
    });

    test('returns false for unsupported types', () => {
      expect(Fragment.isSupportedType('image/jpeg')).toBe(false);
      expect(Fragment.isSupportedType('video/mp4')).toBe(false);
      expect(Fragment.isSupportedType('application/pdf')).toBe(false);
      expect(Fragment.isSupportedType('text/csv')).toBe(false);
      expect(Fragment.isSupportedType('')).toBe(false);
    });
  });

  describe('getExtension', () => {
    test('returns correct extensions for supported types', () => {
      expect(Fragment.getExtension('text/plain')).toBe('.txt');
      expect(Fragment.getExtension('text/html')).toBe('.html');
      expect(Fragment.getExtension('text/css')).toBe('.css');
      expect(Fragment.getExtension('text/javascript')).toBe('.js');
      expect(Fragment.getExtension('application/json')).toBe('.json');
      expect(Fragment.getExtension('text/markdown')).toBe('.md');
      expect(Fragment.getExtension('text/xml')).toBe('.xml');
      expect(Fragment.getExtension('application/xml')).toBe('.xml');
    });

    test('returns .txt for unknown types', () => {
      expect(Fragment.getExtension('unknown/type')).toBe('.txt');
    });
  });

  describe('save', () => {
    test('saves fragment without data', async () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 0,
      });

      data.writeFragment.mockResolvedValue({ id: fragment.id, ownerId: 'user1', type: 'text/plain', size: 0 });

      const result = await fragment.save();

      expect(data.writeFragment).toHaveBeenCalledWith({
        id: fragment.id,
        ownerId: 'user1',
        type: 'text/plain',
        size: 0,
        created: fragment.created,
        updated: fragment.updated,
      });
      expect(result).toBe(fragment);
    });

    test('saves fragment with data', async () => {
      const dataBuffer = Buffer.from('test data');
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        data: dataBuffer,
      });

      data.writeFragment.mockResolvedValue({ id: fragment.id, ownerId: 'user1', type: 'text/plain', size: 10 });
      data.writeFragmentData.mockResolvedValue({ id: fragment.id, data: dataBuffer });

      const result = await fragment.save();

      expect(data.writeFragment).toHaveBeenCalled();
      expect(data.writeFragmentData).toHaveBeenCalledWith('user1', fragment.id, dataBuffer);
      expect(result).toBe(fragment);
    });
  });

  describe('byId', () => {
    test('returns null for non-existent fragment', async () => {
      data.readFragment.mockResolvedValue(null);

      const result = await Fragment.byId('user1', 'non-existent-id');

      expect(result).toBeNull();
      expect(data.readFragment).toHaveBeenCalledWith('user1', 'non-existent-id');
    });

    test('returns fragment for existing ID', async () => {
      const fragmentData = {
        id: 'test-id',
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        created: '2023-01-01T00:00:00.000Z',
        updated: '2023-01-01T00:00:00.000Z',
      };

      data.readFragment.mockResolvedValue(fragmentData);

      const result = await Fragment.byId('user1', 'test-id');

      expect(result).toBeInstanceOf(Fragment);
      expect(result.id).toBe('test-id');
      expect(result.ownerId).toBe('user1');
      expect(result.type).toBe('text/plain');
      expect(result.size).toBe(10);
    });
  });

  describe('byIdData', () => {
    test('returns null for non-existent fragment data', async () => {
      data.readFragmentData.mockResolvedValue(null);

      const result = await Fragment.byIdData('user1', 'non-existent-id');

      expect(result).toBeNull();
      expect(data.readFragmentData).toHaveBeenCalledWith('user1', 'non-existent-id');
    });

    test('returns data for existing fragment', async () => {
      const dataBuffer = Buffer.from('test data');
      data.readFragmentData.mockResolvedValue(dataBuffer);

      const result = await Fragment.byIdData('user1', 'test-id');

      expect(result).toEqual(dataBuffer);
      expect(data.readFragmentData).toHaveBeenCalledWith('user1', 'test-id');
    });
  });

  describe('byUser', () => {
    test('returns fragments without data by default', async () => {
      // When expand=false, listFragments returns objects with id, created, updated
      const fragments = [
        { id: 'frag1', created: '2023-01-01T00:00:00.000Z', updated: '2023-01-01T00:00:00.000Z' },
        { id: 'frag2', created: '2023-01-01T00:00:00.000Z', updated: '2023-01-01T00:00:00.000Z' },
      ];

      data.listFragments.mockResolvedValue(fragments);

      const result = await Fragment.byUser('user1');

      expect(result).toEqual(fragments);
      expect(data.listFragments).toHaveBeenCalledWith('user1', false);
    });

    test('returns fragments with data when expand is true', async () => {
      const fragments = [
        { id: 'frag1', ownerId: 'user1', type: 'text/plain', size: 10 },
        { id: 'frag2', ownerId: 'user1', type: 'text/html', size: 20 },
      ];

      const data1 = Buffer.from('data1');
      const data2 = Buffer.from('data2');

      data.listFragments.mockResolvedValue(fragments);
      data.readFragmentData
        .mockResolvedValueOnce(data1)
        .mockResolvedValueOnce(data2);

      const result = await Fragment.byUser('user1', true);

      expect(result).toHaveLength(2);
      expect(result[0].data).toEqual(data1);
      expect(result[1].data).toEqual(data2);
      expect(data.readFragmentData).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    test('returns false for non-existent fragment', async () => {
      data.deleteFragment.mockResolvedValue(false);

      const result = await Fragment.delete('user1', 'non-existent-id');

      expect(result).toBe(false);
      expect(data.deleteFragment).toHaveBeenCalledWith('user1', 'non-existent-id');
    });

    test('returns true for existing fragment', async () => {
      data.deleteFragment.mockResolvedValue(true);

      const result = await Fragment.delete('user1', 'test-id');

      expect(result).toBe(true);
      expect(data.deleteFragment).toHaveBeenCalledWith('user1', 'test-id');
    });
  });

  describe('setData', () => {
    test('sets data and updates size and timestamp', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 0,
      });

      const data = Buffer.from('test data');
      const originalUpdated = fragment.updated;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        fragment.setData(data);

        expect(fragment.data).toEqual(data);
        expect(fragment.size).toBe(data.length);
        expect(fragment.updated).not.toBe(originalUpdated);
      }, 10);
    });

    test('throws error for non-Buffer data', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 0,
      });

      expect(() => fragment.setData('not a buffer')).toThrow('Data must be a Buffer');
      expect(() => fragment.setData(123)).toThrow('Data must be a Buffer');
      expect(() => fragment.setData({})).toThrow('Data must be a Buffer');
    });
  });

  describe('getData', () => {
    test('returns existing data', async () => {
      const data = Buffer.from('test data');
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        data,
      });

      const result = await fragment.getData();

      expect(result).toEqual(data);
    });

    test('loads data from database when not in memory', async () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
      });

      const dataBuffer = Buffer.from('test data');
      data.readFragmentData.mockResolvedValue(dataBuffer);

      const result = await fragment.getData();

      expect(result).toEqual(dataBuffer);
      expect(fragment.data).toEqual(dataBuffer);
      expect(data.readFragmentData).toHaveBeenCalledWith('user1', fragment.id);
    });

    test('returns null when no data exists', async () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 0,
      });

      data.readFragmentData.mockResolvedValue(null);

      const result = await fragment.getData();

      expect(result).toBeNull();
    });
  });

  describe('toJSON', () => {
    test('returns JSON representation without data', () => {
      const fragment = new Fragment({
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        data: Buffer.from('test data'),
      });

      const json = fragment.toJSON();

      expect(json).toEqual({
        id: fragment.id,
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        created: fragment.created,
        updated: fragment.updated,
      });
      expect(json.data).toBeUndefined();
    });
  });
});
