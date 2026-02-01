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
          message: 'コンビ名を入力してください:'
        },
        {
          type: 'input',
          name: 'bokeName',
          message: 'ボケ担当の名前を入力してください:'
        },
        {
          type: 'input',
          name: 'bokePersonality',
          message: 'ボケの性格・キャラを入力してください（例: 天然、マイペース）:'
        },
        {
          type: 'input',
          name: 'bokeSpeechStyle',
          message: 'ボケの口調を入力してください（例: 敬語、関西弁）:'
        },
        {
          type: 'input',
          name: 'bokeCatchphrase',
          message: 'ボケの決め台詞を入力してください（なければEnterでスキップ）:',
          default: ''
        },
        {
          type: 'input',
          name: 'tsukkomiName',
          message: 'ツッコミ担当の名前を入力してください:'
        },
        {
          type: 'input',
          name: 'tsukkomiPersonality',
          message: 'ツッコミの性格・キャラを入力してください:'
        },
        {
          type: 'input',
          name: 'tsukkomiSpeechStyle',
          message: 'ツッコミの口調を入力してください:'
        },
        {
          type: 'input',
          name: 'tsukkomiCatchphrase',
          message: 'ツッコミの決め台詞を入力してください（なければEnterでスキップ）:',
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
          name: answers.tsukkomiName,
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
