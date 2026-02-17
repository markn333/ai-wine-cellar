# 🍷 Wine Cellar Management App

ワインセラー管理アプリ - あなたのワインコレクションを効率的に管理

![React Native](https://img.shields.io/badge/React%20Native-0.76.5-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2052-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-green)

## 📖 概要

ワインセラーに保管しているワインを効率的に管理するためのWebアプリケーション。
将来的にiPhone/Androidアプリとしても展開予定。

### 主な機能

✅ **ワイン管理**
- ワインの登録・編集・削除
- 詳細情報の記録（生産者、ヴィンテージ、品種、価格など）
- 複数画像アップロード（最大5枚/ワイン）
- 画像ギャラリー表示（スワイプ・フルスクリーン対応）

✅ **検索・フィルター・ソート**
- リアルタイム検索
- ワインタイプでのフィルタリング
- 昇順・降順の切り替え可能なソート

✅ **テイスティングノート**
- 星評価（1-5）
- 外観、香り、味わい、余韻の記録
- 料理とのペアリング情報

✅ **飲酒記録**
- ワインを飲んだ記録
- 自動在庫管理

✅ **セラーマップ**
- 複数のセラーを管理
- グリッド形式で視覚的に配置を表示
- ワインの位置をハイライト表示
- マップから直接ワイン追加

✅ **ダッシュボード**
- 総在庫数・総資産額
- 種類別統計
- 最近追加したワイン

## 🚀 クイックスタート

### 必要要件

- Node.js v18以上
- npm または yarn
- Supabaseアカウント

### インストール

```bash
# リポジトリのクローン
git clone [your-repo-url]
cd wine-cellar

# 依存関係のインストール
npm install

# 環境変数の設定
# .env ファイルを作成してSupabaseの認証情報を設定

# 開発サーバーの起動
npx expo start
```

### Supabaseのセットアップ

1. [Supabase](https://supabase.com)でプロジェクトを作成

2. SQL Editorで以下のファイルを**順番に**実行:
   - `supabase-schema.sql` - メインスキーマ
   - `supabase-cellar-schema.sql` - セラーマップ用スキーマ
   - `supabase-wine-images-schema.sql` - 画像管理用スキーマ

3. Storageバケットを作成:
   - Storage → New Bucket
   - Name: `wine-images`
   - Public bucket: ✅ ON

4. Project Settings → API から以下を取得:
   - Project URL
   - Anon/Public Key

5. `.env`ファイルに設定:
```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 使い方

### ワインの登録

1. 「追加」タブをクリック
2. ワイン情報を入力
3. 「ワインを登録」をクリック

### セラーマップの使用

1. 「セラー」タブをクリック
2. 「セラーを追加」でセラーを作成
3. セラーをクリックしてマップを開く
4. 空きマスをクリックしてワインを追加
5. ワインマスをクリックして詳細表示

### ワインの検索

1. 「ワイン一覧」タブを開く
2. 検索バーにワイン名や生産者を入力
3. フィルターボタンで種類を絞り込み
4. ソートボタンで並び替え

## 🏗️ プロジェクト構造

```
wine-cellar/
├── app/                      # Expo Router画面
│   ├── (tabs)/              # タブナビゲーション
│   │   ├── index.tsx        # ダッシュボード
│   │   ├── wines.tsx        # ワイン一覧
│   │   ├── add.tsx          # ワイン追加
│   │   └── cellar.tsx       # セラー一覧
│   ├── wine/                # ワイン関連画面
│   │   ├── [id].tsx         # ワイン詳細
│   │   ├── edit/[id].tsx    # ワイン編集
│   │   └── tasting/[id].tsx # テイスティングノート追加
│   └── cellar/              # セラー関連画面
│       ├── add.tsx          # セラー追加
│       ├── map/[id].tsx     # セラーマップ
│       └── add-wine/[id].tsx # セラーからワイン追加
├── src/
│   ├── services/            # API通信
│   │   ├── supabase.ts      # Supabaseクライアント
│   │   ├── wineApi.ts       # ワインAPI
│   │   ├── wineImageApi.ts  # 画像API（複数画像管理）
│   │   ├── storageApi.ts    # Supabase Storage（アップロード・圧縮）
│   │   ├── visionApi.ts     # AI画像認識
│   │   └── cellarApi.ts     # セラーAPI
│   ├── store/               # 状態管理（Zustand）
│   │   ├── wineStore.ts     # ワインストア
│   │   ├── cellarStore.ts   # セラーストア
│   │   └── settingsStore.ts # 設定ストア（AI機能ON/OFF）
│   └── types/               # 型定義
│       └── wine.ts          # ワイン関連の型
├── assets/                  # 画像・アイコン
├── .env                     # 環境変数（非公開）
├── package.json             # 依存関係
├── tsconfig.json            # TypeScript設定
├── SPECIFICATION.md         # 詳細仕様書
└── README.md               # このファイル
```

## 🛠️ 技術スタック

### フロントエンド
- **React Native** - クロスプラットフォーム開発
- **Expo** - 開発・ビルド環境
- **TypeScript** - 型安全性
- **Expo Router** - ファイルベースルーティング
- **Zustand** - 軽量な状態管理

### バックエンド
- **Supabase** - PostgreSQL + REST API + Storage
- **Row Level Security** - セキュリティ
- **Supabase Storage** - 画像ストレージ（自動圧縮）

### UI/UX
- **Material Community Icons** - アイコン
- React Nativeスタイルシート

## 📊 データベーススキーマ

詳細は `SPECIFICATION.md` を参照してください。

主要テーブル:
- `wines` - ワイン情報
- `wine_images` - ワイン画像（複数画像対応）
- `cellars` - セラー情報
- `tasting_notes` - テイスティングノート
- `drinking_records` - 飲酒記録

Supabase Storage:
- `wine-images` バケット - ワイン画像の保存先（自動圧縮: 最大幅1200px、品質70%）

## 🎯 今後の実装予定

- [ ] **AI機能**
  - ワインラベル認識（OCR）
  - AIソムリエチャット
  - 料理とのペアリング提案

- [ ] **セラーマップ拡張**
  - ドラッグ&ドロップでワイン移動
  - セラー編集機能

- [ ] **データ管理**
  - CSV エクスポート/インポート
  - [x] 画像アップロード ✅ **完了** (v1.1.0)

- [ ] **通知機能**
  - 飲み頃通知
  - 在庫アラート

- [ ] **モバイルアプリ**
  - iPhone/Android ネイティブアプリ
  - カメラ連携

詳細は `SPECIFICATION.md` を参照してください。

## 🐛 トラブルシューティング

### ポートが使用中の場合
```bash
npx expo start --port 8084
```

### キャッシュをクリアして再起動
```bash
npx expo start --clear
```

### Web版で動作しない場合
- ブラウザのキャッシュをクリア
- 別のブラウザで試す

## 📝 ライセンス

MIT License

## 👥 貢献

プルリクエスト大歓迎！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📧 お問い合わせ

質問や提案がある場合は、Issueを作成してください。

---

**Enjoy managing your wine collection! 🍷**
