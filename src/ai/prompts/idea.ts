import type { CombiConfig } from '../../types/index.js';

export function buildIdeaPrompt(theme: string, character?: CombiConfig): string {
  let prompt = `あなたは漫才の台本作りをサポートするアシスタントです。

テーマ「${theme}」で漫才のネタを考えるための切り口を5つ提案してください。

以下の形式で出力してください：
1. [切り口の名前] - [簡単な説明]
2. [切り口の名前] - [簡単な説明]
...

例：
1. あるあるネタ - 誰もが経験する共感ポイントを拾う
2. 勘違い系 - ボケが言葉や状況を勘違いして暴走する
`;

  if (character) {
    prompt += `
コンビ情報：
- コンビ名: ${character.combiName}
- ボケ (${character.boke.name}): ${character.boke.personality}、${character.boke.speechStyle}
- ツッコミ (${character.tsukkomi.name}): ${character.tsukkomi.personality}、${character.tsukkomi.speechStyle}

このコンビの特徴を活かした切り口を考えてください。`;
  }

  return prompt;
}

export function buildIdeaExpandPrompt(
  theme: string,
  angle: string,
  character?: CombiConfig
): string {
  let prompt = `テーマ「${theme}」を「${angle}」という切り口で漫才にします。

具体的なボケのアイデアを5〜10個、箇条書きで出してください。
それぞれのボケは、そのまま台本に使えるくらい具体的に書いてください。

形式：
- [ボケの内容]
- [ボケの内容]
...
`;

  if (character) {
    prompt += `
ボケ担当は${character.boke.name}（${character.boke.personality}）です。
口調: ${character.boke.speechStyle}
${character.boke.catchphrase ? `決め台詞: 「${character.boke.catchphrase}」` : ''}
`;
  }

  return prompt;
}
