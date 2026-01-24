# manzai-writer 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** プロの漫才師向けに、ネタ出し・構成・台本作成をサポートするCLIツールを構築する

**Architecture:** TypeScript/Node.jsのCLIツール。Claude Code CLIを子プロセスとして呼び出してAI機能を実現。データは~/.manzai/にローカル保存。commanderでコマンド定義、inquirerで対話UI。

**Tech Stack:** TypeScript, Node.js, commander, inquirer, chalk, yaml, fuse.js

---

## Phase 1: プロジェクト初期化

### Task 1.1: npm初期化とTypeScript設定

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

**Step 1: プロジェクト初期化**

```bash
cd /Users/user/privateProjects/manzai-writer
npm init -y
```

**Step 2: 依存関係インストール**

```bash
npm install commander inquirer chalk yaml fuse.js
npm install -D typescript @types/node @types/inquirer ts-node vitest
```

**Step 3: package.json編集**

```json
{
  "name": "manzai-writer",
  "version": "0.1.0",
  "description": "漫才台本作成CLI",
  "main": "dist/index.js",
  "bin": {
    "manzai": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "type": "module",
  "engines": {
    "node": ">=18"
  }
}
```

**Step 4: tsconfig.json作成**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**Step 5: コミット**

```bash
git add package.json tsconfig.json package-lock.json
git commit -m "chore: プロジェクト初期化とTypeScript設定"
```

---

### Task 1.2: ディレクトリ構造とエントリーポイント

**Files:**
- Create: `src/index.ts`
- Create: `src/types/index.ts`

**Step 1: ディレクトリ作成**

```bash
mkdir -p src/{cli/commands,ai/prompts,data,parser,types}
mkdir -p templates test
```

**Step 2: 型定義作成**

Create `src/types/index.ts`:

```typescript
export interface Character {
  name: string;
  personality: string;
  speechStyle: string;
  catchphrase?: string;
}

export interface CombiConfig {
  combiName: string;
  boke: Character;
  tsukkomi: Character;
}

export interface Idea {
  id: string;
  theme: string;
  angle: string;
  content: string[];
  tags: string[];
  createdAt: string;
  source: 'idea' | 'ogiri' | 'expand';
}

export interface ScriptMetadata {
  title: string;
  duration: string;
  created: string;
  tags: string[];
}

export interface ScriptLine {
  speaker: string;
  text: string;
  direction?: string; // 間、動きなど
}

export interface ScriptSection {
  name: string; // ツカミ、本ネタ、オチ
  lines: ScriptLine[];
}

export interface Script {
  metadata: ScriptMetadata;
  sections: ScriptSection[];
}

export interface AppConfig {
  dataDir: string;
  defaultCharacter: string;
}
```

**Step 3: エントリーポイント作成**

Create `src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.parse();
```

**Step 4: 動作確認**

```bash
npx ts-node src/index.ts --help
```

Expected: ヘルプメッセージが表示される

**Step 5: コミット**

```bash
git add src/ templates/
git commit -m "feat: ディレクトリ構造とエントリーポイント作成"
```

---

## Phase 2: データ層

### Task 2.1: ストレージ基盤

**Files:**
- Create: `src/data/storage.ts`
- Create: `test/data/storage.test.ts`

**Step 1: テスト作成**

Create `test/data/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Storage } from '../../src/data/storage.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Storage', () => {
  let storage: Storage;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `manzai-test-${Date.now()}`);
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
```

**Step 2: テスト実行（失敗確認）**

```bash
npm run test:run
```

Expected: FAIL - Storage module not found

**Step 3: 実装**

Create `src/data/storage.ts`:

```typescript
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
```

**Step 4: テスト実行（成功確認）**

```bash
npm run test:run
```

Expected: PASS

**Step 5: コミット**

```bash
git add src/data/storage.ts test/
git commit -m "feat: ストレージ基盤を実装"
```

---

### Task 2.2: キャラクター管理

**Files:**
- Create: `src/data/character.ts`
- Create: `test/data/character.test.ts`
- Create: `templates/default-character.json`

**Step 1: テンプレート作成**

Create `templates/default-character.json`:

```json
{
  "combiName": "",
  "boke": {
    "name": "",
    "personality": "",
    "speechStyle": "",
    "catchphrase": ""
  },
  "tsukkomi": {
    "name": "",
    "personality": "",
    "speechStyle": "",
    "catchphrase": ""
  }
}
```

**Step 2: テスト作成**

Create `test/data/character.test.ts`:

```typescript
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
    testDir = path.join(os.tmpdir(), `manzai-test-${Date.now()}`);
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
```

**Step 3: テスト実行（失敗確認）**

```bash
npm run test:run
```

Expected: FAIL

**Step 4: 実装**

Create `src/data/character.ts`:

```typescript
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
```

**Step 5: テスト実行（成功確認）**

```bash
npm run test:run
```

Expected: PASS

**Step 6: コミット**

```bash
git add src/data/character.ts test/data/character.test.ts templates/
git commit -m "feat: キャラクター管理を実装"
```

---

### Task 2.3: アイデア管理

**Files:**
- Create: `src/data/idea.ts`
- Create: `test/data/idea.test.ts`

**Step 1: テスト作成**

Create `test/data/idea.test.ts`:

```typescript
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
    testDir = path.join(os.tmpdir(), `manzai-test-${Date.now()}`);
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
```

**Step 2: テスト実行（失敗確認）**

```bash
npm run test:run
```

Expected: FAIL

**Step 3: 実装**

Create `src/data/idea.ts`:

```typescript
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
```

**Step 4: テスト実行（成功確認）**

```bash
npm run test:run
```

Expected: PASS

**Step 5: コミット**

```bash
git add src/data/idea.ts test/data/idea.test.ts
git commit -m "feat: アイデア管理を実装"
```

---

## Phase 3: AI連携

### Task 3.1: Claude Code CLI呼び出し

**Files:**
- Create: `src/ai/claude-code.ts`
- Create: `test/ai/claude-code.test.ts`

**Step 1: テスト作成**

Create `test/ai/claude-code.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ClaudeCode } from '../../src/ai/claude-code.js';

describe('ClaudeCode', () => {
  it('should build command with prompt', () => {
    const claude = new ClaudeCode();
    const args = claude.buildArgs('テストプロンプト');

    expect(args).toContain('-p');
    expect(args).toContain('テストプロンプト');
    expect(args).toContain('--output-format');
    expect(args).toContain('text');
  });

  it('should include allowedTools when specified', () => {
    const claude = new ClaudeCode();
    const args = claude.buildArgs('プロンプト', { allowedTools: [] });

    expect(args).toContain('--allowedTools');
    expect(args).toContain('');
  });
});
```

**Step 2: テスト実行（失敗確認）**

```bash
npm run test:run
```

Expected: FAIL

**Step 3: 実装**

Create `src/ai/claude-code.ts`:

```typescript
import { spawn } from 'child_process';

export interface ClaudeOptions {
  allowedTools?: string[];
  maxTurns?: number;
}

export class ClaudeCode {
  buildArgs(prompt: string, options?: ClaudeOptions): string[] {
    const args = ['-p', prompt, '--output-format', 'text'];

    if (options?.allowedTools !== undefined) {
      args.push('--allowedTools', options.allowedTools.join(','));
    }

    if (options?.maxTurns) {
      args.push('--max-turns', String(options.maxTurns));
    }

    return args;
  }

  async ask(prompt: string, options?: ClaudeOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = this.buildArgs(prompt, options);
      const claude = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      claude.stdout.on('data', (data) => {
        output += data.toString();
      });

      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      claude.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Claude Code exited with code ${code}: ${errorOutput}`));
        }
      });

      claude.on('error', (err) => {
        reject(new Error(`Failed to spawn Claude Code: ${err.message}`));
      });
    });
  }
}
```

**Step 4: テスト実行（成功確認）**

```bash
npm run test:run
```

Expected: PASS

**Step 5: コミット**

```bash
git add src/ai/claude-code.ts test/ai/claude-code.test.ts
git commit -m "feat: Claude Code CLI連携を実装"
```

---

### Task 3.2: プロンプトテンプレート（idea）

**Files:**
- Create: `src/ai/prompts/idea.ts`

**Step 1: 実装**

Create `src/ai/prompts/idea.ts`:

```typescript
import type { CombiConfig } from '../../types/index.js';

export function buildIdeaPrompt(theme: string, character?: CombiConfig): string {
  let prompt = `あなたは漫才の台本作りをサポートするアシスタントです。

テーマ「${theme}」で漫才のネタを考えるための切り口を5つ提案してください。

以下の形式で出力してください：
1. [切り口の名前] - [簡単な説明]
2. [切り口の名前] - [簡単な説明]
...

例：
1. あるあるネタ - 誰もが経験する共感ポイントを拾う
2. 勘違い系 - ボケが言葉や状況を勘違いして暴走する
`;

  if (character) {
    prompt += `
コンビ情報：
- コンビ名: ${character.combiName}
- ボケ (${character.boke.name}): ${character.boke.personality}、${character.boke.speechStyle}
- ツッコミ (${character.tsukkomi.name}): ${character.tsukkomi.personality}、${character.tsukkomi.speechStyle}

このコンビの特徴を活かした切り口を考えてください。`;
  }

  return prompt;
}

export function buildIdeaExpandPrompt(
  theme: string,
  angle: string,
  character?: CombiConfig
): string {
  let prompt = `テーマ「${theme}」を「${angle}」という切り口で漫才にします。

具体的なボケのアイデアを5〜10個、箇条書きで出してください。
それぞれのボケは、そのまま台本に使えるくらい具体的に書いてください。

形式：
- [ボケの内容]
- [ボケの内容]
...
`;

  if (character) {
    prompt += `
ボケ担当は${character.boke.name}（${character.boke.personality}）です。
口調: ${character.boke.speechStyle}
${character.boke.catchphrase ? `決め台詞: 「${character.boke.catchphrase}」` : ''}
`;
  }

  return prompt;
}
```

**Step 2: コミット**

```bash
git add src/ai/prompts/idea.ts
git commit -m "feat: ideaコマンド用プロンプトテンプレートを追加"
```

---

### Task 3.3: プロンプトテンプレート（ogiri）

**Files:**
- Create: `src/ai/prompts/ogiri.ts`

**Step 1: 実装**

Create `src/ai/prompts/ogiri.ts`:

```typescript
export const OGIRI_PATTERNS = [
  'こんな{theme}は嫌だ',
  '{theme}あるある',
  '{theme}で絶対言ってはいけないこと',
  'もし{theme}が○○だったら'
] as const;

export function buildOgiriPrompt(theme: string): string {
  const pattern = OGIRI_PATTERNS[Math.floor(Math.random() * OGIRI_PATTERNS.length)];
  const odai = pattern.replace('{theme}', theme);

  return `あなたは大喜利の出題者です。

テーマ「${theme}」に関連するお題を出してください。

お題の形式: 「${odai}」

お題だけを出力してください。説明は不要です。`;
}

export function buildOgiriFollowUpPrompt(
  theme: string,
  odai: string,
  answer: string
): string {
  return `テーマ「${theme}」
お題: 「${odai}」
回答: 「${answer}」

この回答をさらに面白くするために、1つだけ質問してください。
回答の背景や、その後の展開を聞き出す質問が効果的です。

質問だけを出力してください。`;
}

export function buildOgiriSummaryPrompt(
  theme: string,
  answers: { odai: string; answer: string }[]
): string {
  const answersText = answers
    .map((a, i) => `${i + 1}. お題「${a.odai}」→ 回答「${a.answer}」`)
    .join('\n');

  return `テーマ「${theme}」で大喜利をした結果です：

${answersText}

これらの回答から、漫才のネタの種をまとめてください。

以下の形式で出力してください：
---
テーマ: ${theme}
切り口: [回答から見えてきた切り口]
ボケ案:
- [回答から抽出したボケ]
- [回答から抽出したボケ]
- [AIが発展させたボケ案]（発展案）
---`;
}
```

**Step 2: コミット**

```bash
git add src/ai/prompts/ogiri.ts
git commit -m "feat: ogiriコマンド用プロンプトテンプレートを追加"
```

---

### Task 3.4: プロンプトテンプレート（draft）

**Files:**
- Create: `src/ai/prompts/draft.ts`

**Step 1: 実装**

Create `src/ai/prompts/draft.ts`:

```typescript
import type { CombiConfig, Idea } from '../../types/index.js';

export function buildDraftPrompt(idea: Idea, character: CombiConfig): string {
  const bokeLines = idea.content.map(c => `- ${c}`).join('\n');

  return `以下のアイデアから、3〜5分の漫才台本を作成してください。

テーマ: ${idea.theme}
切り口: ${idea.angle}
ボケ案:
${bokeLines}

コンビ情報:
- コンビ名: ${character.combiName}
- ボケ (${character.boke.name}): ${character.boke.personality}
  口調: ${character.boke.speechStyle}
  ${character.boke.catchphrase ? `決め台詞: 「${character.boke.catchphrase}」` : ''}
- ツッコミ (${character.tsukkomi.name}): ${character.tsukkomi.personality}
  口調: ${character.tsukkomi.speechStyle}
  ${character.tsukkomi.catchphrase ? `決め台詞: 「${character.tsukkomi.catchphrase}」` : ''}

以下の形式で出力してください：

---
title: ${idea.theme}
duration: 4min
tags: [${idea.tags.join(', ')}]
---

# ツカミ
${character.tsukkomi.name}: どうも〜！${character.combiName}です！
${character.boke.name}: お願いします〜

# 本ネタ
${character.tsukkomi.name}: [セリフ]
${character.boke.name}: [セリフ] |間:2秒|
${character.tsukkomi.name}: [ツッコミ] |動き:手を叩く|

# オチ
${character.tsukkomi.name}: もうええわ！
${character.boke.name}: ありがとうございました〜

注意:
- |間:Xs| で間を、|動き:〇〇| で動きを指示
- ボケは${idea.content.length}個以上入れる
- ${character.boke.name}の口調は「${character.boke.speechStyle}」を維持
- ${character.tsukkomi.name}の口調は「${character.tsukkomi.speechStyle}」を維持`;
}
```

**Step 2: コミット**

```bash
git add src/ai/prompts/draft.ts
git commit -m "feat: draftコマンド用プロンプトテンプレートを追加"
```

---

## Phase 4: CLIコマンド（MVP）

### Task 4.1: configコマンド

**Files:**
- Create: `src/cli/commands/config.ts`
- Modify: `src/index.ts`

**Step 1: configコマンド実装**

Create `src/cli/commands/config.ts`:

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Storage } from '../../data/storage.js';
import { CharacterManager } from '../../data/character.js';
import type { CombiConfig } from '../../types/index.js';

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('キャラ設定の管理');

  cmd
    .command('init')
    .description('初期設定を行う')
    .action(async () => {
      const storage = new Storage();
      await storage.init();
      const manager = new CharacterManager(storage);

      console.log(chalk.cyan('🎤 漫才台本エディタ - 初期設定\n'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'combiName',
          message: 'コンビ名は？'
        },
        {
          type: 'input',
          name: 'bokeName',
          message: 'ボケ担当の名前は？'
        },
        {
          type: 'input',
          name: 'bokePersonality',
          message: 'ボケの性格・キャラは？（例: 天然、マイペース）'
        },
        {
          type: 'input',
          name: 'bokeSpeechStyle',
          message: 'ボケの口調は？（例: 敬語、関西弁）'
        },
        {
          type: 'input',
          name: 'bokeCatchphrase',
          message: 'ボケの決め台詞は？（なければ空欄）',
          default: ''
        },
        {
          type: 'input',
          name: 'tsukkomName',
          message: 'ツッコミ担当の名前は？'
        },
        {
          type: 'input',
          name: 'tsukkomiPersonality',
          message: 'ツッコミの性格・キャラは？'
        },
        {
          type: 'input',
          name: 'tsukkomiSpeechStyle',
          message: 'ツッコミの口調は？'
        },
        {
          type: 'input',
          name: 'tsukkomiCatchphrase',
          message: 'ツッコミの決め台詞は？（なければ空欄）',
          default: ''
        }
      ]);

      const config: CombiConfig = {
        combiName: answers.combiName,
        boke: {
          name: answers.bokeName,
          personality: answers.bokePersonality,
          speechStyle: answers.bokeSpeechStyle,
          catchphrase: answers.bokeCatchphrase || undefined
        },
        tsukkomi: {
          name: answers.tsukkomName,
          personality: answers.tsukkomiPersonality,
          speechStyle: answers.tsukkomiSpeechStyle,
          catchphrase: answers.tsukkomiCatchphrase || undefined
        }
      };

      await manager.save('default', config);
      console.log(chalk.green('\n✓ 設定を保存しました！'));
    });

  cmd
    .command('show')
    .description('現在の設定を表示')
    .action(async () => {
      const storage = new Storage();
      const manager = new CharacterManager(storage);
      const config = await manager.load('default');

      if (!config) {
        console.log(chalk.yellow('設定がありません。manzai config init で初期設定してください。'));
        return;
      }

      console.log(chalk.cyan(`\n🎤 ${config.combiName}\n`));
      console.log(chalk.bold('ボケ:'), config.boke.name);
      console.log('  性格:', config.boke.personality);
      console.log('  口調:', config.boke.speechStyle);
      if (config.boke.catchphrase) {
        console.log('  決め台詞:', `「${config.boke.catchphrase}」`);
      }
      console.log(chalk.bold('\nツッコミ:'), config.tsukkomi.name);
      console.log('  性格:', config.tsukkomi.personality);
      console.log('  口調:', config.tsukkomi.speechStyle);
      if (config.tsukkomi.catchphrase) {
        console.log('  決め台詞:', `「${config.tsukkomi.catchphrase}」`);
      }
    });

  return cmd;
}
```

**Step 2: index.tsに登録**

Update `src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { createConfigCommand } from './cli/commands/config.js';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.addCommand(createConfigCommand());

program.parse();
```

**Step 3: 動作確認**

```bash
npx ts-node src/index.ts config --help
```

Expected: configコマンドのヘルプが表示される

**Step 4: コミット**

```bash
git add src/cli/commands/config.ts src/index.ts
git commit -m "feat: configコマンドを実装"
```

---

### Task 4.2: ideaコマンド

**Files:**
- Create: `src/cli/commands/idea.ts`
- Modify: `src/index.ts`

**Step 1: ideaコマンド実装**

Create `src/cli/commands/idea.ts`:

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Storage } from '../../data/storage.js';
import { CharacterManager } from '../../data/character.js';
import { IdeaManager } from '../../data/idea.js';
import { ClaudeCode } from '../../ai/claude-code.js';
import { buildIdeaPrompt, buildIdeaExpandPrompt } from '../../ai/prompts/idea.js';

export function createIdeaCommand(): Command {
  const cmd = new Command('idea')
    .description('テーマからアイデア発想')
    .argument('[theme]', 'ネタのテーマ')
    .action(async (themeArg?: string) => {
      const storage = new Storage();
      await storage.init();
      const characterManager = new CharacterManager(storage);
      const ideaManager = new IdeaManager(storage);
      const claude = new ClaudeCode();

      // テーマ入力
      let theme = themeArg;
      if (!theme) {
        const answer = await inquirer.prompt([
          { type: 'input', name: 'theme', message: 'テーマは？' }
        ]);
        theme = answer.theme;
      }

      if (!theme) {
        console.log(chalk.red('テーマを入力してください。'));
        return;
      }

      console.log(chalk.cyan(`\nテーマ「${theme}」でアイデアを考えます...\n`));

      // キャラ設定を読み込み
      const character = await characterManager.load('default');

      // AIに切り口を提案させる
      const prompt = buildIdeaPrompt(theme, character ?? undefined);

      try {
        const response = await claude.ask(prompt, { allowedTools: [] });
        console.log(chalk.yellow('[AI] 切り口の候補:\n'));
        console.log(response);
        console.log('');

        // 切り口を選択
        const { selection } = await inquirer.prompt([
          {
            type: 'input',
            name: 'selection',
            message: 'どれを深掘りする？ (番号、または複数: 1,3)'
          }
        ]);

        if (!selection) return;

        // 選んだ切り口で深掘り
        const angles = selection.split(',').map((s: string) => s.trim());

        for (const angleNum of angles) {
          // レスポンスから切り口名を抽出（簡易的に）
          const lines = response.split('\n').filter((l: string) => l.match(/^\d+\./));
          const angleLine = lines.find((l: string) => l.startsWith(`${angleNum}.`));
          const angle = angleLine?.replace(/^\d+\.\s*/, '').split(' - ')[0] || `切り口${angleNum}`;

          console.log(chalk.cyan(`\n「${angle}」を深掘りします...\n`));

          const expandPrompt = buildIdeaExpandPrompt(theme, angle, character ?? undefined);
          const expandResponse = await claude.ask(expandPrompt, { allowedTools: [] });

          console.log(chalk.yellow('[AI] ボケ案:\n'));
          console.log(expandResponse);

          // 保存確認
          const { save } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'save',
              message: 'このアイデアを保存しますか？',
              default: true
            }
          ]);

          if (save) {
            const content = expandResponse
              .split('\n')
              .filter((l: string) => l.startsWith('- '))
              .map((l: string) => l.replace(/^- /, ''));

            const idea = await ideaManager.create({
              theme,
              angle,
              content,
              tags: [theme],
              source: 'idea'
            });

            console.log(chalk.green(`\n✓ 保存しました: ideas/${idea.id}.json`));
          }
        }
      } catch (error) {
        console.error(chalk.red('エラーが発生しました:'), error);
      }
    });

  return cmd;
}
```

**Step 2: index.tsに登録**

Update `src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { createConfigCommand } from './cli/commands/config.js';
import { createIdeaCommand } from './cli/commands/idea.js';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.addCommand(createConfigCommand());
program.addCommand(createIdeaCommand());

program.parse();
```

**Step 3: コミット**

```bash
git add src/cli/commands/idea.ts src/index.ts
git commit -m "feat: ideaコマンドを実装"
```

---

### Task 4.3: chatコマンド

**Files:**
- Create: `src/cli/commands/chat.ts`
- Modify: `src/index.ts`

**Step 1: chatコマンド実装**

Create `src/cli/commands/chat.ts`:

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Storage } from '../../data/storage.js';
import { CharacterManager } from '../../data/character.js';
import { ClaudeCode } from '../../ai/claude-code.js';

export function createChatCommand(): Command {
  const cmd = new Command('chat')
    .description('壁打ちモード（自由に相談）')
    .action(async () => {
      const storage = new Storage();
      await storage.init();
      const characterManager = new CharacterManager(storage);
      const claude = new ClaudeCode();

      const character = await characterManager.load('default');

      console.log(chalk.cyan('🎤 壁打ちモード'));
      console.log(chalk.gray('漫才のネタについて自由に相談できます。'));
      console.log(chalk.gray('終了するには「exit」と入力してください。\n'));

      const systemContext = character
        ? `あなたは漫才の台本作りをサポートするアシスタントです。

相談相手のコンビ情報:
- コンビ名: ${character.combiName}
- ボケ (${character.boke.name}): ${character.boke.personality}、${character.boke.speechStyle}
- ツッコミ (${character.tsukkomi.name}): ${character.tsukkomi.personality}、${character.tsukkomi.speechStyle}

このコンビの特徴を理解した上で、ネタ作りの相談に乗ってください。
建設的なアドバイスを心がけ、具体的な提案をしてください。`
        : `あなたは漫才の台本作りをサポートするアシスタントです。
ネタ作りの相談に乗ってください。建設的なアドバイスを心がけ、具体的な提案をしてください。`;

      let conversationHistory = systemContext + '\n\n';

      while (true) {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.green('あなた >'),
            prefix: ''
          }
        ]);

        if (input.toLowerCase() === 'exit') {
          console.log(chalk.cyan('\n壁打ちを終了します。お疲れ様でした！'));
          break;
        }

        if (!input.trim()) continue;

        conversationHistory += `ユーザー: ${input}\n`;

        try {
          const response = await claude.ask(
            conversationHistory + '\nアシスタント:',
            { allowedTools: [] }
          );

          conversationHistory += `アシスタント: ${response}\n\n`;

          console.log(chalk.yellow('\n[AI]'), response, '\n');
        } catch (error) {
          console.error(chalk.red('エラーが発生しました:'), error);
        }
      }
    });

  return cmd;
}
```

**Step 2: index.tsに登録**

Update `src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { createConfigCommand } from './cli/commands/config.js';
import { createIdeaCommand } from './cli/commands/idea.js';
import { createChatCommand } from './cli/commands/chat.js';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.addCommand(createConfigCommand());
program.addCommand(createIdeaCommand());
program.addCommand(createChatCommand());

program.parse();
```

**Step 3: コミット**

```bash
git add src/cli/commands/chat.ts src/index.ts
git commit -m "feat: chatコマンドを実装"
```

---

## Phase 5: 追加コマンド

### Task 5.1: ogiriコマンド

**Files:**
- Create: `src/cli/commands/ogiri.ts`
- Modify: `src/index.ts`

**Step 1: ogiriコマンド実装**

Create `src/cli/commands/ogiri.ts`:

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Storage } from '../../data/storage.js';
import { IdeaManager } from '../../data/idea.js';
import { ClaudeCode } from '../../ai/claude-code.js';
import {
  buildOgiriPrompt,
  buildOgiriFollowUpPrompt,
  buildOgiriSummaryPrompt
} from '../../ai/prompts/ogiri.js';

interface OgiriAnswer {
  odai: string;
  answer: string;
}

export function createOgiriCommand(): Command {
  const cmd = new Command('ogiri')
    .description('大喜利モードでネタ出し')
    .argument('[theme]', 'テーマ')
    .action(async (themeArg?: string) => {
      const storage = new Storage();
      await storage.init();
      const ideaManager = new IdeaManager(storage);
      const claude = new ClaudeCode();

      // テーマ入力
      let theme = themeArg;
      if (!theme) {
        const answer = await inquirer.prompt([
          {
            type: 'input',
            name: 'theme',
            message: 'テーマは？（空欄でランダム）',
            default: ''
          }
        ]);
        theme = answer.theme || '日常生活';
      }

      console.log(chalk.cyan(`\n🎤 大喜利モード - テーマ「${theme}」\n`));

      const answers: OgiriAnswer[] = [];

      while (true) {
        // お題を生成
        const odaiPrompt = buildOgiriPrompt(theme);
        const odai = await claude.ask(odaiPrompt, { allowedTools: [] });

        console.log(chalk.yellow(`[AI] お題: ${odai}\n`));

        // ユーザーの回答
        const { answer } = await inquirer.prompt([
          {
            type: 'input',
            name: 'answer',
            message: '回答 >'
          }
        ]);

        if (!answer.trim()) continue;

        // フォローアップ
        const followUpPrompt = buildOgiriFollowUpPrompt(theme, odai, answer);
        const followUp = await claude.ask(followUpPrompt, { allowedTools: [] });

        console.log(chalk.yellow(`\n[AI] ${followUp}\n`));

        const { followUpAnswer } = await inquirer.prompt([
          {
            type: 'input',
            name: 'followUpAnswer',
            message: '回答 >'
          }
        ]);

        // 回答を記録
        const fullAnswer = followUpAnswer
          ? `${answer} → ${followUpAnswer}`
          : answer;
        answers.push({ odai, answer: fullAnswer });

        console.log(chalk.green('\n✓ 回答を記録しました\n'));

        // 続けるか確認
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '次は？',
            choices: [
              { name: 'もう1問やる', value: 'continue' },
              { name: 'ここまでの回答でネタを組み立てる', value: 'summarize' },
              { name: '壁打ちに切り替える', value: 'chat' },
              { name: '終了', value: 'exit' }
            ]
          }
        ]);

        if (action === 'exit') {
          console.log(chalk.cyan('\n大喜利を終了します。'));
          break;
        }

        if (action === 'chat') {
          console.log(chalk.cyan('\nchatコマンドで壁打ちを続けてください。'));
          break;
        }

        if (action === 'summarize') {
          // 回答をまとめてネタの種を生成
          console.log(chalk.cyan('\n回答からネタの種を作成します...\n'));

          const summaryPrompt = buildOgiriSummaryPrompt(theme, answers);
          const summary = await claude.ask(summaryPrompt, { allowedTools: [] });

          console.log(chalk.yellow('[AI] まとめ:\n'));
          console.log(summary);

          // 保存確認
          const { save } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'save',
              message: 'このアイデアを保存しますか？',
              default: true
            }
          ]);

          if (save) {
            const content = answers.map(a => a.answer);
            const idea = await ideaManager.create({
              theme,
              angle: '大喜利から発展',
              content,
              tags: [theme, '大喜利'],
              source: 'ogiri'
            });

            console.log(chalk.green(`\n✓ 保存しました: ideas/${idea.id}.json`));
          }

          break;
        }
      }
    });

  return cmd;
}
```

**Step 2: index.tsに登録**

Update `src/index.ts` to add ogiri command import and registration.

**Step 3: コミット**

```bash
git add src/cli/commands/ogiri.ts src/index.ts
git commit -m "feat: ogiriコマンドを実装"
```

---

### Task 5.2: draftコマンド

**Files:**
- Create: `src/cli/commands/draft.ts`
- Modify: `src/index.ts`

**Step 1: draftコマンド実装**

Create `src/cli/commands/draft.ts`:

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs/promises';
import { Storage } from '../../data/storage.js';
import { CharacterManager } from '../../data/character.js';
import { IdeaManager } from '../../data/idea.js';
import { ClaudeCode } from '../../ai/claude-code.js';
import { buildDraftPrompt } from '../../ai/prompts/draft.js';

export function createDraftCommand(): Command {
  const cmd = new Command('draft')
    .description('アイデアから台本下書き生成')
    .argument('[ideaFile]', 'アイデアファイル')
    .action(async (ideaFileArg?: string) => {
      const storage = new Storage();
      await storage.init();
      const characterManager = new CharacterManager(storage);
      const ideaManager = new IdeaManager(storage);
      const claude = new ClaudeCode();

      // キャラ設定確認
      const character = await characterManager.load('default');
      if (!character) {
        console.log(chalk.red('キャラ設定がありません。先に manzai config init を実行してください。'));
        return;
      }

      // アイデア選択
      let ideaId = ideaFileArg;
      if (!ideaId) {
        const ideas = await ideaManager.list();
        if (ideas.length === 0) {
          console.log(chalk.red('アイデアがありません。先に manzai idea でアイデアを作成してください。'));
          return;
        }

        const { selected } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selected',
            message: 'どのアイデアから台本を作りますか？',
            choices: ideas.map(i => ({
              name: `${i.id} - ${i.angle}`,
              value: i.id
            }))
          }
        ]);
        ideaId = selected;
      }

      const idea = await ideaManager.load(ideaId!);
      if (!idea) {
        console.log(chalk.red(`アイデア「${ideaId}」が見つかりません。`));
        return;
      }

      console.log(chalk.cyan(`\n「${idea.theme}」の台本を作成します...\n`));

      // 台本生成
      const prompt = buildDraftPrompt(idea, character);

      try {
        const response = await claude.ask(prompt, { allowedTools: [] });

        console.log(chalk.yellow('[AI] 台本:\n'));
        console.log(response);

        // 保存確認
        const { save } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'save',
            message: 'この台本を保存しますか？',
            default: true
          }
        ]);

        if (save) {
          const filename = `${idea.id}_v1.manzai`;
          const filepath = storage.getPath(`drafts/${filename}`);

          // created日付を追加
          const scriptContent = response.replace(
            /^---$/m,
            `---\ncreated: ${new Date().toISOString().split('T')[0]}`
          );

          await fs.writeFile(filepath, scriptContent, 'utf-8');
          console.log(chalk.green(`\n✓ 保存しました: drafts/${filename}`));
        }
      } catch (error) {
        console.error(chalk.red('エラーが発生しました:'), error);
      }
    });

  return cmd;
}
```

**Step 2: index.tsに登録**

**Step 3: コミット**

```bash
git add src/cli/commands/draft.ts src/index.ts
git commit -m "feat: draftコマンドを実装"
```

---

### Task 5.3: 対話モード

**Files:**
- Create: `src/cli/interactive.ts`
- Modify: `src/index.ts`

**Step 1: 対話モード実装**

Create `src/cli/interactive.ts`:

```typescript
import inquirer from 'inquirer';
import chalk from 'chalk';

export async function runInteractiveMode(): Promise<string | null> {
  console.log(chalk.cyan('\n🎤 漫才台本エディタ v0.1.0\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '何をする？',
      choices: [
        { name: '1. 新しいネタを考える (idea)', value: 'idea' },
        { name: '2. 大喜利でネタ出し (ogiri)', value: 'ogiri' },
        { name: '3. アイデアを広げる (expand)', value: 'expand' },
        { name: '4. 台本を書く (draft)', value: 'draft' },
        { name: '5. 台本を磨く (polish)', value: 'polish' },
        { name: '6. 壁打ち相談 (chat)', value: 'chat' },
        { name: '7. ネタ帳を検索 (search)', value: 'search' },
        { name: '8. 設定 (config)', value: 'config' },
        { name: '9. 終了', value: 'exit' }
      ]
    }
  ]);

  return action === 'exit' ? null : action;
}
```

**Step 2: index.tsを更新**

Update `src/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { createConfigCommand } from './cli/commands/config.js';
import { createIdeaCommand } from './cli/commands/idea.js';
import { createChatCommand } from './cli/commands/chat.js';
import { createOgiriCommand } from './cli/commands/ogiri.js';
import { createDraftCommand } from './cli/commands/draft.js';
import { runInteractiveMode } from './cli/interactive.js';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.addCommand(createConfigCommand());
program.addCommand(createIdeaCommand());
program.addCommand(createChatCommand());
program.addCommand(createOgiriCommand());
program.addCommand(createDraftCommand());

// コマンドなしで実行された場合は対話モード
program.action(async () => {
  while (true) {
    const action = await runInteractiveMode();
    if (!action) break;

    // 選択されたコマンドを実行
    const subCommand = program.commands.find(c => c.name() === action);
    if (subCommand) {
      await subCommand.parseAsync([], { from: 'user' });
    }
  }
});

program.parse();
```

**Step 3: コミット**

```bash
git add src/cli/interactive.ts src/index.ts
git commit -m "feat: 対話モードを実装"
```

---

## Phase 6: 仕上げ

### Task 6.1: expandコマンド

**Files:**
- Create: `src/cli/commands/expand.ts`

（ideaコマンドの深掘り部分を独立させる実装）

### Task 6.2: searchコマンド

**Files:**
- Create: `src/cli/commands/search.ts`
- Create: `src/data/search.ts`

（fuse.jsを使ったあいまい検索の実装）

### Task 6.3: polishコマンド

**Files:**
- Create: `src/cli/commands/polish.ts`
- Create: `src/ai/prompts/polish.ts`

（台本ブラッシュアップの実装）

### Task 6.4: .manzaiパーサー

**Files:**
- Create: `src/parser/manzai.ts`
- Create: `test/parser/manzai.test.ts`

（YAML frontmatter + 台本本文のパース/生成）

### Task 6.5: ビルドと配布準備

**Step 1: ビルド確認**

```bash
npm run build
```

**Step 2: ローカルインストールテスト**

```bash
npm link
manzai --help
```

**Step 3: 最終コミット**

```bash
git add .
git commit -m "chore: ビルド設定と配布準備"
```

---

## 完了チェックリスト

- [ ] Phase 1: プロジェクト初期化
- [ ] Phase 2: データ層（storage, character, idea）
- [ ] Phase 3: AI連携（claude-code, prompts）
- [ ] Phase 4: MVPコマンド（config, idea, chat）
- [ ] Phase 5: 追加コマンド（ogiri, draft, interactive）
- [ ] Phase 6: 仕上げ（expand, search, polish, parser, build）
