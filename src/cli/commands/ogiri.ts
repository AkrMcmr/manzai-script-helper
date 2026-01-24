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
      let theme: string;
      if (themeArg) {
        theme = themeArg;
      } else {
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
