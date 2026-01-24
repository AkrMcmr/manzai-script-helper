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

  it('should include max-turns when specified', () => {
    const claude = new ClaudeCode();
    const args = claude.buildArgs('プロンプト', { maxTurns: 3 });

    expect(args).toContain('--max-turns');
    expect(args).toContain('3');
  });
});
