# 完全ローカルDB移行計画

## 概要

Supabase（クラウド）から WatermelonDB（ローカル）への完全移行

**目標**: オフライン完全対応、ランニングコスト¥0、シンプルな個人向けワインセラー管理アプリ

---

## 技術選定: WatermelonDB

### 選定理由
1. **React Native専用設計** - Expo対応（expo-sqlite使用）
2. **高速** - 10,000件でも瞬時に動作
3. **オフライン完全対応** - ネットワーク不要
4. **リレーション対応** - ワイン↔テイスティングノート等
5. **実績豊富** - 多数のプロダクション利用例

### 代替案との比較
- ❌ SQLite直接 - リレーション管理が複雑
- ❌ Realm - Expoとの相性が悪い、有料化の可能性
- ✅ **WatermelonDB** - 最適解

---

## データ構造設計

### テーブル構成

```typescript
// wines テーブル
{
  id: string (UUID)
  name: string
  producer: string
  vintage?: number
  type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified'
  country: string
  region?: string
  grape_variety?: string[] (JSON)
  quantity: number
  purchase_price?: number
  purchase_date?: string
  purchase_location?: string
  bottle_size?: string
  alcohol_content?: number
  drink_from?: number
  drink_to?: number
  cellar_location?: string
  cellar_id?: string (FK → cellars)
  position_row?: number
  position_column?: number
  notes?: string
  created_at: number (timestamp)
  updated_at: number (timestamp)
}

// wine_images テーブル
{
  id: string (UUID)
  wine_id: string (FK → wines)
  image_path: string (ローカルファイルパス)
  display_order: number
  created_at: number
}

// cellars テーブル
{
  id: string (UUID)
  name: string
  rows: number
  columns: number
  layout_config?: string (JSON)
  notes?: string
  created_at: number
  updated_at: number
}

// tasting_notes テーブル
{
  id: string (UUID)
  wine_id: string (FK → wines)
  rating: number (1-5)
  tasted_at: string
  appearance?: string
  aroma?: string
  taste?: string
  finish?: string
  food_pairing?: string
  notes?: string
  created_at: number
}

// drinking_records テーブル
{
  id: string (UUID)
  wine_id: string (FK → wines)
  quantity: number
  drunk_at: string
  occasion?: string
  notes?: string
  created_at: number
}
```

---

## 画像保存戦略

### ローカルファイルシステム

```
DocumentDirectory/
└── wine-images/
    ├── wine_{wineId}_1_{timestamp}.jpg
    ├── wine_{wineId}_2_{timestamp}.jpg
    └── ...
```

### 実装方針
1. **保存**: `expo-file-system`でDocumentDirectoryに保存
2. **圧縮**: Canvas APIで最大幅1200px、品質70%（既存実装維持）
3. **サムネイル**: 一覧表示用に300pxバージョンも生成
4. **削除**: ワイン削除時に関連画像も削除

### ファイルパス管理
- DBには相対パス保存: `wine-images/wine_{id}_1.jpg`
- 表示時に絶対パス生成: `${DocumentDirectory}/${relativePath}`

---

## バックアップ戦略

### 1. iCloud Drive自動同期

**実装**: `expo-file-system`でiCloud Driveフォルダに保存

```typescript
// iCloud Driveパス（iOS）
const iCloudDirectory = FileSystem.documentDirectory + '../Library/Mobile Documents/iCloud~com~yourapp/Documents/'

// 自動バックアップ（毎日深夜実行）
async function backupToiCloud() {
  // 1. SQLiteファイルをコピー
  await FileSystem.copyAsync({
    from: `${FileSystem.documentDirectory}SQLite/watermelon.db`,
    to: `${iCloudDirectory}backup_${Date.now()}.db`
  });

  // 2. 画像フォルダを同期
  await FileSystem.copyAsync({
    from: `${FileSystem.documentDirectory}wine-images/`,
    to: `${iCloudDirectory}wine-images/`
  });
}
```

**ユーザー設定**: 設定画面で「iCloudバックアップ」ON/OFF

### 2. 手動エクスポート（CSV）

**既存機能を維持** - CLAUDE.mdに記載済み
- ワインリストのCSVエクスポート
- メール送信/ファイル共有対応

### 3. データ復元

**機種変更時の手順**:
1. 旧iPhoneでiCloudバックアップ有効化
2. 新iPhoneにアプリインストール
3. 初回起動時に「iCloudから復元」を選択
4. 自動的にデータ・画像を復元

---

## 移行手順（段階的アプローチ）

### フェーズ1: WatermelonDBセットアップ（Week 1）

#### 1-1. パッケージインストール
```bash
npm install @nozbe/watermelondb
npm install @nozbe/with-observables
npx expo install expo-sqlite
```

#### 1-2. スキーマ定義
**ファイル**: `src/database/schema.ts`

```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'wines',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'producer', type: 'string' },
        { name: 'vintage', type: 'number', isOptional: true },
        { name: 'type', type: 'string' },
        // ... 他のカラム
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'wine_images',
      columns: [
        { name: 'wine_id', type: 'string', isIndexed: true },
        { name: 'image_path', type: 'string' },
        { name: 'display_order', type: 'number' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    // ... 他のテーブル
  ]
})
```

#### 1-3. モデル定義
**ファイル**: `src/database/models/Wine.ts`

```typescript
import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'

export default class Wine extends Model {
  static table = 'wines'
  static associations = {
    wine_images: { type: 'has_many', foreignKey: 'wine_id' },
    tasting_notes: { type: 'has_many', foreignKey: 'wine_id' },
    drinking_records: { type: 'has_many', foreignKey: 'wine_id' },
  }

  @field('name') name
  @field('producer') producer
  @field('vintage') vintage
  @field('type') type
  // ... 他のフィールド

  @children('wine_images') images
  @children('tasting_notes') tastingNotes
  @children('drinking_records') drinkingRecords

  @readonly @date('created_at') createdAt
  @readonly @date('updated_at') updatedAt
}
```

#### 1-4. データベース初期化
**ファイル**: `src/database/index.ts`

```typescript
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema } from './schema'
import Wine from './models/Wine'
import WineImage from './models/WineImage'
// ... 他のモデル

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'WineCellar',
})

export const database = new Database({
  adapter,
  modelClasses: [Wine, WineImage, /* ... */],
})
```

---

### フェーズ2: API層の書き換え（Week 2）

#### 既存API → WatermelonDB API

**Before (Supabase)**:
```typescript
// src/services/wineApi.ts
export async function createWine(wineData) {
  const { data, error } = await supabase
    .from('wines')
    .insert(wineData)
    .select()
    .single()

  if (error) throw error
  return data
}
```

**After (WatermelonDB)**:
```typescript
// src/services/wineApi.ts
import { database } from '../database'

export async function createWine(wineData) {
  const wine = await database.write(async () => {
    return await database.collections.get('wines').create(wine => {
      wine.name = wineData.name
      wine.producer = wineData.producer
      wine.vintage = wineData.vintage
      // ... 他のフィールド
    })
  })

  return wine._raw // Plainオブジェクトとして返す
}
```

#### 書き換え対象ファイル
- ✅ `src/services/wineApi.ts` - ワインCRUD
- ✅ `src/services/wineImageApi.ts` - 画像CRUD
- ✅ `src/services/cellarApi.ts` - セラーCRUD
- ✅ `src/services/storageApi.ts` → `src/services/fileApi.ts`（画像ローカル保存）

---

### フェーズ3: 画像管理の変更（Week 2）

#### Supabase Storage → ローカルファイルシステム

**新ファイル**: `src/services/fileApi.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import { compressImage } from '../utils/imageCompressor';

const IMAGES_DIR = `${FileSystem.documentDirectory}wine-images/`;

// ディレクトリ作成
export async function initImageDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

// 画像保存
export async function saveWineImage(
  wineId: string,
  base64Image: string,
  displayOrder: number
): Promise<string> {
  // 1. 画像圧縮（既存のcompressImage関数を使用）
  const compressed = await compressImage(base64Image, 1200, 0.7);

  // 2. ファイル名生成
  const filename = `wine_${wineId}_${displayOrder}_${Date.now()}.jpg`;
  const filepath = `${IMAGES_DIR}${filename}`;

  // 3. ローカルに保存
  await FileSystem.writeAsStringAsync(filepath, compressed, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 4. サムネイル生成（一覧表示用）
  const thumbnail = await compressImage(base64Image, 300, 0.6);
  const thumbnailPath = `${IMAGES_DIR}thumb_${filename}`;
  await FileSystem.writeAsStringAsync(thumbnailPath, thumbnail, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 5. 相対パスを返す
  return `wine-images/${filename}`;
}

// 画像削除
export async function deleteWineImage(relativePath: string) {
  const absolutePath = `${FileSystem.documentDirectory}${relativePath}`;
  await FileSystem.deleteAsync(absolutePath, { idempotent: true });

  // サムネイルも削除
  const thumbnailPath = absolutePath.replace('wine_', 'thumb_wine_');
  await FileSystem.deleteAsync(thumbnailPath, { idempotent: true });
}

// 画像URI取得
export function getImageUri(relativePath: string): string {
  return `${FileSystem.documentDirectory}${relativePath}`;
}
```

#### 画像表示の変更

**Before**:
```typescript
<Image source={{ uri: wineImage.image_url }} />
```

**After**:
```typescript
import { getImageUri } from '../services/fileApi';

<Image source={{ uri: getImageUri(wineImage.image_path) }} />
```

---

### フェーズ4: Zustandストアの調整（Week 3）

#### 現状の問題
Zustandは「Supabaseから取得したデータを保持」する設計。
WatermelonDBでは「DBから直接Observableで購読」する設計。

#### 解決策: ハイブリッドアプローチ

**Option A: Zustandを廃止してWatermelonDBのみ**
- WatermelonDBのObservableを直接使用
- リアルタイム更新が自動
- コード変更が大きい

**Option B: Zustandを維持（推奨）**
- WatermelonDBから取得したデータをZustandで管理
- 既存のコンポーネントは変更不要
- データ取得時にWatermelonDBから読み込み

**実装（Option B）**:

```typescript
// src/store/wineStore.ts
import { create } from 'zustand';
import { database } from '../database';
import Wine from '../database/models/Wine';

interface WineStore {
  wines: any[];
  loadWines: () => Promise<void>;
  addWine: (wine: any) => void;
  updateWine: (id: string, wine: any) => void;
  deleteWine: (id: string) => void;
}

export const useWineStore = create<WineStore>((set) => ({
  wines: [],

  loadWines: async () => {
    const winesCollection = database.collections.get<Wine>('wines');
    const wines = await winesCollection.query().fetch();
    set({ wines: wines.map(w => w._raw) });
  },

  addWine: (wine) => {
    set((state) => ({ wines: [...state.wines, wine] }));
  },

  // ... 他のメソッド
}));
```

---

### フェーズ5: iCloudバックアップ（Week 3-4）

#### 実装

**新ファイル**: `src/services/backupService.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ICLOUD_DIR = FileSystem.documentDirectory + '../Library/Mobile Documents/iCloud~com~winecellar~/Documents/';

// iCloud利用可能かチェック
export async function isICloudAvailable(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(ICLOUD_DIR);
    return info.exists;
  } catch {
    return false;
  }
}

// 自動バックアップ設定取得
export async function isAutoBackupEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem('auto_backup_enabled');
  return enabled === 'true';
}

// バックアップ実行
export async function backupToiCloud(): Promise<void> {
  if (!await isICloudAvailable()) {
    throw new Error('iCloud Drive is not available');
  }

  // 1. SQLiteファイルをバックアップ
  const dbPath = `${FileSystem.documentDirectory}SQLite/WineCellar.db`;
  const backupPath = `${ICLOUD_DIR}backup_${Date.now()}.db`;
  await FileSystem.copyAsync({ from: dbPath, to: backupPath });

  // 2. 画像フォルダを同期
  const imagesDir = `${FileSystem.documentDirectory}wine-images/`;
  const imagesBackupDir = `${ICLOUD_DIR}wine-images/`;
  await FileSystem.copyAsync({ from: imagesDir, to: imagesBackupDir });

  // 3. バックアップ日時を保存
  await AsyncStorage.setItem('last_backup', new Date().toISOString());
}

// データ復元
export async function restoreFromiCloud(): Promise<void> {
  // 最新のバックアップファイルを検索
  const files = await FileSystem.readDirectoryAsync(ICLOUD_DIR);
  const backupFiles = files.filter(f => f.startsWith('backup_')).sort().reverse();

  if (backupFiles.length === 0) {
    throw new Error('No backup found');
  }

  const latestBackup = backupFiles[0];

  // 1. DBを復元
  const dbPath = `${FileSystem.documentDirectory}SQLite/WineCellar.db`;
  await FileSystem.copyAsync({
    from: `${ICLOUD_DIR}${latestBackup}`,
    to: dbPath
  });

  // 2. 画像を復元
  const imagesDir = `${FileSystem.documentDirectory}wine-images/`;
  const imagesBackupDir = `${ICLOUD_DIR}wine-images/`;
  await FileSystem.copyAsync({ from: imagesBackupDir, to: imagesDir });
}

// 定期バックアップ（バックグラウンドタスク）
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKUP_TASK = 'background-backup';

TaskManager.defineTask(BACKUP_TASK, async () => {
  try {
    if (await isAutoBackupEnabled()) {
      await backupToiCloud();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundBackup() {
  await BackgroundFetch.registerTaskAsync(BACKUP_TASK, {
    minimumInterval: 60 * 60 * 24, // 24時間ごと
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

#### 設定画面にUI追加

```typescript
// app/(tabs)/settings.tsx に追加

const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
const [lastBackup, setLastBackup] = useState<string | null>(null);

// バックアップON/OFF
<View style={styles.settingRow}>
  <Text>iCloud自動バックアップ</Text>
  <Switch
    value={autoBackupEnabled}
    onValueChange={async (value) => {
      setAutoBackupEnabled(value);
      await AsyncStorage.setItem('auto_backup_enabled', value.toString());
    }}
  />
</View>

// 今すぐバックアップボタン
<TouchableOpacity
  style={styles.button}
  onPress={async () => {
    try {
      await backupToiCloud();
      alert('バックアップが完了しました');
    } catch (error) {
      alert('バックアップに失敗しました');
    }
  }}
>
  <Text>今すぐバックアップ</Text>
</TouchableOpacity>

// 復元ボタン
<TouchableOpacity
  style={styles.button}
  onPress={async () => {
    if (confirm('現在のデータは削除されます。復元しますか？')) {
      try {
        await restoreFromiCloud();
        alert('復元が完了しました。アプリを再起動してください。');
      } catch (error) {
        alert('復元に失敗しました');
      }
    }
  }}
>
  <Text>iCloudから復元</Text>
</TouchableOpacity>
```

---

### フェーズ6: データ移行ツール（Week 4）

#### Supabaseからローカルへの一括移行

**新ファイル**: `scripts/migrate-from-supabase.ts`

```typescript
import { supabase } from '../src/services/supabase';
import { database } from '../src/database';
import * as FileSystem from 'expo-file-system';

export async function migrateFromSupabase() {
  console.log('Starting migration from Supabase...');

  // 1. ワインデータ移行
  const { data: wines, error: winesError } = await supabase
    .from('wines')
    .select('*');

  if (winesError) throw winesError;

  await database.write(async () => {
    const winesCollection = database.collections.get('wines');

    for (const wine of wines) {
      await winesCollection.create(w => {
        w._raw.id = wine.id; // IDを維持
        w.name = wine.name;
        w.producer = wine.producer;
        // ... 他のフィールド
      });
    }
  });

  console.log(`Migrated ${wines.length} wines`);

  // 2. 画像移行
  const { data: images, error: imagesError } = await supabase
    .from('wine_images')
    .select('*');

  if (imagesError) throw imagesError;

  for (const image of images) {
    // Supabase Storageから画像ダウンロード
    const { data: blob } = await supabase.storage
      .from('wine-images')
      .download(image.image_url);

    // Base64に変換
    const base64 = await blobToBase64(blob);

    // ローカルに保存
    const localPath = await saveWineImage(
      image.wine_id,
      base64,
      image.display_order
    );

    // DBに登録
    await database.write(async () => {
      const imagesCollection = database.collections.get('wine_images');
      await imagesCollection.create(img => {
        img.wineId = image.wine_id;
        img.imagePath = localPath;
        img.displayOrder = image.display_order;
      });
    });
  }

  console.log(`Migrated ${images.length} images`);

  // 3. テイスティングノート移行
  // ... 同様の処理

  // 4. 飲酒記録移行
  // ... 同様の処理

  console.log('Migration completed!');
}
```

#### 移行UI（初回起動時）

```typescript
// app/_layout.tsx に追加

const [showMigration, setShowMigration] = useState(false);

useEffect(() => {
  checkMigrationStatus();
}, []);

async function checkMigrationStatus() {
  const migrated = await AsyncStorage.getItem('migrated_from_supabase');
  if (!migrated) {
    setShowMigration(true);
  }
}

{showMigration && (
  <Modal visible={showMigration}>
    <View style={styles.migrationModal}>
      <Text>Supabaseからデータを移行しますか？</Text>
      <Button
        title="移行する"
        onPress={async () => {
          await migrateFromSupabase();
          await AsyncStorage.setItem('migrated_from_supabase', 'true');
          setShowMigration(false);
        }}
      />
      <Button
        title="スキップ"
        onPress={() => {
          setShowMigration(false);
        }}
      />
    </View>
  </Modal>
)}
```

---

### フェーズ7: テスト＆最適化（Week 5）

#### テスト項目

**機能テスト**:
- [ ] ワイン追加・編集・削除
- [ ] 画像アップロード・削除
- [ ] セラーマップ機能
- [ ] テイスティングノート
- [ ] 飲酒記録
- [ ] AIチャット（APIキー方式）

**オフラインテスト**:
- [ ] 機内モードで全機能動作
- [ ] データ永続化確認
- [ ] 画像表示確認

**パフォーマンステスト**:
- [ ] 1,000件のワインでスムーズに動作
- [ ] 画像読み込み速度
- [ ] 検索・フィルターの速度

**バックアップテスト**:
- [ ] iCloudバックアップ成功
- [ ] データ復元成功
- [ ] 画像も含めて完全復元

**機種変更シミュレーション**:
- [ ] 旧端末でバックアップ
- [ ] 新端末にアプリインストール
- [ ] データ復元
- [ ] 全機能正常動作

---

## 削除するファイル・コード

### 削除対象
- ❌ `src/services/supabase.ts` - Supabaseクライアント
- ❌ `src/services/storageApi.ts` - Supabase Storage API
- ❌ `supabase-*.sql` - SQLスキーマファイル
- ❌ `.env`のSupabase関連変数（OpenAI/Visionは残す）

### 保持するファイル
- ✅ `src/services/openai.ts` - AIチャット
- ✅ `src/services/visionApi.ts` - 画像認識
- ✅ その他のUIコンポーネント

---

## パッケージ変更

### 追加
```json
{
  "@nozbe/watermelondb": "^0.27.1",
  "@nozbe/with-observables": "^1.6.0",
  "expo-file-system": "^17.0.1",
  "expo-background-fetch": "^12.0.1",
  "expo-task-manager": "^11.8.2"
}
```

### 削除
```json
{
  "@supabase/supabase-js": "削除"
}
```

---

## 工数見積もり

| フェーズ | 内容 | 工数 |
|---------|------|------|
| 1 | WatermelonDBセットアップ | 5日 |
| 2 | API層書き換え | 7日 |
| 3 | 画像管理変更 | 3日 |
| 4 | Zustandストア調整 | 2日 |
| 5 | iCloudバックアップ | 5日 |
| 6 | データ移行ツール | 3日 |
| 7 | テスト＆最適化 | 5日 |
| **合計** | | **30日（6週間）** |

---

## リスクと対策

### リスク1: WatermelonDB + Expoの互換性問題
**対策**: 事前に小規模プロトタイプで検証

### リスク2: 画像データの容量問題
**対策**:
- サムネイル生成で容量削減
- 圧縮品質を調整可能に
- 定期的なクリーンアップ機能

### リスク3: iCloudバックアップの失敗
**対策**:
- 手動エクスポート（CSV）も併用
- エラーハンドリング強化
- リトライ機能実装

### リスク4: データ移行の失敗
**対策**:
- 移行前にSupabaseデータをエクスポート
- ロールバック機能実装
- 段階的な移行（テストデータで先行）

---

## 次のステップ

1. **承認** - この計画でOKか確認
2. **プロトタイプ作成** - WatermelonDB動作確認（2日）
3. **本実装開始** - フェーズ1から順次実施
4. **週次レビュー** - 進捗確認と調整

---

**準備はいいですか？実装を開始しましょう！**
