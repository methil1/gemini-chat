# GEMINI Chat // System

これは、GoogleのGemini APIを利用して動作する、サイバーパンク風UIのチャットアプリケーションです。

## ✨ 概要

このアプリケーションは、`gemini-3-flash-preview`モデルとの対話的なチャットを可能にします。ユーザーがメッセージを送信すると、Geminiからの応答がリアルタイムで表示されます。応答受信時には、ささやかなお祝いとして紙吹雪アニメーションが舞います。

## 🚀 主な機能

- **Gemini API連携:** Googleの最新モデル `gemini-3-flash-preview` とのチャット。
- **インタラクティブUI:** 送信、受信、ローディング状態などを視覚的に表現するUI。
- **履歴クリア:** 会話の履歴をリセットする機能。
- **コピー機能:** ユーザーとモデルの応答をクリップボードに簡単にコピーできます。
- **お祝いアニメーション:** 応答を受け取るたびに `canvas-confetti` によるアニメーションがトリガーされます。

## 🛠️ セットアップと実行方法

### 1. 必要なもの

- [Node.js](https://nodejs.org/) (v18以上を推奨)
- [Google AI Studio](https://aistudio.google.com/) で取得したAPIキー

### 2. インストール

プロジェクトのルートディレクトリで、以下のコマンドを実行して依存関係をインストールします。

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` という名前のファイルを作成し、以下のようにあなたのGemini APIキーを設定してください。

```
VITE_GEMINI_API_KEY="YOUR_API_KEY"
```
`YOUR_API_KEY` の部分を、ご自身のAPIキーに置き換えてください。

### 4. 開発サーバーの起動

以下のコマンドで、Vite開発サーバーを起動します。

```bash
npm run dev
```

サーバーが起動すると、ターミナルに表示されたローカルアドレス（例: `http://localhost:5173`）にブラウザでアクセスすることで、チャットアプリケーションを利用できます。

## 📜 スクリプト

- `npm run dev`: 開発サーバーを起動します。
- `npm run build`: プロダクション用にプロジェクトをビルドします。
- `npm run preview`: ビルドされたプロダクション版をローカルでプレビューします。

## ⚙️ 使用技術

- [Vite](https://vitejs.dev/): 高速なフロントエンド開発ツール。
- [@google/genai](https://www.npmjs.com/package/@google/genai): Google Gemini APIの公式JavaScriptクライアントライブラリ。
- [canvas-confetti](https://www.npmjs.com/package/canvas-confetti): 紙吹雪アニメーションを生成するライブラリ。
- HTML / CSS / JavaScript
