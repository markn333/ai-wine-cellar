import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class WineImage extends Model {
  static table = 'wine_images';

  static associations = {
    wines: { type: 'belongs_to' as const, key: 'wine_id' },
  };

  @field('wine_id') wineId!: string;
  @field('image_path') imagePath!: string;
  @field('display_order') displayOrder!: number;

  @readonly @date('created_at') createdAt!: Date;

  @relation('wines', 'wine_id') wine!: any;
}
