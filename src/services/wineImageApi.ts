/**
 * Wine Image API（ローカルファイル版）
 * ワインの複数画像をローカルストレージで管理
 * Web: base64データURIをDBに直接保存
 * Native: expo-file-systemでローカルファイルに保存
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import WineImageModel from '../database/models/WineImage';
import { wineImageToPlain } from '../database/helpers';
import { WineImage } from '../types/wine';
import { compressImage } from './storageApi';

const IMAGES_DIR = Platform.OS !== 'web'
  ? `${FileSystem.documentDirectory}wine-images/`
  : '';

// ディレクトリ初期化（Native のみ）
async function ensureImagesDir(): Promise<void> {
  if (Platform.OS === 'web') return;
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

/**
 * ワインの画像一覧を取得
 */
export async function fetchWineImages(wineId: string): Promise<WineImage[]> {
  const images = await database.collections
    .get<WineImageModel>('wine_images')
    .query(Q.where('wine_id', wineId), Q.sortBy('display_order', Q.asc))
    .fetch();
  return images.map(wineImageToPlain);
}

/**
 * ワインに画像を追加
 * @param wineId - ワインID
 * @param base64Image - Base64エンコードされた画像データ
 */
export async function addWineImage(
  wineId: string,
  base64Image: string
): Promise<WineImage> {
  await ensureImagesDir();

  // 現在の最大displayOrderを取得
  const existingImages = await database.collections
    .get<WineImageModel>('wine_images')
    .query(Q.where('wine_id', wineId), Q.sortBy('display_order', Q.desc))
    .fetch();

  const nextOrder = existingImages.length > 0
    ? existingImages[0].displayOrder + 1
    : 0;

  // 画像を圧縮
  const compressed = await compressImage(base64Image);

  let imagePath: string;

  if (Platform.OS === 'web') {
    // Web: data URIをDBに直接保存（ファイルシステム不使用）
    imagePath = `data:image/jpeg;base64,${compressed}`;
  } else {
    // Native: ローカルファイルに保存
    const filename = `wine_${wineId}_${nextOrder}_${Date.now()}.jpg`;
    const relativePath = `wine-images/${filename}`;
    const absolutePath = `${IMAGES_DIR}${filename}`;
    await FileSystem.writeAsStringAsync(absolutePath, compressed, {
      encoding: FileSystem.EncodingType.Base64,
    });
    imagePath = relativePath;
  }

  // DBに登録
  const imageRecord = await database.write(async () => {
    return database.collections.get<WineImageModel>('wine_images').create((img) => {
      img.wineId = wineId;
      img.imagePath = imagePath;
      img.displayOrder = nextOrder;
    });
  });

  return wineImageToPlain(imageRecord);
}

/**
 * ワインの画像を削除
 * @param imageId - 画像ID
 */
export async function removeWineImage(imageId: string): Promise<void> {
  const image = await database.collections.get<WineImageModel>('wine_images').find(imageId);

  // Native のみローカルファイルを削除
  if (Platform.OS !== 'web') {
    const absolutePath = `${FileSystem.documentDirectory}${image.imagePath}`;
    await FileSystem.deleteAsync(absolutePath, { idempotent: true });
  }

  // DBから削除
  await database.write(async () => {
    await image.destroyPermanently();
  });
}

/**
 * ワインの全画像を削除
 * @param wineId - ワインID
 */
export async function removeAllWineImages(wineId: string): Promise<void> {
  try {
    const images = await database.collections
      .get<WineImageModel>('wine_images')
      .query(Q.where('wine_id', wineId))
      .fetch();

    // Native のみローカルファイルを削除
    if (Platform.OS !== 'web') {
      for (const image of images) {
        const absolutePath = `${FileSystem.documentDirectory}${image.imagePath}`;
        await FileSystem.deleteAsync(absolutePath, { idempotent: true });
      }
    }

    // DBから一括削除
    await database.write(async () => {
      const deletes = images.map((img) => img.prepareDestroyPermanently());
      await database.batch(...deletes);
    });
  } catch (error) {
    console.error('Error removing all wine images:', error);
    // 削除エラーはログのみ（ワイン削除に影響させない）
  }
}

/**
 * 画像の並び順を変更
 */
export async function reorderWineImage(imageId: string, newOrder: number): Promise<void> {
  const image = await database.collections.get<WineImageModel>('wine_images').find(imageId);
  await database.write(async () => {
    await image.update((img) => {
      img.displayOrder = newOrder;
    });
  });
}

/**
 * 複数画像の並び順を一括更新
 */
export async function reorderWineImages(
  updates: { imageId: string; newOrder: number }[]
): Promise<void> {
  await database.write(async () => {
    const preparedUpdates = await Promise.all(
      updates.map(async ({ imageId, newOrder }) => {
        const image = await database.collections
          .get<WineImageModel>('wine_images')
          .find(imageId);
        return image.prepareUpdate((img) => {
          img.displayOrder = newOrder;
        });
      })
    );
    await database.batch(...preparedUpdates);
  });
}
