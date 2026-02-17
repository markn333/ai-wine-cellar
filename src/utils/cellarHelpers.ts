/**
 * Cellar Helper Functions
 * セラーマップの座標変換など
 */

/**
 * 列番号をアルファベットに変換
 * @param column - 列番号 (0-based)
 * @returns アルファベット (A, B, C, ...)
 */
export function columnToLetter(column: number): string {
  let letter = '';
  let num = column;

  while (num >= 0) {
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26) - 1;
  }

  return letter;
}

/**
 * 行番号を表示用に変換（1始まり）
 * @param row - 行番号 (0-based)
 * @returns 表示用の行番号 (1, 2, 3, ...)
 */
export function rowToDisplay(row: number): string {
  return (row + 1).toString();
}

/**
 * セラー位置を表示用の文字列に変換
 * @param row - 行番号 (0-based)
 * @param column - 列番号 (0-based)
 * @returns 表示用の位置 (例: "A-1", "B-3")
 */
export function formatCellarPosition(row: number, column: number): string {
  return `${columnToLetter(column)}-${rowToDisplay(row)}`;
}

/**
 * アルファベットを列番号に変換
 * @param letter - アルファベット (A, B, C, ...)
 * @returns 列番号 (0-based)
 */
export function letterToColumn(letter: string): number {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column = column * 26 + (letter.charCodeAt(i) - 64);
  }
  return column - 1;
}

/**
 * 表示用の行番号を内部番号に変換
 * @param displayRow - 表示用の行番号 (1, 2, 3, ...)
 * @returns 行番号 (0-based)
 */
export function displayToRow(displayRow: string): number {
  return parseInt(displayRow) - 1;
}
