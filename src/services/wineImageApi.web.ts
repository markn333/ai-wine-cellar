/**
 * Wine Image API（Web版）
 * Web環境ではexpo-file-systemが使用できないため、
 * 圧縮済みbase64データURIをWatermelonDB（LokiJS）に直接保存
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import WineImageModel from '../database/models/WineImage';
import { wineImageToPlain } from '../database/helpers';
import { WineImage } from '../types/wine';
import { compressImage } from './storageApi';

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
 * ワインに画像を追加（Web版: base64 data URIをDBに保存）
 */
export async function addWineImage(
  wineId: string,
  base64Image: string
): Promise<WineImage> {
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

  // data URIとして保存（Web: ファイルシステムの代わりにDB直接保存）
  const dataUri = `data:image/jpeg;base64,${compressed}`;

  const imageRecord = await database.write(async () => {
    return database.collections.get<WineImageModel>('wine_images').create((img) => {
      img.wineId = wineId;
      img.imagePath = dataUri;
      img.displayOrder = nextOrder;
    });
  });

  return wineImageToPlain(imageRecord);
}

/**
 * ワインの画像を削除（Web版: DBレコードのみ削除）
 */
export async function removeWineImage(imageId: string): Promise<void> {
  const image = await database.collections.get<WineImageModel>('wine_images').find(imageId);
  await database.write(async () => {
    await image.destroyPermanently();
  });
}

/**
 * ワインの全画像を削除（Web版: DBレコードのみ削除）
 */
export async function removeAllWineImages(wineId: string): Promise<void> {
  try {
    const images = await database.collections
      .get<WineImageModel>('wine_images')
      .query(Q.where('wine_id', wineId))
      .fetch();

    await database.write(async () => {
      const deletes = images.map((img) => img.prepareDestroyPermanently());
      await database.batch(...deletes);
    });
  } catch (error) {
    console.error('Error removing all wine images:', error);
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
