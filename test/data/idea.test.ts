import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IdeaManager } from '../../src/data/idea.js';
import { Storage } from '../../src/data/storage.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('IdeaManager', () => {
  let manager: IdeaManager;
  let storage: Storage;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `manzai-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    storage = new Storage(testDir);
    await storage.init();
    manager = new IdeaManager(storage);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create idea with auto-generated id', async () => {
    const idea = await manager.create({
      theme: '健康診断',
      angle: 'あるある',
      content: ['待ち時間が長い', 'バリウムがまずい'],
      tags: ['病院', 'あるある'],
      source: 'idea'
    });

    expect(idea.id).toMatch(/^\d{3}_健康診断$/);
    expect(idea.createdAt).toBeDefined();
  });

  it('should save and load idea', async () => {
    const idea = await manager.create({
      theme: '健康診断',
      angle: 'あるある',
      content: ['待ち時間が長い'],
      tags: ['病院'],
      source: 'idea'
    });

    const loaded = await manager.load(idea.id);
    expect(loaded).toEqual(idea);
  });

  it('should list all ideas', async () => {
    await manager.create({ theme: 'テーマ1', angle: '', content: [], tags: [], source: 'idea' });
    await manager.create({ theme: 'テーマ2', angle: '', content: [], tags: [], source: 'ogiri' });

    const list = await manager.list();
    expect(list.length).toBe(2);
  });
});
