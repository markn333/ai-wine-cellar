/**
 * ウェブ用のデータベース設定
 * LokiJSアダプターを使用（IndexedDBで永続化）
 */
import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import schema from './schema';
import Wine from './models/Wine';
import WineImage from './models/WineImage';
import Cellar from './models/Cellar';
import TastingNote from './models/TastingNote';
import DrinkingRecord from './models/DrinkingRecord';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: 'WineCellar',
  onSetUpError: (error: Error) => {
    console.error('WatermelonDB (LokiJS) setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Wine,
    WineImage,
    Cellar,
    TastingNote,
    DrinkingRecord,
  ],
});

export { Wine, WineImage, Cellar, TastingNote, DrinkingRecord };
