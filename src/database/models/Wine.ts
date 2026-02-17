import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators';

export default class Wine extends Model {
  static table = 'wines';

  static associations = {
    wine_images: { type: 'has_many' as const, foreignKey: 'wine_id' },
    tasting_notes: { type: 'has_many' as const, foreignKey: 'wine_id' },
    drinking_records: { type: 'has_many' as const, foreignKey: 'wine_id' },
  };

  @field('name') name!: string;
  @field('producer') producer!: string;
  @field('vintage') vintage!: number | null;
  @field('type') type!: string;
  @field('country') country!: string;
  @field('region') region!: string | null;
  @field('grape_variety') grapeVarietyRaw!: string | null; // JSON文字列
  @field('quantity') quantity!: number;
  @field('purchase_price') purchasePrice!: number | null;
  @field('purchase_date') purchaseDate!: string | null;
  @field('purchase_location') purchaseLocation!: string | null;
  @field('bottle_size') bottleSize!: string | null;
  @field('alcohol_content') alcoholContent!: number | null;
  @field('drink_from') drinkFrom!: number | null;
  @field('drink_to') drinkTo!: number | null;
  @field('cellar_location') cellarLocation!: string | null;
  @field('cellar_id') cellarId!: string | null;
  @field('position_row') positionRow!: number | null;
  @field('position_column') positionColumn!: number | null;
  @field('notes') notes!: string | null;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('wine_images') images!: any;
  @children('tasting_notes') tastingNotes!: any;
  @children('drinking_records') drinkingRecords!: any;

  // grape_variety をJSONとして扱うゲッター
  get grapeVariety(): string[] {
    try {
      return this.grapeVarietyRaw ? JSON.parse(this.grapeVarietyRaw) : [];
    } catch {
      return [];
    }
  }
}
