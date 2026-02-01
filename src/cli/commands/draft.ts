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
    .argument('[ideaId]', 'アイデアID')
    .action(async (ideaIdArg?: string) => {
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
      let ideaId = ideaIdArg;
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
            message: '台本を作るアイデアを選択してください:',
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
            message: 'この台本を保存しますか？ (Y/n)',
            default: true
          }
        ]);

        if (save) {
          const filename = `${idea.id}_v1.manzai`;
          const filepath = storage.getPath(`drafts/${filename}`);

          // created日付を追加
          const today = new Date().toISOString().split('T')[0];
          let scriptContent = response;
          if (!scriptContent.includes('created:')) {
            scriptContent = scriptContent.replace(
              /^---\n/m,
              `---\ncreated: ${today}\n`
            );
          }

          await fs.writeFile(filepath, scriptContent, 'utf-8');
          console.log(chalk.green(`\n✓ 保存しました: drafts/${filename}`));
        }
      } catch (error) {
        console.error(chalk.red('エラーが発生しました:'), error);
      }
    });

  return cmd;
}
