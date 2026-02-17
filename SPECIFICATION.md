# ワインセラー管理アプリ - 仕様書

## プロジェクト概要

ワインセラーに保管しているワインを効率的に管理するためのWebアプリケーション。
最終的にiPhoneアプリ化を想定し、React Native + Expoで開発。

### 目的
- ワインの在庫管理
- テイスティング記録の保存
- セラー内の物理的な配置管理
- AI機能による情報取得支援（将来実装）

---

## 技術スタック

### フロントエンド
- **React Native** (0.76.5) - クロスプラットフォーム開発
- **Expo** - 開発環境・ビルドツール
- **Expo Router** - ファイルベースルーティング
- **TypeScript** - 型安全性
- **Zustand** - 状態管理

### バックエンド
- **Supabase** - BaaS（Backend as a Service）
  - PostgreSQL データベース
  - Row Level Security (RLS)
  - RESTful API

### UI/UX
- **React Native Paper** (検討中)
- **MaterialCommunityIcons** - アイコン

---

## 実装済み機能

### ✅ 1. 基本的なワイン管理

#### 1.1 ワイン登録
- ワイン名（必須）
- 生産者（必須）
- ヴィンテージ（年）
- ワインの種類（赤/白/ロゼ/スパークリング/デザート/酒精強化）
- 国（必須）
- 地域
- 品種（カンマ区切りで複数入力可能）
- 本数
- 購入価格
- 保管場所（テキスト）
- メモ

#### 1.2 ワイン一覧表示
- カード形式で一覧表示
- プルして更新（Pull to Refresh）
- 基本情報の表示（名前、生産者、ヴィンテージ、種類、国、在庫数）

#### 1.3 ワイン詳細表示
- 全情報の表示
- 編集ボタン
- 削除ボタン
- セラーマップ表示（配置されている場合）

#### 1.4 ワイン編集
- 登録時と同じフォームで編集
- 既存データの読み込み

#### 1.5 ワイン削除
- 確認ダイアログ表示
- 削除実行

### ✅ 2. 検索・フィルター・ソート機能

#### 2.1 検索
- ワイン名での検索
- 生産者名での検索
- リアルタイム検索（入力中に絞り込み）
- 検索クリアボタン

#### 2.2 フィルター
- ワインの種類でフィルター
  - すべて
  - 赤ワイン
  - 白ワイン
  - ロゼ
  - スパークリング
  - デザートワイン
  - 酒精強化ワイン

#### 2.3 ソート
- 追加日（デフォルト）
- ワイン名
- ヴィンテージ
- 購入価格
- **昇順・降順の切り替え**
  - 同じボタンをクリックで切り替え
  - 矢印アイコンで視覚的に表示

### ✅ 3. ダッシュボード

#### 3.1 統計情報
- 総在庫本数
- 総資産価値
- ワイン種類別の在庫数

#### 3.2 最近追加したワイン
- 最新3件のワインを表示
- クリックで詳細画面へ遷移

### ✅ 4. テイスティングノート

#### 4.1 テイスティングノート追加
- テイスティング日時
- 評価（星1-5）
- 外観
- 香り
- 味わい
- 余韻
- 料理とのペアリング
- その他メモ

#### 4.2 テイスティングノート表示
- ワイン詳細画面に一覧表示
- 日付順にソート
- 星評価の表示

### ✅ 5. 飲酒記録

#### 5.1 飲酒記録の追加
- 「ワインを飲む」ボタンからモーダル表示
- 本数入力
- 機会（任意）
- メモ（任意）
- **自動的に在庫数を減少**

#### 5.2 飲酒記録の表示
- ワイン詳細画面に一覧表示
- 日付、本数、機会、メモを表示

### ✅ 6. セラーマップ機能

#### 6.1 セラー管理
- **複数のセラーを管理可能**
- セラー名、説明
- グリッドサイズ設定（行×列）
- セラー一覧表示
- ワイン本数の表示

#### 6.2 セラーマップ
- **カスタムレイアウト**
  - 行×列のグリッド表示
  - 横スクロール・縦スクロール対応
- **視覚的な配置表示**
  - ワインあり：紫色のマス、ワインアイコン表示
  - 空き：グレーのマス、座標表示
- **占有率表示**
  - ヘッダーに使用中のスロット数と割合を表示
- **インタラクティブ操作**
  - ワインありのマスをタップ → ワイン詳細画面へ
  - 空きのマスをタップ → ワイン追加画面へ

#### 6.3 セラーマップからワイン追加
- セラーID、位置情報を自動設定
- 通常のワイン登録フォーム

#### 6.4 セラーマップ上の位置ハイライト
- **ワイン詳細画面から「マップで表示」**
- セラーマップで該当位置を**黄色/オレンジでハイライト**
  - 太い枠線
  - 影効果（グロー）
  - マップマーカーバッジ
  - オレンジ色のアイコン
- 情報パネルにワイン情報表示
- ハイライトの解除可能

#### 6.5 自動更新
- ワイン追加後、セラーマップが自動的に更新される

---

## データベース設計

### テーブル構造

#### wines テーブル
```sql
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  producer TEXT NOT NULL,
  vintage INTEGER,
  type TEXT NOT NULL, -- 'red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'
  country TEXT NOT NULL,
  region TEXT,
  grape_variety TEXT[], -- 配列

  -- 購入情報
  purchase_date TIMESTAMPTZ,
  purchase_price NUMERIC,
  purchase_location TEXT,

  -- 保管情報
  cellar_location TEXT,
  cellar_id UUID REFERENCES cellars(id) ON DELETE SET NULL,
  position_row INTEGER,
  position_column INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,

  -- 飲み頃
  drink_from TIMESTAMPTZ,
  drink_to TIMESTAMPTZ,

  -- 追加情報
  bottle_size INTEGER, -- ml
  alcohol_content NUMERIC, -- %
  image_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### cellars テーブル
```sql
CREATE TABLE cellars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rows INTEGER NOT NULL DEFAULT 5,
  columns INTEGER NOT NULL DEFAULT 10,
  layout_config JSONB, -- カスタムレイアウト用
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tasting_notes テーブル
```sql
CREATE TABLE tasting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  tasted_at TIMESTAMPTZ NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  appearance TEXT,
  aroma TEXT,
  taste TEXT,
  finish TEXT,
  food_pairing TEXT,
  notes TEXT,
  images TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### drinking_records テーブル
```sql
CREATE TABLE drinking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  drunk_at TIMESTAMPTZ NOT NULL,
  occasion TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 画面構成

### タブナビゲーション

#### 1. ホーム（ダッシュボード）
- **パス**: `/`
- **機能**:
  - 統計情報の表示
  - 種類別在庫
  - 最近追加したワイン

#### 2. ワイン一覧
- **パス**: `/wines`
- **機能**:
  - ワイン一覧表示
  - 検索バー
  - フィルターボタン
  - ソートボタン
  - プルして更新

#### 3. ワイン追加
- **パス**: `/add`
- **機能**:
  - ワイン登録フォーム

#### 4. セラー
- **パス**: `/cellar`
- **機能**:
  - セラー一覧表示
  - FABでセラー追加

#### 5. 設定（未実装）
- **パス**: `/settings`
- **機能**: TBD

### 詳細画面

#### ワイン詳細
- **パス**: `/wine/[id]`
- **機能**:
  - ワイン情報表示
  - セラーマップ位置表示
  - 編集・削除ボタン
  - ワインを飲むボタン
  - テイスティングノート一覧
  - 飲酒記録一覧

#### ワイン編集
- **パス**: `/wine/edit/[id]`
- **機能**:
  - ワイン情報編集フォーム

#### テイスティングノート追加
- **パス**: `/wine/tasting/[id]`
- **機能**:
  - テイスティングノート登録フォーム

#### セラー追加
- **パス**: `/cellar/add`
- **機能**:
  - セラー名、説明、サイズ設定

#### セラーマップ
- **パス**: `/cellar/map/[id]`
- **パラメータ**: `?highlight=row-column`（オプション）
- **機能**:
  - グリッド表示
  - ワインの配置
  - クリックで操作
  - ハイライト表示

#### セラーからワイン追加
- **パス**: `/cellar/add-wine/[id]?row=X&column=Y`
- **機能**:
  - 位置指定でワイン登録

---

## API設計

### Wine API (`src/services/wineApi.ts`)

```typescript
// ワイン操作
fetchWines(): Promise<Wine[]>
createWine(wine: Omit<Wine, 'id' | 'created_at' | 'updated_at'>): Promise<Wine>
updateWine(id: string, wine: Partial<Wine>): Promise<Wine>
deleteWine(id: string): Promise<void>

// テイスティングノート
fetchTastingNotes(wineId: string): Promise<TastingNote[]>
createTastingNote(note: Omit<TastingNote, 'id' | 'created_at'>): Promise<TastingNote>

// 飲酒記録
fetchDrinkingRecords(wineId: string): Promise<DrinkingRecord[]>
createDrinkingRecord(record: Omit<DrinkingRecord, 'id' | 'created_at'>): Promise<DrinkingRecord>
drinkWine(wineId: string, quantity: number, occasion?: string, notes?: string): Promise<void>
```

### Cellar API (`src/services/cellarApi.ts`)

```typescript
// セラー操作
fetchCellars(): Promise<Cellar[]>
fetchCellar(id: string): Promise<Cellar | null>
createCellar(cellar: Omit<Cellar, 'id' | 'created_at' | 'updated_at'>): Promise<Cellar>
updateCellar(id: string, cellar: Partial<Cellar>): Promise<Cellar>
deleteCellar(id: string): Promise<void>

// ワイン配置
fetchWinesInCellar(cellarId: string): Promise<Wine[]>
fetchWineAtPosition(cellarId: string, row: number, column: number): Promise<Wine | null>
updateWinePosition(wineId: string, cellarId: string | null, row: number | null, column: number | null): Promise<void>
```

---

## 今後の実装予定（ゴール）

### 🔲 AI機能

#### 1. ワインラベル認識（OCR）
- カメラまたは画像アップロード
- OpenAI Vision APIでラベルを認識
- ワイン名、生産者、ヴィンテージを自動抽出
- フォームに自動入力

#### 2. AIソムリエチャット
- OpenAI GPT-4との対話
- ワインに関する質問に回答
- 保管方法のアドバイス
- 飲み頃の提案

#### 3. 料理とのペアリング提案
- 選択したワインに合う料理を提案
- 逆に料理からワインを提案

### 🔲 セラーマップの拡張

#### 1. ワインの移動（ドラッグ&ドロップ）
- マップ上でワインをドラッグして位置変更
- 位置の入れ替え

#### 2. セラー編集機能
- グリッドサイズの変更
- レイアウトの再構成

#### 3. ワインカードプレビュー
- マップ上でホバー時にワイン情報をポップアップ表示

### 🔲 データ管理

#### 1. エクスポート/インポート
- CSV形式でのエクスポート
- バックアップ機能

#### 2. 画像アップロード
- ワインラベルの写真保存
- Supabase Storageを使用

### 🔲 通知機能

#### 1. 飲み頃通知
- drink_from / drink_to に基づく通知
- プッシュ通知（モバイル）

#### 2. 在庫アラート
- 在庫が少なくなったら通知

### 🔲 レポート・分析

#### 1. グラフ表示
- 種類別の円グラフ
- 価格帯別の分布
- 国別の分布

#### 2. 飲酒統計
- 月別の消費量
- お気に入りのワイン

### 🔲 ソーシャル機能（検討中）

#### 1. ワイン評価の共有
- 他のユーザーの評価を参照
- レビューの投稿

#### 2. フレンド機能
- 友人とワインコレクションを共有

### 🔲 実機対応

#### 1. iPhone/Androidアプリ
- Expo EASでビルド
- App Store / Google Play配信

#### 2. カメラ機能
- ラベル撮影
- QRコード読み取り

---

## 環境変数

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key (未使用)
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your-google-key (未使用)
EXPO_PUBLIC_VIVINO_API_KEY=your-vivino-key (未使用)
```

---

## 開発環境

### 必要なツール
- Node.js (v18以上)
- npm または yarn
- Git

### セットアップ手順

```bash
# 1. リポジトリクローン
git clone [repository-url]
cd wine-cellar

# 2. 依存関係のインストール
npm install

# 3. 環境変数の設定
# .env ファイルを作成して必要な環境変数を設定

# 4. Supabaseのセットアップ
# Supabase Dashboardでプロジェクト作成
# SQL Editorでスキーマを実行

# 5. 開発サーバー起動
npx expo start

# 6. ブラウザで確認
# http://localhost:8081 (または指定されたポート)
```

---

## トラブルシューティング

### よくある問題

#### 1. ポートが使用中
```bash
# 別のポートで起動
npx expo start --port 8084
```

#### 2. Metro Bundlerのキャッシュクリア
```bash
npx expo start --clear
```

#### 3. Web互換性の問題
- `Alert.alert` → `window.confirm()` / `alert()` を使用
- `useFocusEffect` → `useEffect` を使用（Web対応）

---

## ライセンス

MIT License

---

## 作成者

- Claude Sonnet 4.5
- 協力: ユーザー

---

## 更新履歴

### v1.0.0 (2025-02-16)
- 基本的なワイン管理機能実装
- 検索・フィルター・ソート機能実装
- テイスティングノート機能実装
- 飲酒記録機能実装
- セラーマップ機能実装
- セラーマップからのワイン追加
- ワイン詳細からセラーマップ位置表示
- 昇順・降順ソート切り替え
