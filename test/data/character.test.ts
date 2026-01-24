import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CharacterManager } from '../../src/data/character.js';
import { Storage } from '../../src/data/storage.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('CharacterManager', () => {
  let manager: CharacterManager;
  let storage: Storage;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `manzai-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    storage = new Storage(testDir);
    await storage.init();
    manager = new CharacterManager(storage);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should save and load character config', async () => {
    const config = {
      combiName: 'テストコンビ',
      boke: {
        name: '田中',
        personality: '天然',
        speechStyle: '敬語',
        catchphrase: 'なるほど〜'
      },
      tsukkomi: {
        name: '山田',
        personality: '常識人',
        speechStyle: '関西弁',
        catchphrase: 'なんでやねん'
      }
    };

    await manager.save('default', config);
    const loaded = await manager.load('default');

    expect(loaded).toEqual(config);
  });

  it('should return null for non-existent character', async () => {
    const result = await manager.load('nonexistent');
    expect(result).toBeNull();
  });

  it('should list all characters', async () => {
    const config = {
      combiName: 'テスト',
      boke: { name: 'A', personality: '', speechStyle: '' },
      tsukkomi: { name: 'B', personality: '', speechStyle: '' }
    };

    await manager.save('char1', config);
    await manager.save('char2', config);

    const list = await manager.list();
    expect(list).toContain('char1');
    expect(list).toContain('char2');
  });
});
