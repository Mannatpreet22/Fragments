// tests/unit/memory.test.js

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');
const memoryDB = require('../../src/model/data/memory/memory-db');

describe('Memory Data Layer', () => {
  beforeEach(() => {
    // Clear the database before each test
    memoryDB.clear();
  });

  describe('readFragment', () => {
    test('returns null for non-existent fragment', async () => {
      const result = await readFragment('user1', 'non-existent-id');
      expect(result).toBeNull();
    });

    test('returns null for fragment with different owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = await readFragment('user2', 'test-id');
      expect(result).toBeNull();
    });

    test('returns fragment for correct owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = await readFragment('user1', 'test-id');
      expect(result).toEqual({ id: 'test-id', ...fragment });
    });
  });

  describe('writeFragment', () => {
    test('writes and returns fragment', async () => {
      const fragment = { id: 'test-id', ownerId: 'user1', type: 'text/plain', size: 10 };
      
      const result = await writeFragment(fragment);
      expect(result).toEqual(fragment);
      
      const stored = memoryDB.get('test-id');
      expect(stored).toEqual({ ownerId: 'user1', type: 'text/plain', size: 10 });
    });

    test('overwrites existing fragment', async () => {
      const fragment1 = { id: 'test-id', ownerId: 'user1', type: 'text/plain', size: 10 };
      const fragment2 = { id: 'test-id', ownerId: 'user1', type: 'text/html', size: 20 };
      
      await writeFragment(fragment1);
      const result = await writeFragment(fragment2);
      
      expect(result).toEqual(fragment2);
      expect(memoryDB.get('test-id')).toEqual({ ownerId: 'user1', type: 'text/html', size: 20 });
    });
  });

  describe('readFragmentData', () => {
    test('returns null for non-existent fragment', async () => {
      const result = await readFragmentData('user1', 'non-existent-id');
      expect(result).toBeNull();
    });

    test('returns null for fragment with different owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10, data: Buffer.from('test') };
      memoryDB.set('test-id', fragment);
      
      const result = await readFragmentData('user2', 'test-id');
      expect(result).toBeNull();
    });

    test('returns null for fragment without data', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = await readFragmentData('user1', 'test-id');
      expect(result).toBeNull();
    });

    test('returns data for correct owner', async () => {
      const data = Buffer.from('test data');
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10, data };
      memoryDB.set('test-id', fragment);
      
      const result = await readFragmentData('user1', 'test-id');
      expect(result).toEqual(data);
    });
  });

  describe('writeFragmentData', () => {
    test('throws error for non-existent fragment', async () => {
      const data = Buffer.from('test data');
      
      await expect(writeFragmentData('user1', 'non-existent-id', data))
        .rejects.toThrow('Fragment not found');
    });

    test('throws error for fragment with different owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const data = Buffer.from('test data');
      
      await expect(writeFragmentData('user2', 'test-id', data))
        .rejects.toThrow('Fragment owner mismatch');
    });

    test('writes data for correct owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const data = Buffer.from('test data');
      const result = await writeFragmentData('user1', 'test-id', data);
      
      expect(result.data).toEqual(data);
      expect(result.size).toBe(data.length);
      
      const stored = memoryDB.get('test-id');
      expect(stored.data).toEqual(data);
      expect(stored.size).toBe(data.length);
    });
  });

  describe('listFragments', () => {
    test('returns empty array for non-existent owner', async () => {
      const result = await listFragments('non-existent-user');
      expect(result).toEqual([]);
    });

    test('returns fragments for specific owner', async () => {
      const fragment1 = { ownerId: 'user1', type: 'text/plain', size: 10 };
      const fragment2 = { ownerId: 'user1', type: 'text/html', size: 20 };
      const fragment3 = { ownerId: 'user2', type: 'text/plain', size: 15 };
      
      memoryDB.set('frag1', fragment1);
      memoryDB.set('frag2', fragment2);
      memoryDB.set('frag3', fragment3);
      
      // When expand=true, returns full fragment objects
      const result = await listFragments('user1', true);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'frag1', ...fragment1 });
      expect(result).toContainEqual({ id: 'frag2', ...fragment2 });
    });
  });

  describe('deleteFragment', () => {
    test('returns false for non-existent fragment', async () => {
      const result = await deleteFragment('user1', 'non-existent-id');
      expect(result).toBe(false);
    });

    test('returns false for fragment with different owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = await deleteFragment('user2', 'test-id');
      expect(result).toBe(false);
      expect(memoryDB.has('test-id')).toBe(true);
    });

    test('deletes fragment for correct owner', async () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = await deleteFragment('user1', 'test-id');
      expect(result).toBe(true);
      expect(memoryDB.has('test-id')).toBe(false);
    });
  });
});
