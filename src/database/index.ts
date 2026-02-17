/**
 * iOS/Android用のデータベース設定
 * SQLiteアダプターを使用（ローカル永続化）
 */
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from './schema';
import Wine from './models/Wine';
import WineImage from './models/WineImage';
import Cellar from './models/Cellar';
import TastingNote from './models/TastingNote';
import DrinkingRecord from './models/DrinkingRecord';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'WineCellar',
  jsi: false,
  onSetUpError: (error: Error) => {
    console.error('WatermelonDB (SQLite) setup error:', error);
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
