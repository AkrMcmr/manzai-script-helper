#!/usr/bin/env node
import { Command } from 'commander';
import { createConfigCommand } from './cli/commands/config.js';
import { createIdeaCommand } from './cli/commands/idea.js';
import { createChatCommand } from './cli/commands/chat.js';
import { createOgiriCommand } from './cli/commands/ogiri.js';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.addCommand(createConfigCommand());
program.addCommand(createIdeaCommand());
program.addCommand(createChatCommand());
program.addCommand(createOgiriCommand());

program.parse();
