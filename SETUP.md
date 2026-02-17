# セットアップガイド

## 1. 必要なツール

- Node.js 18以上
- npm または yarn
- iOS開発の場合: Xcode（Macのみ）
- Android開発の場合: Android Studio
- Expo Go アプリ（実機テスト用）

## 2. プロジェクトのインストール

```bash
cd wine-cellar-app
npm install
```

## 3. Supabaseのセットアップ

### 3.1 Supabaseプロジェクトの作成

1. https://supabase.com/ にアクセス
2. 「Start your project」をクリック
3. GitHubでログイン
4. 「New project」をクリック
5. プロジェクト名を入力（例: wine-cellar）
6. データベースパスワードを設定
7. リージョンを選択（Northeast Asia (Tokyo) 推奨）
8. 「Create new project」をクリック

### 3.2 データベーススキーマの作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 「New query」をクリック
3. `supabase-schema.sql`の内容をコピー＆ペースト
4. 「Run」をクリックして実行

### 3.3 APIキーの取得

1. Supabaseダッシュボードで「Settings」→「API」を開く
2. 「Project URL」をコピー
3. 「Project API keys」の「anon public」をコピー

## 4. OpenAI APIキーの取得

### 4.1 OpenAIアカウント作成

1. https://platform.openai.com/ にアクセス
2. アカウントを作成
3. 課金設定を行う（従量課金）

### 4.2 APIキーの生成

1. 「API keys」ページを開く
2. 「Create new secret key」をクリック
3. 名前を入力（例: wine-cellar-app）
4. APIキーをコピー（再表示されないので注意）

## 5. 環境変数の設定

`.env`ファイルを作成:

```bash
cp .env.example .env
```

`.env`を編集:

```env
# Supabaseの設定
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAIの設定
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...

# Google Cloud（オプション - 後で設定可能）
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=
```

## 6. アプリの起動

### 開発サーバーの起動

```bash
npm start
```

### プラットフォームの選択

- **iOS (Macのみ)**: `i`キーを押す
- **Android**: `a`キーを押す
- **Web**: `w`キーを押す
- **実機（Expo Go）**: QRコードをスキャン

### 実機テストの場合

1. App StoreまたはGoogle Playから「Expo Go」アプリをインストール
2. 開発サーバーのQRコードをExpo Goでスキャン
3. アプリが起動

## 7. 開発Tips

### ホットリロード

ファイルを保存すると自動的にアプリがリロードされます。

### デバッグ

- `m`キーを押すとデベロッパーメニューが開きます
- ブラウザで http://localhost:19002 にアクセスすると管理画面が開きます

### エラーが発生した場合

```bash
# キャッシュクリア
npm start -- --clear

# node_modulesを再インストール
rm -rf node_modules
npm install

# Watchmanのリセット（Macの場合）
watchman watch-del-all
```

## 8. 次のステップ

1. ワイン登録機能の実装
2. カメラ機能の追加
3. AI機能の統合
4. UIの改善

## トラブルシューティング

### エラー: "Unable to resolve module"

```bash
npm install
npm start -- --clear
```

### iOS: "Developer Disk Image not found"

Xcodeを最新版にアップデートしてください。

### Android: エミュレータが起動しない

Android Studioでエミュレータを作成し、起動してから`a`キーを押してください。

### 環境変数が読み込まれない

1. `.env`ファイルが正しい場所にあるか確認
2. 開発サーバーを再起動
3. `EXPO_PUBLIC_`プレフィックスがあるか確認

## サポート

問題が解決しない場合は、以下を確認してください:

- Expo公式ドキュメント: https://docs.expo.dev/
- Supabase公式ドキュメント: https://supabase.com/docs
- React Native公式ドキュメント: https://reactnative.dev/
