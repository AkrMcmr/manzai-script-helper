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
if (process.argv.length === 2) {
  (async () => {
    while (true) {
      const action = await runInteractiveMode();
      if (!action) break;

      // 選択されたコマンドを実行
      const subCommand = program.commands.find(c => c.name() === action);
      if (subCommand) {
        // Reset args and parse the subcommand
        process.argv = [process.argv[0], process.argv[1], action];
        await program.parseAsync(process.argv);
        // Reset for next iteration
        process.argv = [process.argv[0], process.argv[1]];
      }
    }
  })();
} else {
  program.parse();
}
