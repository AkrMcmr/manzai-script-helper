export const OGIRI_PATTERNS = [
  'こんな{theme}は嫌だ',
  '{theme}あるある',
  '{theme}で絶対言ってはいけないこと',
  'もし{theme}が○○だったら'
] as const;

export function buildOgiriPrompt(theme: string): string {
  const pattern = OGIRI_PATTERNS[Math.floor(Math.random() * OGIRI_PATTERNS.length)];
  const odai = pattern.replace('{theme}', theme);

  return `あなたは大喜利の出題者です。

テーマ「${theme}」に関連するお題を出してください。

お題の形式: 「${odai}」

お題だけを出力してください。説明は不要です。`;
}

export function buildOgiriFollowUpPrompt(
  theme: string,
  odai: string,
  answer: string
): string {
  return `テーマ「${theme}」
お題: 「${odai}」
回答: 「${answer}」

この回答をさらに面白くするために、1つだけ質問してください。
回答の背景や、その後の展開を聞き出す質問が効果的です。

質問だけを出力してください。`;
}

export function buildOgiriSummaryPrompt(
  theme: string,
  answers: { odai: string; answer: string }[]
): string {
  const answersText = answers
    .map((a, i) => `${i + 1}. お題「${a.odai}」→ 回答「${a.answer}」`)
    .join('\n');

  return `テーマ「${theme}」で大喜利をした結果です：

${answersText}

これらの回答から、漫才のネタの種をまとめてください。

以下の形式で出力してください：
---
テーマ: ${theme}
切り口: [回答から見えてきた切り口]
ボケ案:
- [回答から抽出したボケ]
- [回答から抽出したボケ]
- [AIが発展させたボケ案]（発展案）
---`;
}
