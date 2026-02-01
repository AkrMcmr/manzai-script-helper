# manzai-writer

[![npm version](https://badge.fury.io/js/manzai-writer.svg)](https://www.npmjs.com/package/manzai-writer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

漫才台本作成を支援するCLIツール。Claude Code CLIと連携して、AIの力でネタ作りをサポートします。

## 特徴

- 🤖 Claude Code CLIとの連携によるAIアシスタント機能
- 🎭 コンビのキャラクター設定管理
- 💡 テーマからのアイデア発想支援
- 🎤 大喜利形式でのブレインストーミング
- 📝 台本の自動生成と保存
- 💬 壁打ち相談モード

## 必要要件

- Node.js v16以上
- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code/) のインストールと設定

## インストール

### npmからインストール（推奨）

```bash
npm install -g manzai-writer
```

### ソースからインストール

```bash
# リポジトリのクローン
git clone https://github.com/AkrMcmr/manzai-script-helper.git
cd manzai-script-helper

# 依存関係のインストール
npm install

# ビルド
npm run build

# グローバルにインストール
npm link
```

## 使い方

### 対話モード（推奨）

```bash
manzai
```

対話モードでは、メニューから操作を選択できます：
1. 新しいネタを考える (idea)
2. 大喜利でネタ出し (ogiri)
3. 台本を書く (draft)
4. 壁打ち相談 (chat)
5. 設定 (config)

### コマンドライン直接実行

```bash
# 初期設定（最初に実行）
manzai config init

# アイデア発想
manzai idea "テーマ"

# 大喜利モード
manzai ogiri

# 台本作成
manzai draft

# 壁打ち相談
manzai chat
```

## 初回セットアップ

1. Claude Code CLIをインストールし、APIキーを設定
2. `manzai config init` でコンビのキャラクター設定を登録
3. `manzai idea` でネタのアイデアを作成
4. `manzai draft` で台本を生成

## データ構造

生成されたデータは以下のディレクトリに保存されます：

```
data/
├── characters/    # キャラクター設定
├── ideas/        # アイデア・ネタの種
├── drafts/       # 生成された台本
└── logs/         # 会話ログ
```

## 開発

```bash
# 開発時のビルド監視
npm run dev

# テスト
npm test

# リント
npm run lint
```

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まず[issue](https://github.com/AkrMcmr/manzai-script-helper/issues)を開いて変更内容について議論してください。

詳細は[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## 作者

Akira Machimura

## 謝辞

- Claude (Anthropic) - AI機能の提供
- このプロジェクトで使用しているオープンソースライブラリの作者の皆様