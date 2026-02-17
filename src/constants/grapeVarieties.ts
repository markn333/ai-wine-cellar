/**
 * Grape Varieties
 * ワイン用ぶどう主要品種
 */

export const RED_GRAPE_VARIETIES = [
  'カベルネ・ソーヴィニヨン',
  'メルロー',
  'ピノ・ノワール',
  'シラー/シラーズ',
  'テンプラニーリョ',
  'サンジョヴェーゼ',
  'ネッビオーロ',
  'マルベック',
  'カルメネール',
  'ジンファンデル',
  'グルナッシュ',
  'カベルネ・フラン',
  'マスカット・ベーリーA',
] as const;

export const WHITE_GRAPE_VARIETIES = [
  'シャルドネ',
  'ソーヴィニヨン・ブラン',
  'リースリング',
  'ピノ・グリ/ピノ・グリージョ',
  'ゲヴュルツトラミネール',
  'セミヨン',
  'ヴィオニエ',
  'アルバリーニョ',
  'モスカート',
  'トレッビアーノ',
  'シュナン・ブラン',
  '甲州',
  'デラウェア',
] as const;

export const GRAPE_VARIETY_OTHER = 'その他';

/**
 * ワインタイプに応じた品種リストを取得
 */
export function getGrapeVarietiesByType(wineType: string): string[] {
  if (wineType === 'red' || wineType === 'rose') {
    return [...RED_GRAPE_VARIETIES];
  } else if (wineType === 'white' || wineType === 'sparkling') {
    return [...WHITE_GRAPE_VARIETIES];
  } else {
    // デザートワインや酒精強化ワインは両方
    return [...RED_GRAPE_VARIETIES, ...WHITE_GRAPE_VARIETIES];
  }
}
