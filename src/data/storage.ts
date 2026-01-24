import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class Storage {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? path.join(os.homedir(), '.manzai');
  }

  async init(): Promise<void> {
    const dirs = ['characters', 'ideas', 'drafts', 'scripts'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.baseDir, dir), { recursive: true });
    }
  }

  async saveJson<T>(relativePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.baseDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async loadJson<T>(relativePath: string): Promise<T | null> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dir: string, extension?: string): Promise<string[]> {
    const fullPath = path.join(this.baseDir, dir);
    try {
      const files = await fs.readdir(fullPath);
      if (extension) {
        return files.filter(f => f.endsWith(extension));
      }
      return files;
    } catch {
      return [];
    }
  }

  getPath(relativePath: string): string {
    return path.join(this.baseDir, relativePath);
  }
}
