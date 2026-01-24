#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('manzai')
  .description('漫才台本作成CLI')
  .version('0.1.0');

program.parse();
