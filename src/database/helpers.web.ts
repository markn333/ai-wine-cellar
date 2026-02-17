/**
 * WatermelonDBモデルを既存のPlain Object型に変換するヘルパー（Web版）
 * Web環境ではexpo-file-systemが使用できないため、imagePath をそのままURIとして使用
 */
import WineModel from './models/Wine';
import WineImageModel from './models/WineImage';
import CellarModel from './models/Cellar';
import TastingNoteModel from './models/TastingNote';
import DrinkingRecordModel from './models/DrinkingRecord';
import { Wine, WineImage, Cellar, TastingNote, DrinkingRecord } from '../types/wine';

export function wineToPlain(w: WineModel): Wine {
  return {
    id: w.id,
    name: w.name,
    producer: w.producer,
    vintage: w.vintage ?? undefined,
    type: w.type as Wine['type'],
    country: w.country,
    region: w.region ?? undefined,
    grape_variety: w.grapeVariety.length > 0 ? w.grapeVariety : undefined,
    quantity: w.quantity,
    purchase_price: w.purchasePrice ?? undefined,
    purchase_date: w.purchaseDate ?? undefined,
    purchase_location: w.purchaseLocation ?? undefined,
    bottle_size: w.bottleSize ? (parseInt(w.bottleSize) || undefined) : undefined,
    alcohol_content: w.alcoholContent ?? undefined,
    drink_from: w.drinkFrom?.toString() ?? undefined,
    drink_to: w.drinkTo?.toString() ?? undefined,
    cellar_location: w.cellarLocation ?? undefined,
    cellar_id: w.cellarId ?? undefined,
    position_row: w.positionRow ?? undefined,
    position_column: w.positionColumn ?? undefined,
    notes: w.notes ?? undefined,
    created_at: w.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: w.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function wineImageToPlain(img: WineImageModel): WineImage {
  // Web版: imagePath はdata URI（base64）またはURLをそのままimage_urlとして使用
  return {
    id: img.id,
    wine_id: img.wineId,
    image_url: img.imagePath,
    display_order: img.displayOrder,
    created_at: img.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: img.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function cellarToPlain(c: CellarModel): Cellar {
  return {
    id: c.id,
    name: c.name,
    rows: c.rows,
    columns: c.columns,
    layout_config: c.layoutConfig,
    created_at: c.createdAt?.toISOString() ?? new Date().toISOString(),
    updated_at: c.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function tastingNoteToPlain(n: TastingNoteModel): TastingNote {
  return {
    id: n.id,
    wine_id: n.wineId,
    tasted_at: n.tastedAt,
    rating: n.rating,
    appearance: n.appearance ?? undefined,
    aroma: n.aroma ?? undefined,
    taste: n.taste ?? undefined,
    finish: n.finish ?? undefined,
    food_pairing: n.foodPairing ?? undefined,
    notes: n.notes ?? undefined,
    created_at: n.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function drinkingRecordToPlain(r: DrinkingRecordModel): DrinkingRecord {
  return {
    id: r.id,
    wine_id: r.wineId,
    quantity: r.quantity,
    drunk_at: r.drunkAt,
    occasion: r.occasion ?? undefined,
    notes: r.notes ?? undefined,
    created_at: r.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
