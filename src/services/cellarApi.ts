import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import CellarModel from '../database/models/Cellar';
import WineModel from '../database/models/Wine';
import { cellarToPlain, wineToPlain } from '../database/helpers';
import { Cellar, Wine } from '../types/wine';

// Cellars

export async function fetchCellars(): Promise<Cellar[]> {
  const cellars = await database.collections
    .get<CellarModel>('cellars')
    .query(Q.sortBy('created_at', Q.desc))
    .fetch();
  return cellars.map(cellarToPlain);
}

export async function fetchCellar(id: string): Promise<Cellar | null> {
  try {
    const cellar = await database.collections.get<CellarModel>('cellars').find(id);
    return cellarToPlain(cellar);
  } catch {
    return null;
  }
}

export async function createCellar(
  cellarData: Omit<Cellar, 'id' | 'created_at' | 'updated_at'>
): Promise<Cellar> {
  const cellar = await database.write(async () => {
    return database.collections.get<CellarModel>('cellars').create((c) => {
      c.name = cellarData.name;
      c.rows = cellarData.rows;
      c.columns = cellarData.columns;
      c.layoutConfigRaw = cellarData.layout_config
        ? JSON.stringify(cellarData.layout_config)
        : null;
    });
  });
  return cellarToPlain(cellar);
}

export async function updateCellar(id: string, cellarData: Partial<Cellar>): Promise<Cellar> {
  const cellar = await database.collections.get<CellarModel>('cellars').find(id);
  const updated = await database.write(async () => {
    return cellar.update((c) => {
      if (cellarData.name !== undefined) c.name = cellarData.name;
      if (cellarData.rows !== undefined) c.rows = cellarData.rows;
      if (cellarData.columns !== undefined) c.columns = cellarData.columns;
      if (cellarData.layout_config !== undefined) {
        c.layoutConfigRaw = cellarData.layout_config
          ? JSON.stringify(cellarData.layout_config)
          : null;
      }
    });
  });
  return cellarToPlain(updated);
}

export async function deleteCellar(id: string): Promise<void> {
  const cellar = await database.collections.get<CellarModel>('cellars').find(id);

  await database.write(async () => {
    // このセラーに属するワインのcellar_idをクリア
    const wines = await database.collections
      .get<WineModel>('wines')
      .query(Q.where('cellar_id', id))
      .fetch();

    const updates = wines.map((w) =>
      w.prepareUpdate((wine) => {
        wine.cellarId = null;
        wine.positionRow = null;
        wine.positionColumn = null;
      })
    );

    await database.batch(...updates, cellar.prepareDestroyPermanently());
  });
}

// ワインの位置情報取得

export async function fetchWinesInCellar(cellarId: string): Promise<Wine[]> {
  const wines = await database.collections
    .get<WineModel>('wines')
    .query(Q.where('cellar_id', cellarId))
    .fetch();
  return wines.map(wineToPlain);
}

export async function fetchWineAtPosition(
  cellarId: string,
  row: number,
  column: number
): Promise<Wine | null> {
  const wines = await database.collections
    .get<WineModel>('wines')
    .query(
      Q.where('cellar_id', cellarId),
      Q.where('position_row', row),
      Q.where('position_column', column)
    )
    .fetch();

  return wines.length > 0 ? wineToPlain(wines[0]) : null;
}

export async function updateWinePosition(
  wineId: string,
  cellarId: string | null,
  row: number | null,
  column: number | null
): Promise<void> {
  const wine = await database.collections.get<WineModel>('wines').find(wineId);
  await database.write(async () => {
    await wine.update((w) => {
      w.cellarId = cellarId;
      w.positionRow = row;
      w.positionColumn = column;
    });
  });
}
