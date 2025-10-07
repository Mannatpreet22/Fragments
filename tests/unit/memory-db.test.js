// tests/unit/memory-db.test.js

const memoryDB = require('../../src/model/data/memory/memory-db');

describe('MemoryDB', () => {
  beforeEach(() => {
    // Clear the database before each test
    memoryDB.clear();
  });

  describe('get', () => {
    test('returns null for non-existent fragment', () => {
      const result = memoryDB.get('non-existent-id');
      expect(result).toBeNull();
    });

    test('returns fragment for existing ID', () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = memoryDB.get('test-id');
      expect(result).toEqual(fragment);
    });
  });

  describe('set', () => {
    test('stores and returns fragment', () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      const result = memoryDB.set('test-id', fragment);
      
      expect(result).toEqual(fragment);
      expect(memoryDB.get('test-id')).toEqual(fragment);
    });

    test('overwrites existing fragment', () => {
      const fragment1 = { ownerId: 'user1', type: 'text/plain', size: 10 };
      const fragment2 = { ownerId: 'user1', type: 'text/html', size: 20 };
      
      memoryDB.set('test-id', fragment1);
      memoryDB.set('test-id', fragment2);
      
      const result = memoryDB.get('test-id');
      expect(result).toEqual(fragment2);
    });
  });

  describe('delete', () => {
    test('returns false for non-existent fragment', () => {
      const result = memoryDB.delete('non-existent-id');
      expect(result).toBe(false);
    });

    test('deletes existing fragment and returns true', () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = memoryDB.delete('test-id');
      expect(result).toBe(true);
      expect(memoryDB.get('test-id')).toBeNull();
    });
  });

  describe('getByOwner', () => {
    test('returns empty array for non-existent owner', () => {
      const result = memoryDB.getByOwner('non-existent-user');
      expect(result).toEqual([]);
    });

    test('returns fragments for specific owner', () => {
      const fragment1 = { ownerId: 'user1', type: 'text/plain', size: 10 };
      const fragment2 = { ownerId: 'user1', type: 'text/html', size: 20 };
      const fragment3 = { ownerId: 'user2', type: 'text/plain', size: 15 };
      
      memoryDB.set('frag1', fragment1);
      memoryDB.set('frag2', fragment2);
      memoryDB.set('frag3', fragment3);
      
      const result = memoryDB.getByOwner('user1');
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'frag1', ...fragment1 });
      expect(result).toContainEqual({ id: 'frag2', ...fragment2 });
    });
  });

  describe('has', () => {
    test('returns false for non-existent fragment', () => {
      const result = memoryDB.has('non-existent-id');
      expect(result).toBe(false);
    });

    test('returns true for existing fragment', () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      const result = memoryDB.has('test-id');
      expect(result).toBe(true);
    });
  });

  describe('getAll', () => {
    test('returns empty array when no fragments', () => {
      const result = memoryDB.getAll();
      expect(result).toEqual([]);
    });

    test('returns all fragments with IDs', () => {
      const fragment1 = { ownerId: 'user1', type: 'text/plain', size: 10 };
      const fragment2 = { ownerId: 'user2', type: 'text/html', size: 20 };
      
      memoryDB.set('frag1', fragment1);
      memoryDB.set('frag2', fragment2);
      
      const result = memoryDB.getAll();
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 'frag1', ...fragment1 });
      expect(result).toContainEqual({ id: 'frag2', ...fragment2 });
    });
  });

  describe('clear', () => {
    test('removes all fragments', () => {
      const fragment = { ownerId: 'user1', type: 'text/plain', size: 10 };
      memoryDB.set('test-id', fragment);
      
      expect(memoryDB.size()).toBe(1);
      memoryDB.clear();
      expect(memoryDB.size()).toBe(0);
      expect(memoryDB.get('test-id')).toBeNull();
    });
  });

  describe('size', () => {
    test('returns 0 for empty database', () => {
      expect(memoryDB.size()).toBe(0);
    });

    test('returns correct count after adding fragments', () => {
      memoryDB.set('frag1', { ownerId: 'user1', type: 'text/plain', size: 10 });
      memoryDB.set('frag2', { ownerId: 'user1', type: 'text/html', size: 20 });
      
      expect(memoryDB.size()).toBe(2);
    });
  });
});