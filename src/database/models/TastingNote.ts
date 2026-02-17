import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class TastingNote extends Model {
  static table = 'tasting_notes';

  static associations = {
    wines: { type: 'belongs_to' as const, key: 'wine_id' },
  };

  @field('wine_id') wineId!: string;
  @field('rating') rating!: number;
  @field('tasted_at') tastedAt!: string;
  @field('appearance') appearance!: string | null;
  @field('aroma') aroma!: string | null;
  @field('taste') taste!: string | null;
  @field('finish') finish!: string | null;
  @field('food_pairing') foodPairing!: string | null;
  @field('notes') notes!: string | null;

  @readonly @date('created_at') createdAt!: Date;

  @relation('wines', 'wine_id') wine!: any;
}
