/**
 * Offline Queue Service
 * オフライン時の操作をキューに保存し、オンライン復帰時に同期
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_operation_queue';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'wine' | 'cellar' | 'tasting_note' | 'drinking_record' | 'wine_image';
  data: any;
  timestamp: number;
}

/**
 * 操作をキューに追加
 */
export async function addToQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp'>): Promise<void> {
  try {
    const queue = await getQueue();
    const newOperation: OfflineOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    queue.push(newOperation);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('Added operation to offline queue:', newOperation);
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
}

/**
 * キューを取得
 */
export async function getQueue(): Promise<OfflineOperation[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * キューをクリア
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('Offline queue cleared');
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}

/**
 * 特定の操作をキューから削除
 */
export async function removeFromQueue(operationId: string): Promise<void> {
  try {
    const queue = await getQueue();
    const updatedQueue = queue.filter((op) => op.id !== operationId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error removing from offline queue:', error);
  }
}

/**
 * キュー内の操作数を取得
 */
export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
