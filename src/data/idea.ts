import { Storage } from './storage.js';
import type { Idea } from '../types/index.js';

type CreateIdeaInput = Omit<Idea, 'id' | 'createdAt'>;

export class IdeaManager {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async create(input: CreateIdeaInput): Promise<Idea> {
    const existingFiles = await this.storage.listFiles('ideas', '.json');
    const nextNum = existingFiles.length + 1;
    const id = `${String(nextNum).padStart(3, '0')}_${input.theme}`;

    const idea: Idea = {
      ...input,
      id,
      createdAt: new Date().toISOString()
    };

    await this.storage.saveJson(`ideas/${id}.json`, idea);
    return idea;
  }

  async load(id: string): Promise<Idea | null> {
    return this.storage.loadJson<Idea>(`ideas/${id}.json`);
  }

  async list(): Promise<Idea[]> {
    const files = await this.storage.listFiles('ideas', '.json');
    const ideas: Idea[] = [];

    for (const file of files) {
      const idea = await this.storage.loadJson<Idea>(`ideas/${file}`);
      if (idea) ideas.push(idea);
    }

    return ideas.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async update(id: string, updates: Partial<CreateIdeaInput>): Promise<Idea | null> {
    const idea = await this.load(id);
    if (!idea) return null;

    const updated = { ...idea, ...updates };
    await this.storage.saveJson(`ideas/${id}.json`, updated);
    return updated;
  }
}
