import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Storage } from '../../src/data/storage.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Storage', () => {
  let storage: Storage;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `manzai-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    storage = new Storage(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should initialize directory structure', async () => {
    await storage.init();

    const dirs = ['characters', 'ideas', 'drafts', 'scripts'];
    for (const dir of dirs) {
      const stat = await fs.stat(path.join(testDir, dir));
      expect(stat.isDirectory()).toBe(true);
    }
  });

  it('should save and load JSON file', async () => {
    await storage.init();
    const data = { test: 'value' };

    await storage.saveJson('test.json', data);
    const loaded = await storage.loadJson('test.json');

    expect(loaded).toEqual(data);
  });

  it('should return null for non-existent file', async () => {
    await storage.init();
    const result = await storage.loadJson('nonexistent.json');
    expect(result).toBeNull();
  });
});
