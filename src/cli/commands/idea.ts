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
          { type: 'input', name: 'theme', message: 'テーマを入力してください:' }
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
            message: '深掘りしたい切り口を選択してください (番号入力、複数選択可: 例 1,3):'
          }
        ]);

        if (!selection) return;

        // 選んだ切り口で深掘り
        const angles = selection.split(',').map((s: string) => s.trim());

        for (const angleNum of angles) {
          // レスポンスから切り口名を抽出
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
              message: 'このアイデアを保存しますか？ (Y/n)',
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
