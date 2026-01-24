import { Storage } from './storage.js';
import type { CombiConfig } from '../types/index.js';

export class CharacterManager {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async save(name: string, config: CombiConfig): Promise<void> {
    await this.storage.saveJson(`characters/${name}.json`, config);
  }

  async load(name: string): Promise<CombiConfig | null> {
    return this.storage.loadJson<CombiConfig>(`characters/${name}.json`);
  }

  async list(): Promise<string[]> {
    const files = await this.storage.listFiles('characters', '.json');
    return files.map(f => f.replace('.json', ''));
  }

  async exists(name: string): Promise<boolean> {
    return this.storage.exists(`characters/${name}.json`);
  }
}
