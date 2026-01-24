import type { CombiConfig, Idea } from '../../types/index.js';

export function buildDraftPrompt(idea: Idea, character: CombiConfig): string {
  const bokeLines = idea.content.map(c => `- ${c}`).join('\n');

  return `以下のアイデアから、3〜5分の漫才台本を作成してください。

テーマ: ${idea.theme}
切り口: ${idea.angle}
ボケ案:
${bokeLines}

コンビ情報:
- コンビ名: ${character.combiName}
- ボケ (${character.boke.name}): ${character.boke.personality}
  口調: ${character.boke.speechStyle}
  ${character.boke.catchphrase ? `決め台詞: 「${character.boke.catchphrase}」` : ''}
- ツッコミ (${character.tsukkomi.name}): ${character.tsukkomi.personality}
  口調: ${character.tsukkomi.speechStyle}
  ${character.tsukkomi.catchphrase ? `決め台詞: 「${character.tsukkomi.catchphrase}」` : ''}

以下の形式で出力してください：

---
title: ${idea.theme}
duration: 4min
tags: [${idea.tags.join(', ')}]
---

# ツカミ
${character.tsukkomi.name}: どうも〜！${character.combiName}です！
${character.boke.name}: お願いします〜

# 本ネタ
${character.tsukkomi.name}: [セリフ]
${character.boke.name}: [セリフ] |間:2秒|
${character.tsukkomi.name}: [ツッコミ] |動き:手を叩く|

# オチ
${character.tsukkomi.name}: もうええわ！
${character.boke.name}: ありがとうございました〜

注意:
- |間:Xs| で間を、|動き:〇〇| で動きを指示
- ボケは${idea.content.length}個以上入れる
- ${character.boke.name}の口調は「${character.boke.speechStyle}」を維持
- ${character.tsukkomi.name}の口調は「${character.tsukkomi.speechStyle}」を維持`;
}
