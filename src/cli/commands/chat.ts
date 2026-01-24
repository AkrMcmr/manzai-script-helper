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
