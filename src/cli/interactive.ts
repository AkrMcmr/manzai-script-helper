import inquirer from 'inquirer';
import chalk from 'chalk';

export async function runInteractiveMode(): Promise<string | null> {
  console.log(chalk.cyan('\n🎤 漫才台本エディタ v0.1.0\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '実行したい操作を選択してください:',
      choices: [
        { name: '1. 新しいネタを考える (idea)', value: 'idea' },
        { name: '2. 大喜利でネタ出し (ogiri)', value: 'ogiri' },
        { name: '3. 台本を書く (draft)', value: 'draft' },
        { name: '4. 壁打ち相談 (chat)', value: 'chat' },
        { name: '5. 設定 (config)', value: 'config' },
        { name: '6. 終了', value: 'exit' }
      ]
    }
  ]);

  return action === 'exit' ? null : action;
}
