import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class DrinkingRecord extends Model {
  static table = 'drinking_records';

  static associations = {
    wines: { type: 'belongs_to' as const, key: 'wine_id' },
  };

  @field('wine_id') wineId!: string;
  @field('quantity') quantity!: number;
  @field('drunk_at') drunkAt!: string;
  @field('occasion') occasion!: string | null;
  @field('notes') notes!: string | null;

  @readonly @date('created_at') createdAt!: Date;

  @relation('wines', 'wine_id') wine!: any;
}
