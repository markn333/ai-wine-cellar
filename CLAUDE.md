# Claude Code - Wine Cellar Management App

このファイルはClaude（AI）が将来このプロジェクトで作業する際の参考情報です。

## プロジェクト概要

ワインセラー管理アプリケーション。React Native + Expo + TypeScript + WatermelonDB で構築。
最終的にiPhoneアプリ化を想定。

**開発開始**: 2025年2月
**現在のステータス**: MVP完成（基本機能 + セラーマップ + 写真管理 + AIチャット実装済み）

## 技術スタック

- **React Native** 0.76.5
- **Expo** SDK 52
- **TypeScript** 5.x
- **Expo Router** - ファイルベースルーティング
- **Zustand** - 状態管理
- **WatermelonDB** - ローカルDB（Web: LokiJS+IndexedDB、Native: SQLite）
- **OpenAI SDK** - AI機能（GPT-4o）
- **Material Community Icons** - アイコン

## 環境

- **開発環境**: Windows 11
- **Shell**: bash（Unix構文使用）
- **開発ポート**: 8084, 8090（8081-8083は使用済みのため避ける）
- **プロジェクトパス**: `D:\Develop.ai\wine-cellar`
- **GitHub Pages**: https://markn333.github.io/ai-wine-cellar/
- **GitHubリポジトリ**: https://github.com/markn333/ai-wine-cellar（public）

## 実装済み機能（v1.3.0）

### ✅ 基本的なワイン管理
- ワイン登録・編集・削除（CRUD完全実装）
- ワイン一覧表示（カード形式）
- ワイン詳細表示
- Pull to refresh
- **拡張フィールド**:
  - 購入日（purchase_date）
  - ボトルサイズ（bottle_size）
  - アルコール度数（alcohol_content）
  - 飲み頃From/To（drink_from / drink_to）

### ✅ 検索・フィルター・ソート
- リアルタイム検索（ワイン名・生産者）
- 種類別フィルター（赤/白/ロゼ/スパークリング/デザート/酒精強化）
- 4種類のソート（追加日/名前/ヴィンテージ/価格）
- **昇順・降順の切り替え**（同じボタンクリックで切替、矢印アイコン表示）

### ✅ ダッシュボード
- 総在庫本数・総資産額の表示
- 種類別在庫数
- 最近追加したワイン（最新3件、クリックで詳細画面へ）

### ✅ テイスティングノート
- 星評価（1-5）
- 外観・香り・味わい・余韻の記録
- 料理とのペアリング
- ワイン詳細画面に一覧表示
- **個別削除機能**（ゴミ箱アイコン）

### ✅ 飲酒記録
- 「ワインを飲む」ボタンからモーダル表示
- 本数・機会・メモを記録
- **自動的に在庫数を減少**
- **在庫が0になるとセラーマップから自動削除**（cellar_id, position_row, position_column をクリア）
- ワイン詳細画面に一覧表示
- **個別削除機能**（ゴミ箱アイコン）

### ✅ セラーマップ機能
- **複数セラーの管理**
- グリッドベースのカスタムレイアウト（行×列）
- セラー一覧画面（使用率表示）
- **セラー編集機能**（名前・サイズ変更、縮小時の安全チェックあり）
- **インタラクティブなマップビュー**:
  - ワインあり：紫色、ワインアイコン
  - 空き：グレー、座標表示（アルファベット-数字形式、例: A-1）
  - クリックでワイン追加または詳細表示
- **位置ハイライト機能**:
  - ワイン詳細画面から「マップで表示」ボタン
  - セラーマップで黄色/オレンジのハイライト
  - グロー効果、マップマーカーバッジ
- **自動更新**: ワイン追加後にマップが即座に更新

### ✅ ワイン写真管理
- **複数画像対応**（最大5枚/ワイン）
- **ローカルストレージへの保存**（WatermelonDB + Base64）
  - 自動圧縮（最大幅1200px、品質70%）
  - Web互換のCanvas API使用
- **画像アップロード**:
  - ギャラリーから選択
  - カメラ撮影（モバイル）
- **ギャラリー表示**:
  - ワイン詳細画面で画像一覧
  - タップでフルスクリーン表示
  - 複数画像は左右ナビゲーションボタン（‹ ›）で切り替え
  - ページ数インジケーター（例: 1 / 3）
- **画像管理**:
  - 個別削除機能
  - display_order で表示順を管理

### ✅ AIチャット機能
- **AIソムリエとの対話**（GPT-4o使用）
- **コンテキスト連携**:
  - ユーザーのワインコレクション情報を自動送信
  - 種類別在庫、最近追加したワインを考慮した回答
- **チャットUI**:
  - メッセージバブル（ユーザー/AI/エラー表示）
  - 自動スクロール
  - ローディング表示
- **AI機能ON/OFF**: 設定画面で切り替え可能

### ✅ APIキー管理機能
- **設定画面からAPIキー管理**:
  - OpenAI APIキー（必須）
  - Google Cloud Vision APIキー（オプション）
- **セキュアな入力**:
  - パスワード形式（secureTextEntry）
  - 表示/非表示切り替え（目のアイコン）
- **永続化**: AsyncStorageで保存（アプリ再起動後も保持）

### ✅ GitHub Pages デプロイ
- **GitHub Actions** による自動デプロイ（masterプッシュで起動）
- `npx expo export --platform web` でビルド
- URL: https://markn333.github.io/ai-wine-cellar/
- データはブラウザ毎のIndexedDBに保存（デバイス間同期なし）

## データベース構造（WatermelonDB）

### モデル
- **Wine**: ワイン情報（cellar_id, position_row, position_column 含む）
- **WineImage**: ワイン画像（複数画像対応、display_order含む）
- **Cellar**: セラー情報（rows, columns）
- **TastingNote**: テイスティングノート
- **DrinkingRecord**: 飲酒記録

### 重要なリレーション
- Wine.cellar_id → Cellar（SET NULL on delete）
- WineImage.wine_id → Wine（CASCADE on delete）
- TastingNote.wine_id → Wine（CASCADE on delete）
- DrinkingRecord.wine_id → Wine（CASCADE on delete）

### プラットフォーム別DB
- **Web**: `src/database/index.web.ts` → LokiJSAdapter + IndexedDB
- **Native**: `src/database/index.ts` → SQLiteAdapter

## 重要なファイル構成

```
app/
├── (tabs)/
│   ├── index.tsx          # ダッシュボード
│   ├── wines.tsx          # ワイン一覧（検索・フィルター・ソート）
│   ├── add.tsx            # ワイン追加
│   ├── chat.tsx           # AIチャット
│   ├── cellar.tsx         # セラー一覧
│   ├── settings.tsx       # 設定画面（APIキー管理含む）
│   └── _layout.tsx        # タブレイアウト
├── wine/
│   ├── [id].tsx           # ワイン詳細（テイスティング・飲酒記録・画像表示）
│   ├── edit/[id].tsx      # ワイン編集
│   └── tasting/[id].tsx   # テイスティングノート追加
└── cellar/
    ├── add.tsx            # セラー追加
    ├── edit/[id].tsx      # セラー編集（新規）
    ├── map/[id].tsx       # セラーマップ（ハイライト機能含む）
    └── add-wine/[id].tsx  # セラーからワイン追加

src/
├── database/
│   ├── index.ts           # Native用DBセットアップ（SQLite）
│   ├── index.web.ts       # Web用DBセットアップ（LokiJS）
│   ├── schema.ts          # DBスキーマ定義
│   └── models/            # WatermelonDBモデル
├── services/
│   ├── wineApi.ts         # ワインCRUD + テイスティング + 飲酒記録
│   ├── wineImageApi.ts    # 画像CRUD（複数画像管理）
│   ├── storageApi.ts      # 画像アップロード・圧縮・削除
│   ├── visionApi.ts       # AI画像認識（Google Cloud Vision API）
│   ├── openai.ts          # OpenAI API（AIチャット、ラベル認識）
│   └── cellarApi.ts       # セラーCRUD + 位置管理
├── store/
│   ├── wineStore.ts       # Zustand - ワイン状態管理
│   ├── cellarStore.ts     # Zustand - セラー状態管理
│   ├── chatStore.ts       # Zustand - チャット状態管理
│   └── settingsStore.ts   # Zustand - 設定管理（AI機能ON/OFF + APIキー）
├── components/
│   ├── TabBar.tsx         # カスタムタブバー
│   ├── ChatBubble.tsx     # チャットメッセージバブル
│   └── ChatInput.tsx      # チャット入力欄
├── stubs/
│   └── empty.js           # Webビルド用スタブ（better-sqlite3, fs）
├── types/
│   ├── wine.ts            # 型定義（Wine, WineImage, Cellar, TastingNote, etc.）
│   └── chat.ts            # 型定義（ChatMessage, ChatContext）
└── utils/
    └── cellarHelpers.ts   # columnToLetter, letterToColumn, formatCellarPosition
```

## 重要な実装パターン

### 1. Web互換性
- ❌ `Alert.alert()` は使わない
- ✅ `window.confirm()` と `alert()` を使用
- ❌ `useFocusEffect` は使わない
- ✅ `useEffect` を使用
- ❌ `expo-image-manipulator` は使わない（Web非対応）
- ✅ Canvas API で画像圧縮（Web対応）
- ❌ `FlatList + pagingEnabled` はWebで描画バグが出る
- ✅ 画像ビューワーは直接 `Image` + ナビゲーションボタンで実装
- ❌ スクロール内の `position: absolute` モーダルは位置ずれする
- ✅ `Modal` コンポーネントを使用してビューポートレベルで表示

### 2. 状態管理
- Zustandでグローバル状態管理
- `useWineStore` と `useCellarStore`
- ストア更新後に自動でUIが更新される

### 3. ナビゲーション
- Expo Routerのファイルベースルーティング
- `router.push()` でナビゲーション
- パラメータは `useLocalSearchParams()` で取得

### 4. スタイリング
- StyleSheet.create() を使用
- カラースキーム:
  - プライマリ: `#7C3AED`（紫）
  - セカンダリ: `#10B981`（緑）
  - 警告: `#F59E0B`（オレンジ）
  - 背景: `#F9FAFB`

### 5. セラー座標フォーマット
- 列はアルファベット（A, B, C...）、行は数字（1, 2, 3...）
- 表示: `A-1`, `B-3` など
- 変換: `src/utils/cellarHelpers.ts` の `columnToLetter` / `letterToColumn` を使用

## 解決済みの問題

### ✅ ポート競合
- 解決: ポート8084を使用

### ✅ セラーマップの自動更新
- 解決: `useEffect([wines])` で監視して自動リロード

### ✅ Web互換性（Alert）
- 解決: window.confirm/alert を使用

### ✅ 画像圧縮のWeb互換性
- 解決: Canvas APIを使用した画像圧縮関数に書き換え

### ✅ WatermelonDB本番ビルドエラー
- 問題: `expo-font` の `createExpoFontLoader` 関数がTerserで匿名化され、`registerWebModule` が "Module implementation must be a class" エラーを投げる
- 解決: `metro.config.js` に `keep_fnames: true`（compress + mangle）を追加して関数名を保持

### ✅ 画像選択モーダルの位置ずれ
- 問題: `position: absolute` のオーバーレイが `ScrollView` 内でスクロール量分だけ下にずれる
- 解決: React Native の `Modal` コンポーネントに変更（ビューポートレベルで表示）

### ✅ 全画面画像ビューワーの分割・反転バグ
- 問題: `FlatList + pagingEnabled` がWebで画像を左右分割・ミラー表示する
- 解決: FlatListを廃止し、`Image`コンポーネントで直接表示 + 左右ナビゲーションボタン

## 開発時の注意事項

### キャッシュクリア
```bash
npx expo start --clear
```

### ポート指定
```bash
npx expo start --port 8084
```

### Webビルド & デプロイ
```bash
npx expo export --platform web
# → dist/ フォルダに出力
# git push で GitHub Actions が自動デプロイ
```

### TypeScript型の整合性
- `src/types/wine.ts` が真実の情報源
- WatermelonDBスキーマと型定義を同期させる

## 今後の実装予定（優先順）

### フェーズ1: AI機能
- [ ] ワインラベル認識（OpenAI Vision API）- 実装済みだが未統合
- [x] AIソムリエチャット（GPT-4o）✅
- [x] APIキー管理機能 ✅
- [ ] チャット履歴の永続化（現在はメモリ内のみ）

### フェーズ2: セラーマップ拡張
- [ ] ドラッグ&ドロップでワイン移動
- [x] セラー編集機能 ✅
- [ ] ワインカードプレビュー（ホバー時）

### フェーズ3: データ管理
- [ ] CSVエクスポート/インポート
- [ ] バックアップ機能（データはブラウザ毎に独立）

### フェーズ4: 実機対応
- [ ] Expo EASビルド
- [ ] カメラ連携
- [ ] オフライン対応
- [ ] プッシュ通知

## ユーザーフィードバック履歴

1. ✅ 検索機能の実装
2. ✅ 昇順・降順の切り替え
3. ✅ セラーマップ機能（カスタムレイアウト、複数セラー対応）
4. ✅ ワイン詳細からセラーマップ位置表示
5. ✅ セラーマップの自動更新
6. ✅ ダッシュボードのワインカードクリック対応
7. ✅ AI機能の設定化（デフォルト無効、設定で有効化）
8. ✅ ワイン写真管理機能（複数画像、ギャラリー表示、自動圧縮）
9. ✅ セラーマップからの画像登録対応
10. ✅ AIチャット機能実装（GPT-4o、コンテキスト連携）
11. ✅ APIキー管理機能（設定画面から変更可能）
12. ✅ ワイン詳細フィールド追加（購入日・ボトルサイズ・アルコール度数・飲み頃）
13. ✅ テイスティングノート・飲酒記録の削除機能
14. ✅ セラー編集機能（名前・サイズ変更）
15. ✅ 飲酒記録作成時に在庫0でセラーマップから自動削除
16. ✅ 「このセラー内で移動」ボタン削除（ドラッグ&ドロップに移行）
17. ✅ GitHub Pages デプロイ（https://markn333.github.io/ai-wine-cellar/）
18. ✅ 画像選択モーダルの位置ずれ修正
19. ✅ 全画面画像ビューワーの分割・反転バグ修正

## コーディング規約

### ファイル命名
- スクリーン: PascalCase + Screen（例: `WineDetailScreen`）
- コンポーネント: PascalCase
- ユーティリティ: camelCase
- 型定義: PascalCase（例: `Wine`, `Cellar`）

### インポート順序
1. React関連
2. React Native関連
3. サードパーティライブラリ
4. ローカルのservices/store/types
5. アイコン
6. スタイル

### コメント
- 日本語でOK
- 複雑なロジックには説明を追加
- TODOは `// TODO:` 形式

## デバッグのヒント

### よくあるエラー

1. **"Cannot find module"**
   - `npm install` を実行
   - キャッシュクリア

2. **"Port already in use"**
   - 別ポート使用: `--port 8084`

3. **"Module implementation must be a class"**
   - `metro.config.js` の `keep_fnames: true` が設定されているか確認

4. **"Syntax error in JSX"**
   - Fragment `<>...</>` の開閉を確認
   - 括弧のバランスを確認

## パフォーマンス最適化

### 実装済み
- `useMemo` で検索・フィルター・ソート結果をメモ化
- FlatListで仮想化リスト
- 状態管理をZustandで軽量化

### 今後の改善点
- 画像の遅延読み込み
- ページネーション（ワイン数が多い場合）

## セキュリティ

### 現在の対策
- 環境変数で認証情報を管理（.envはgitignore）
- APIキーのAsyncStorage保存（開発/個人使用向け）

### セキュリティ上の注意
- **APIキー管理**: 現在はAsyncStorageに平文で保存（個人使用向け）
- **OpenAI SDK**: `dangerouslyAllowBrowser: true` を使用（開発用）

## メモ

- ユーザーはセラーマップ機能を非常に重視している
- UIはシンプルで直感的に
- 日本語UIで統一
- Web版が優先、モバイルは後
- エラーメッセージは日本語で分かりやすく
- データはブラウザ毎のIndexedDBに保存（マルチデバイス同期なし）

---

**最終更新**: 2026-02-17
**バージョン**: v1.3.0
**作成者**: Claude Sonnet 4.5
