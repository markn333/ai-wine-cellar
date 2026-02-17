# Claude Code - Wine Cellar Management App

このファイルはClaude（AI）が将来このプロジェクトで作業する際の参考情報です。

## プロジェクト概要

ワインセラー管理アプリケーション。React Native + Expo + TypeScript + Supabaseで構築。
最終的にiPhoneアプリ化を想定。

**開発開始**: 2025年2月
**現在のステータス**: MVP完成（基本機能 + セラーマップ + 写真管理 + AIチャット実装済み）

## 技術スタック

- **React Native** 0.76.5
- **Expo** SDK 52
- **TypeScript** 5.x
- **Expo Router** - ファイルベースルーティング
- **Zustand** - 状態管理
- **Supabase** - BaaS (PostgreSQL + REST API)
- **OpenAI SDK** - AI機能（GPT-4o）
- **Material Community Icons** - アイコン

## 環境

- **開発環境**: Windows 11
- **Shell**: bash（Unix構文使用）
- **開発ポート**: 8084, 8090（8081-8083は使用済みのため避ける）
- **プロジェクトパス**: `D:\Develop.ai\wine-cellar`
- **Supabase URL**: https://zkgioxgmizadadwcwfpp.supabase.co

## 実装済み機能（v1.2.0）

### ✅ 基本的なワイン管理
- ワイン登録・編集・削除（CRUD完全実装）
- ワイン一覧表示（カード形式）
- ワイン詳細表示
- Pull to refresh

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

### ✅ 飲酒記録
- 「ワインを飲む」ボタンからモーダル表示
- 本数・機会・メモを記録
- **自動的に在庫数を減少**
- ワイン詳細画面に一覧表示

### ✅ セラーマップ機能（重要な新機能）
- **複数セラーの管理**
- グリッドベースのカスタムレイアウト（行×列）
- セラー一覧画面（使用率表示）
- **インタラクティブなマップビュー**:
  - ワインあり：紫色、ワインアイコン
  - 空き：グレー、座標表示
  - クリックでワイン追加または詳細表示
- **位置ハイライト機能**:
  - ワイン詳細画面から「マップで表示」ボタン
  - セラーマップで黄色/オレンジのハイライト
  - グロー効果、マップマーカーバッジ
- **自動更新**: ワイン追加後にマップが即座に更新

### ✅ ワイン写真管理（新機能）
- **複数画像対応**（最大5枚/ワイン）
- **Supabase Storageへの保存**
  - バケット: `wine-images`
  - 自動圧縮（最大幅1200px、品質70%）
  - Web互換のCanvas API使用
- **画像アップロード**:
  - ギャラリーから選択
  - カメラ撮影（モバイル）
  - メイン画像とサブ画像
- **ギャラリー表示**:
  - ワイン詳細画面で画像一覧
  - 横スワイプで切り替え
  - タップでフルスクリーン表示
  - 画像インジケーター（ドット）
- **画像管理**:
  - 個別削除機能
  - ワイン削除時に画像も自動削除
  - display_order で表示順を管理
- **全画面対応**:
  - ワイン追加画面
  - セラーマップからの追加画面
  - ワイン編集画面（予定）

### ✅ AIチャット機能（新機能）
- **AIソムリエとの対話**（GPT-4o使用）
- **コンテキスト連携**:
  - ユーザーのワインコレクション情報を自動送信
  - 種類別在庫、最近追加したワインを考慮した回答
- **チャットUI**:
  - メッセージバブル（ユーザー/AI/エラー表示）
  - 自動スクロール
  - ローディング表示
- **エラーハンドリング**:
  - APIキー未設定の検出
  - レート制限エラー
  - ネットワークエラー
- **AI機能ON/OFF**: 設定画面で切り替え可能

### ✅ APIキー管理機能（新機能）
- **設定画面からAPIキー管理**:
  - OpenAI APIキー（必須）
  - Google Cloud Vision APIキー（オプション）
  - Vivino APIキー（オプション、将来対応予定）
- **セキュアな入力**:
  - パスワード形式（secureTextEntry）
  - 表示/非表示切り替え（目のアイコン）
- **永続化**: AsyncStorageで保存（アプリ再起動後も保持）
- **設定状態の表示**: APIキーが設定済みか未設定かを視覚的に表示
- **環境変数フォールバック**: .envファイルの設定も引き続き有効

## データベース構造

### メインテーブル
- **wines**: ワイン情報（cellar_id, position_row, position_column, image_url含む）
- **wine_images**: ワイン画像（複数画像対応、display_order含む）
- **cellars**: セラー情報（rows, columns, layout_config）
- **tasting_notes**: テイスティングノート
- **drinking_records**: 飲酒記録

### 重要なリレーション
- wines.cellar_id → cellars.id (SET NULL on delete)
- wine_images.wine_id → wines.id (CASCADE on delete)
- tasting_notes.wine_id → wines.id (CASCADE on delete)
- drinking_records.wine_id → wines.id (CASCADE on delete)

### Supabase Storage
- **バケット**: `wine-images` (public)
- **パス構造**: `wines/wine_{wineId}_{timestamp}.jpg`
- **制限**: ファイルサイズ5MB、MIME type: image/jpeg, image/png, image/webp

## 重要なファイル構成

```
app/
├── (tabs)/
│   ├── index.tsx          # ダッシュボード
│   ├── wines.tsx          # ワイン一覧（検索・フィルター・ソート）
│   ├── add.tsx            # ワイン追加
│   ├── chat.tsx           # AIチャット（新規）
│   ├── cellar.tsx         # セラー一覧
│   ├── settings.tsx       # 設定画面（APIキー管理含む）
│   └── _layout.tsx        # タブレイアウト
├── wine/
│   ├── [id].tsx           # ワイン詳細（テイスティング・飲酒記録表示）
│   ├── edit/[id].tsx      # ワイン編集
│   └── tasting/[id].tsx   # テイスティングノート追加
└── cellar/
    ├── add.tsx            # セラー追加
    ├── map/[id].tsx       # セラーマップ（ハイライト機能含む）
    └── add-wine/[id].tsx  # セラーからワイン追加

src/
├── services/
│   ├── supabase.ts        # Supabaseクライアント
│   ├── wineApi.ts         # ワインCRUD + テイスティング + 飲酒記録
│   ├── wineImageApi.ts    # 画像CRUD（複数画像管理）
│   ├── storageApi.ts      # Supabase Storage API（アップロード・圧縮・削除）
│   ├── visionApi.ts       # AI画像認識（Google Cloud Vision API）
│   ├── openai.ts          # OpenAI API（AIチャット、ラベル認識）
│   └── cellarApi.ts       # セラーCRUD + 位置管理
├── store/
│   ├── wineStore.ts       # Zustand - ワイン状態管理
│   ├── cellarStore.ts     # Zustand - セラー状態管理
│   ├── chatStore.ts       # Zustand - チャット状態管理（新規）
│   └── settingsStore.ts   # Zustand - 設定管理（AI機能ON/OFF + APIキー）
├── components/
│   ├── TabBar.tsx         # カスタムタブバー
│   ├── ChatBubble.tsx     # チャットメッセージバブル（新規）
│   └── ChatInput.tsx      # チャット入力欄（新規）
└── types/
    ├── wine.ts            # 型定義（Wine, WineImage, Cellar, TastingNote, etc.）
    └── chat.ts            # 型定義（ChatMessage, ChatContext）（新規）
```

## 重要な実装パターン

### 1. Web互換性
- ❌ `Alert.alert()` は使わない
- ✅ `window.confirm()` と `alert()` を使用
- ❌ `useFocusEffect` は使わない
- ✅ `useEffect` を使用
- ❌ `expo-image-manipulator` は使わない（Web非対応）
- ✅ Canvas API で画像圧縮（Web対応）

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

## 解決済みの問題

### ✅ ポート競合
- 8081-8083は使用中
- 解決: ポート8084を使用

### ✅ セラーマップの自動更新
- 問題: ワイン追加後にマップが更新されない
- 解決: `useEffect([wines])` で監視して自動リロード

### ✅ ダッシュボードのワインカード
- 問題: クリックしても反応しない
- 解決: `onPress` ハンドラーを追加

### ✅ Web互換性
- 問題: Alert.alertがWebで動作しない
- 解決: window.confirm/alert を使用

### ✅ ソートの昇順・降順
- 問題: ソート順が固定
- 解決: sortOrder状態を追加、同じボタンクリックで切替

### ✅ 画像圧縮のWeb互換性
- 問題: expo-image-manipulatorがWebで動作しない（"Unable to resolve './ImageManipulator'"）
- 解決: Canvas APIを使用した画像圧縮関数に書き換え
- 効果: Web環境で画像リサイズ・圧縮が正常動作（最大幅1200px、品質70%）

### ✅ 複数画像管理
- 問題: 従来は1ワイン1画像のみ（image_urlフィールド）
- 解決: wine_imagesテーブルを作成し、1ワイン最大5画像に対応
- 実装: wineImageApi.tsで画像CRUD、display_orderで順序管理

### ✅ APIキーの動的管理
- 問題: .envファイルからのAPIキー読み込みのみ（変更時に再起動が必要）
- 解決: settingsStoreにAPIキー状態を追加、AsyncStorageで永続化
- 実装: 設定画面から変更可能、OpenAI SDKで動的にAPIキーを取得

## 開発時の注意事項

### キャッシュクリア
問題が起きたら:
```bash
npx expo start --clear
```

### ポート指定
```bash
npx expo start --port 8084
```

### Supabaseスキーマ更新
1. `supabase-schema.sql` - メインスキーマ
2. `supabase-cellar-schema.sql` - セラーマップ用
3. `supabase-wine-images-schema.sql` - 画像管理用

順番に実行すること。

### Supabase Storage設定
- ダッシュボードで `wine-images` バケットを作成（public）
- ポリシー設定で全操作を許可（認証実装後に厳格化予定）

### TypeScript型の整合性
- `src/types/wine.ts` が真実の情報源
- DBスキーマと型定義を同期させる

## 今後の実装予定（優先順）

### フェーズ1: AI機能
- [ ] ワインラベル認識（OpenAI Vision API）- 実装済みだが未統合
- [x] AIソムリエチャット（GPT-4o）✅ 完了
- [x] APIキー管理機能 ✅ 完了
- [ ] 料理とのペアリング提案（AIチャットで部分的に対応）
- [ ] チャット履歴の永続化（現在はメモリ内のみ）

### フェーズ2: セラーマップ拡張
- [ ] ドラッグ&ドロップでワイン移動
- [ ] セラー編集機能（サイズ変更）
- [ ] ワインカードプレビュー（ホバー時）

### フェーズ3: データ管理
- [ ] CSVエクスポート/インポート
- [x] 画像アップロード（Supabase Storage）✅ 完了
- [ ] バックアップ機能

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

3. **"Supabase connection failed"**
   - `.env` ファイルを確認
   - Supabase URLとキーが正しいか

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
- オフラインキャッシュ

## セキュリティ

### 現在の対策
- Supabase Row Level Security (RLS) 有効化
- 環境変数で認証情報を管理（.envはgitignore）
- APIキーのAsyncStorage保存（開発環境用）

### セキュリティ上の注意
- **APIキー管理**: 現在はAsyncStorageに平文で保存（開発/個人使用向け）
- **本番環境での推奨対策**:
  - バックエンドサーバー経由でAPI呼び出し
  - APIキーの暗号化保存
  - 適切なアクセス制御とレート制限
- **OpenAI SDK**: `dangerouslyAllowBrowser: true` を使用（開発用）

### 今後の強化
- ユーザー認証機能
- APIキーの暗号化保存
- バックエンドAPI経由のAI機能実装
- API レート制限

## テスト戦略（未実装）

### 優先度高
- [ ] ワインCRUD操作のテスト
- [ ] セラーマップの位置管理テスト
- [ ] 検索・フィルター・ソートのテスト

### 優先度中
- [ ] テイスティングノートのテスト
- [ ] 飲酒記録のテスト
- [ ] ナビゲーションのテスト

## 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Native](https://reactnative.dev/)

## メモ

- ユーザーはセラーマップ機能を非常に重視している
- UIはシンプルで直感的に
- 日本語UIで統一
- Web版が優先、モバイルは後
- エラーメッセージは日本語で分かりやすく

---

**最終更新**: 2026-02-17
**バージョン**: v1.2.0（AIチャット機能 + APIキー管理追加）
**作成者**: Claude Sonnet 4.5
