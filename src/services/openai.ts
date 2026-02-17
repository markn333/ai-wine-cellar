import OpenAI from 'openai';
import { useSettingsStore } from '../store/settingsStore';

// OpenAIクライアントを動的に生成する関数
function getOpenAIClient(): OpenAI {
  const apiKey = useSettingsStore.getState().openaiApiKey;

  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。設定画面でAPIキーを入力してください。');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // 開発用：本番環境ではバックエンドAPI経由を推奨
  });
}

export interface LabelRecognitionResult {
  name?: string;
  producer?: string;
  vintage?: number;
  country?: string;
  region?: string;
  grape_variety?: string[];
  confidence: number;
}

export async function recognizeWineLabel(imageBase64: string): Promise<LabelRecognitionResult> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたはワインラベルを認識する専門家です。画像からワインの情報を抽出してJSON形式で返してください。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '以下のワインラベル画像から、ワイン名、生産者、ヴィンテージ、国、地域、品種を抽出してください。確信度も0-1で示してください。',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as LabelRecognitionResult;
  } catch (error) {
    console.error('Error recognizing wine label:', error);
    throw error;
  }
}

export async function askSommelier(question: string, cellarContext?: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `あなたは経験豊富なソムリエです。ユーザーのワインセラーの在庫情報: ${cellarContext || '情報なし'}`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error asking sommelier:', error);
    throw error;
  }
}

export async function generateTastingNote(userInput: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'あなたはプロのソムリエです。ユーザーの簡単な感想から、詳細で専門的なテイスティングノートを生成してください。',
        },
        {
          role: 'user',
          content: `以下の感想から詳細なテイスティングノートを生成してください: ${userInput}`,
        },
      ],
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating tasting note:', error);
    throw error;
  }
}
