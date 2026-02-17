import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'cellars',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'rows', type: 'number' },
        { name: 'columns', type: 'number' },
        { name: 'layout_config', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'wines',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'producer', type: 'string' },
        { name: 'vintage', type: 'number', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'region', type: 'string', isOptional: true },
        { name: 'grape_variety', type: 'string', isOptional: true }, // JSON配列
        { name: 'quantity', type: 'number' },
        { name: 'purchase_price', type: 'number', isOptional: true },
        { name: 'purchase_date', type: 'string', isOptional: true },
        { name: 'purchase_location', type: 'string', isOptional: true },
        { name: 'bottle_size', type: 'string', isOptional: true },
        { name: 'alcohol_content', type: 'number', isOptional: true },
        { name: 'drink_from', type: 'number', isOptional: true },
        { name: 'drink_to', type: 'number', isOptional: true },
        { name: 'cellar_location', type: 'string', isOptional: true },
        { name: 'cellar_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'position_row', type: 'number', isOptional: true },
        { name: 'position_column', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'wine_images',
      columns: [
        { name: 'wine_id', type: 'string', isIndexed: true },
        { name: 'image_path', type: 'string' },
        { name: 'display_order', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tasting_notes',
      columns: [
        { name: 'wine_id', type: 'string', isIndexed: true },
        { name: 'rating', type: 'number' },
        { name: 'tasted_at', type: 'string' },
        { name: 'appearance', type: 'string', isOptional: true },
        { name: 'aroma', type: 'string', isOptional: true },
        { name: 'taste', type: 'string', isOptional: true },
        { name: 'finish', type: 'string', isOptional: true },
        { name: 'food_pairing', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'drinking_records',
      columns: [
        { name: 'wine_id', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'drunk_at', type: 'string' },
        { name: 'occasion', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
