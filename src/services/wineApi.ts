import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import WineModel from '../database/models/Wine';
import TastingNoteModel from '../database/models/TastingNote';
import DrinkingRecordModel from '../database/models/DrinkingRecord';
import { wineToPlain, tastingNoteToPlain, drinkingRecordToPlain } from '../database/helpers';
import { Wine, TastingNote, DrinkingRecord } from '../types/wine';
import { removeAllWineImages } from './wineImageApi';

// Wines

export async function fetchWines(): Promise<Wine[]> {
  const wines = await database.collections
    .get<WineModel>('wines')
    .query(Q.sortBy('created_at', Q.desc))
    .fetch();
  return wines.map(wineToPlain);
}

export async function createWine(
  wineData: Omit<Wine, 'id' | 'created_at' | 'updated_at'>
): Promise<Wine> {
  const wine = await database.write(async () => {
    return database.collections.get<WineModel>('wines').create((w) => {
      w.name = wineData.name;
      w.producer = wineData.producer;
      w.vintage = wineData.vintage ?? null;
      w.type = wineData.type;
      w.country = wineData.country;
      w.region = wineData.region ?? null;
      w.grapeVarietyRaw = wineData.grape_variety
        ? JSON.stringify(wineData.grape_variety)
        : null;
      w.quantity = wineData.quantity;
      w.purchasePrice = wineData.purchase_price ?? null;
      w.purchaseDate = wineData.purchase_date ?? null;
      w.purchaseLocation = wineData.purchase_location ?? null;
      w.bottleSize = wineData.bottle_size?.toString() ?? null;
      w.alcoholContent = wineData.alcohol_content ?? null;
      w.drinkFrom = wineData.drink_from ? parseInt(wineData.drink_from) : null;
      w.drinkTo = wineData.drink_to ? parseInt(wineData.drink_to) : null;
      w.cellarLocation = wineData.cellar_location ?? null;
      w.cellarId = wineData.cellar_id ?? null;
      w.positionRow = wineData.position_row ?? null;
      w.positionColumn = wineData.position_column ?? null;
      w.notes = wineData.notes ?? null;
    });
  });
  return wineToPlain(wine);
}

export async function updateWine(id: string, wineData: Partial<Wine>): Promise<Wine> {
  const wine = await database.collections.get<WineModel>('wines').find(id);
  const updated = await database.write(async () => {
    return wine.update((w) => {
      if (wineData.name !== undefined) w.name = wineData.name;
      if (wineData.producer !== undefined) w.producer = wineData.producer;
      if (wineData.vintage !== undefined) w.vintage = wineData.vintage ?? null;
      if (wineData.type !== undefined) w.type = wineData.type;
      if (wineData.country !== undefined) w.country = wineData.country;
      if (wineData.region !== undefined) w.region = wineData.region ?? null;
      if (wineData.grape_variety !== undefined) {
        w.grapeVarietyRaw = wineData.grape_variety
          ? JSON.stringify(wineData.grape_variety)
          : null;
      }
      if (wineData.quantity !== undefined) w.quantity = wineData.quantity;
      if (wineData.purchase_price !== undefined) w.purchasePrice = wineData.purchase_price ?? null;
      if (wineData.purchase_date !== undefined) w.purchaseDate = wineData.purchase_date ?? null;
      if (wineData.purchase_location !== undefined) w.purchaseLocation = wineData.purchase_location ?? null;
      if (wineData.bottle_size !== undefined) w.bottleSize = wineData.bottle_size?.toString() ?? null;
      if (wineData.alcohol_content !== undefined) w.alcoholContent = wineData.alcohol_content ?? null;
      if (wineData.drink_from !== undefined) w.drinkFrom = wineData.drink_from ? parseInt(wineData.drink_from) : null;
      if (wineData.drink_to !== undefined) w.drinkTo = wineData.drink_to ? parseInt(wineData.drink_to) : null;
      if (wineData.cellar_location !== undefined) w.cellarLocation = wineData.cellar_location ?? null;
      if (wineData.cellar_id !== undefined) w.cellarId = wineData.cellar_id ?? null;
      if (wineData.position_row !== undefined) w.positionRow = wineData.position_row ?? null;
      if (wineData.position_column !== undefined) w.positionColumn = wineData.position_column ?? null;
      if (wineData.notes !== undefined) w.notes = wineData.notes ?? null;
    });
  });
  return wineToPlain(updated);
}

export async function deleteWine(id: string): Promise<void> {
  // 画像を先に削除
  await removeAllWineImages(id);

  const wine = await database.collections.get<WineModel>('wines').find(id);

  await database.write(async () => {
    // 関連するテイスティングノート・飲酒記録も削除
    const tastingNotes = await database.collections
      .get<TastingNoteModel>('tasting_notes')
      .query(Q.where('wine_id', id))
      .fetch();
    const drinkingRecords = await database.collections
      .get<DrinkingRecordModel>('drinking_records')
      .query(Q.where('wine_id', id))
      .fetch();

    const deletes = [
      ...tastingNotes.map((n) => n.prepareDestroyPermanently()),
      ...drinkingRecords.map((r) => r.prepareDestroyPermanently()),
      wine.prepareDestroyPermanently(),
    ];
    await database.batch(...deletes);
  });
}

// Tasting Notes

export async function fetchTastingNotes(wineId: string): Promise<TastingNote[]> {
  const notes = await database.collections
    .get<TastingNoteModel>('tasting_notes')
    .query(Q.where('wine_id', wineId), Q.sortBy('tasted_at', Q.desc))
    .fetch();
  return notes.map(tastingNoteToPlain);
}

export async function createTastingNote(
  note: Omit<TastingNote, 'id' | 'created_at'>
): Promise<TastingNote> {
  const created = await database.write(async () => {
    return database.collections.get<TastingNoteModel>('tasting_notes').create((n) => {
      n.wineId = note.wine_id;
      n.rating = note.rating;
      n.tastedAt = note.tasted_at;
      n.appearance = note.appearance ?? null;
      n.aroma = note.aroma ?? null;
      n.taste = note.taste ?? null;
      n.finish = note.finish ?? null;
      n.foodPairing = note.food_pairing ?? null;
      n.notes = note.notes ?? null;
    });
  });
  return tastingNoteToPlain(created);
}

export async function deleteTastingNote(id: string): Promise<void> {
  const note = await database.collections.get<TastingNoteModel>('tasting_notes').find(id);
  await database.write(async () => {
    await note.destroyPermanently();
  });
}

// Drinking Records

export async function fetchDrinkingRecords(wineId: string): Promise<DrinkingRecord[]> {
  const records = await database.collections
    .get<DrinkingRecordModel>('drinking_records')
    .query(Q.where('wine_id', wineId), Q.sortBy('drunk_at', Q.desc))
    .fetch();
  return records.map(drinkingRecordToPlain);
}

export async function createDrinkingRecord(
  record: Omit<DrinkingRecord, 'id' | 'created_at'>
): Promise<DrinkingRecord> {
  const created = await database.write(async () => {
    return database.collections.get<DrinkingRecordModel>('drinking_records').create((r) => {
      r.wineId = record.wine_id;
      r.quantity = record.quantity;
      r.drunkAt = record.drunk_at;
      r.occasion = record.occasion ?? null;
      r.notes = record.notes ?? null;
    });
  });
  return drinkingRecordToPlain(created);
}

export async function deleteDrinkingRecord(id: string): Promise<void> {
  const record = await database.collections.get<DrinkingRecordModel>('drinking_records').find(id);
  await database.write(async () => {
    await record.destroyPermanently();
  });
}

export async function drinkWine(
  wineId: string,
  quantity: number,
  occasion?: string,
  notes?: string
): Promise<void> {
  // 飲酒記録を作成
  await createDrinkingRecord({
    wine_id: wineId,
    quantity,
    drunk_at: new Date().toISOString(),
    occasion,
    notes,
  });

  // 在庫数を更新、0になった場合はセラー位置をクリア
  const wine = await database.collections.get<WineModel>('wines').find(wineId);
  await database.write(async () => {
    await wine.update((w) => {
      const newQuantity = Math.max(0, w.quantity - quantity);
      w.quantity = newQuantity;
      if (newQuantity === 0) {
        w.cellarId = null;
        w.positionRow = null;
        w.positionColumn = null;
      }
    });
  });
}
