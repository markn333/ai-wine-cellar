export interface LabelRecognitionResult {
  name?: string;
  producer?: string;
  vintage?: number;
  country?: string;
  region?: string;
  grape_variety?: string[];
  confidence: number;
}

interface GoogleVisionTextAnnotation {
  description: string;
  locale?: string;
}

interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations?: GoogleVisionTextAnnotation[];
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
    error?: {
      message: string;
    };
  }>;
}

/**
 * Google Cloud Vision APIを使用してワインラベルを認識
 */
export async function recognizeWineLabel(imageBase64: string): Promise<LabelRecognitionResult> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

  if (!apiKey || apiKey === 'your_google_cloud_api_key') {
    throw new Error('Google Cloud API キーが設定されていません');
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data: GoogleVisionResponse = await response.json();
    const result = data.responses[0];

    if (result.error) {
      throw new Error(result.error.message);
    }

    // OCRで取得したテキスト
    const detectedText = result.textAnnotations?.[0]?.description || '';

    // ラベル検出結果（ワインかどうかの判定に使用）
    const labels = result.labelAnnotations || [];
    const isWineRelated = labels.some(
      (label) =>
        label.description.toLowerCase().includes('wine') ||
        label.description.toLowerCase().includes('bottle') ||
        label.description.toLowerCase().includes('drink')
    );

    // テキストから情報を抽出
    const extracted = extractWineInfo(detectedText);

    // 確信度の計算（ワイン関連ラベルが検出されたか + 抽出成功率）
    const confidenceScore = calculateConfidence(extracted, isWineRelated);

    return {
      ...extracted,
      confidence: confidenceScore,
    };
  } catch (error) {
    console.error('Error recognizing wine label:', error);
    throw error;
  }
}

/**
 * OCRテキストからワイン情報を抽出
 */
function extractWineInfo(text: string): Omit<LabelRecognitionResult, 'confidence'> {
  const lines = text.split('\n').filter((line) => line.trim());

  // ヴィンテージ（4桁の年号）を検出
  const vintageMatch = text.match(/\b(19|20)\d{2}\b/);
  const vintage = vintageMatch ? parseInt(vintageMatch[0]) : undefined;

  // 一般的なワイン生産国を検出
  const countries = [
    'フランス', 'France', 'イタリア', 'Italy', 'スペイン', 'Spain',
    'アメリカ', 'USA', 'United States', 'カリフォルニア', 'California',
    'チリ', 'Chile', 'アルゼンチン', 'Argentina', 'オーストラリア', 'Australia',
    'ドイツ', 'Germany', '日本', 'Japan', 'ニュージーランド', 'New Zealand',
    'ポルトガル', 'Portugal', '南アフリカ', 'South Africa'
  ];
  const country = countries.find((c) => text.includes(c));

  // フランスの主要地域を検出
  const regions = [
    'ボルドー', 'Bordeaux', 'ブルゴーニュ', 'Burgundy', 'Bourgogne',
    'シャンパーニュ', 'Champagne', 'ローヌ', 'Rhone', 'Rhône',
    'ロワール', 'Loire', 'アルザス', 'Alsace', 'プロヴァンス', 'Provence',
    'ラングドック', 'Languedoc', 'トスカーナ', 'Tuscany', 'Toscana',
    'ピエモンテ', 'Piedmont', 'Piemonte', 'リオハ', 'Rioja',
    'ナパ', 'Napa', 'ソノマ', 'Sonoma'
  ];
  const region = regions.find((r) => text.includes(r));

  // 主要ブドウ品種を検出
  const grapeVarieties = [
    'カベルネ・ソーヴィニヨン', 'Cabernet Sauvignon',
    'メルロー', 'Merlot', 'ピノ・ノワール', 'Pinot Noir',
    'シャルドネ', 'Chardonnay', 'ソーヴィニヨン・ブラン', 'Sauvignon Blanc',
    'シラー', 'Syrah', 'Shiraz', 'テンプラニーリョ', 'Tempranillo',
    'リースリング', 'Riesling', 'ピノ・グリージョ', 'Pinot Grigio',
    'サンジョヴェーゼ', 'Sangiovese', 'ネッビオーロ', 'Nebbiolo',
    'マルベック', 'Malbec', 'ジンファンデル', 'Zinfandel'
  ];
  const detectedGrapes = grapeVarieties.filter((g) => text.includes(g));

  // ワイン名と生産者の推定（最初の数行から）
  const firstLines = lines.slice(0, 3).join(' ');
  const name = lines[0] || undefined;
  const producer = lines[1] || undefined;

  return {
    name,
    producer,
    vintage,
    country,
    region,
    grape_variety: detectedGrapes.length > 0 ? detectedGrapes : undefined,
  };
}

/**
 * 確信度を計算
 */
function calculateConfidence(
  extracted: Omit<LabelRecognitionResult, 'confidence'>,
  isWineRelated: boolean
): number {
  let score = 0;

  // ワイン関連のラベルが検出された
  if (isWineRelated) score += 0.3;

  // 各フィールドが抽出できた場合に加点
  if (extracted.name) score += 0.15;
  if (extracted.producer) score += 0.15;
  if (extracted.vintage) score += 0.15;
  if (extracted.country) score += 0.1;
  if (extracted.region) score += 0.1;
  if (extracted.grape_variety && extracted.grape_variety.length > 0) score += 0.05;

  return Math.min(score, 1.0);
}
