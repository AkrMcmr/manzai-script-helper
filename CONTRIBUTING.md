# Contributing to manzai-writer

まず、このプロジェクトへの貢献を検討していただきありがとうございます！

## 行動規範

このプロジェクトおよびその参加者は、オープンで歓迎的な環境を維持することを約束します。

## 貢献の方法

### バグ報告

バグを見つけた場合は、[GitHub Issues](https://github.com/yourusername/manzai-writer/issues)で報告してください。

バグ報告には以下の情報を含めてください：
- バグの明確で詳細な説明
- 再現手順
- 期待される動作
- 実際の動作
- 環境情報（OS、Node.jsバージョンなど）

### 機能提案

新機能の提案も[GitHub Issues](https://github.com/yourusername/manzai-writer/issues)で受け付けています。

以下の情報を含めてください：
- 機能の詳細な説明
- なぜその機能が必要か
- 可能であれば実装方法の提案

### プルリクエスト

1. このリポジトリをフォークする
2. 機能ブランチを作成する (`git checkout -b feature/AmazingFeature`)
3. 変更をコミットする (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュする (`git push origin feature/AmazingFeature`)
5. プルリクエストを開く

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/manzai-writer.git
cd manzai-writer

# 依存関係をインストール
npm install

# 開発モードで実行
npm run dev

# テストを実行
npm test

# ビルド
npm run build
```

### コーディング規約

- TypeScriptを使用
- インデントはスペース2つ
- セミコロンを使用
- 意味のある変数名と関数名を使用
- 適切なコメントを追加

### コミットメッセージ

明確で簡潔なコミットメッセージを使用してください：

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメントの変更
- `style:` コードスタイルの変更
- `refactor:` リファクタリング
- `test:` テストの追加・修正
- `chore:` ビルドツールや補助ツールの変更

例：`feat: add ogiri mode for brainstorming`

## テスト

新機能を追加する場合は、対応するテストも追加してください。
プルリクエスト前に、すべてのテストがパスすることを確認してください。

```bash
npm test
```

## ライセンス

このプロジェクトに貢献することで、あなたの貢献がMITライセンスの下でライセンスされることに同意したものとみなされます。

## 質問

質問がある場合は、Issueを開くか、プロジェクトのメンテナーに連絡してください。

ありがとうございます！