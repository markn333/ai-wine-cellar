import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Cellar extends Model {
  static table = 'cellars';

  @field('name') name!: string;
  @field('rows') rows!: number;
  @field('columns') columns!: number;
  @field('layout_config') layoutConfigRaw!: string | null;
  @field('notes') notes!: string | null;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get layoutConfig(): Record<string, any> | null {
    try {
      return this.layoutConfigRaw ? JSON.parse(this.layoutConfigRaw) : null;
    } catch {
      return null;
    }
  }
}
