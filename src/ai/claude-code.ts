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
