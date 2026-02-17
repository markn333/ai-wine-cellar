/**
 * 画像ユーティリティ
 * Canvas APIを使った画像圧縮（Web互換）
 */

const MAX_IMAGE_WIDTH = 1200;
const IMAGE_QUALITY = 0.7;

/**
 * 画像を圧縮・リサイズ（Web互換版）
 * @param base64Image - Base64エンコードされた画像データ
 * @returns 圧縮された画像のBase64データ
 */
export async function compressImage(base64Image: string): Promise<string> {
  try {
    const imageUri = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          let newWidth = img.width;
          let newHeight = img.height;

          if (img.width > MAX_IMAGE_WIDTH) {
            newWidth = MAX_IMAGE_WIDTH;
            newHeight = (img.height * MAX_IMAGE_WIDTH) / img.width;
          }

          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          const compressed = canvas.toDataURL('image/jpeg', IMAGE_QUALITY).split(',')[1];
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUri;
    });
  } catch {
    // 圧縮失敗時は元の画像を返す
    return base64Image.startsWith('data:') ? base64Image.split(',')[1] : base64Image;
  }
}
