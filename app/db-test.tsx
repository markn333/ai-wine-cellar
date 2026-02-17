/**
 * WatermelonDB プロトタイプ検証画面
 * DBが正常に動作するかテストします
 * 検証完了後は削除予定
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { database } from '../src/database';
import Wine from '../src/database/models/Wine';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export default function DbTestScreen() {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'DB初期化', status: 'pending' },
    { name: 'ワイン作成 (CREATE)', status: 'pending' },
    { name: 'ワイン取得 (READ)', status: 'pending' },
    { name: 'ワイン更新 (UPDATE)', status: 'pending' },
    { name: 'ワイン削除 (DELETE)', status: 'pending' },
    { name: '100件作成（パフォーマンス）', status: 'pending' },
    { name: '100件取得（パフォーマンス）', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdWineId, setCreatedWineId] = useState<string | null>(null);

  const updateResult = (
    index: number,
    status: TestResult['status'],
    message?: string,
    duration?: number
  ) => {
    setResults((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, status, message, duration } : r
      )
    );
  };

  const runAllTests = async () => {
    setIsRunning(true);
    let wineId: string | null = null;

    // テスト0: DB初期化
    updateResult(0, 'running');
    try {
      const start = Date.now();
      await database.collections.get<Wine>('wines').query().fetchCount();
      updateResult(0, 'success', 'DBに正常に接続しました', Date.now() - start);
    } catch (e: any) {
      updateResult(0, 'error', e.message);
      setIsRunning(false);
      return;
    }

    // テスト1: CREATE
    updateResult(1, 'running');
    try {
      const start = Date.now();
      const wine = await database.write(async () => {
        return database.collections.get<Wine>('wines').create((w) => {
          w.name = 'テストワイン シャトー・マルゴー';
          w.producer = 'テスト生産者';
          w.vintage = 2018;
          w.type = 'red';
          w.country = 'フランス';
          w.region = 'ボルドー';
          w.grapeVarietyRaw = JSON.stringify(['カベルネ・ソーヴィニヨン']);
          w.quantity = 3;
          w.purchasePrice = 15000;
          w.notes = 'WatermelonDBテスト用';
        });
      });
      wineId = wine.id;
      setCreatedWineId(wine.id);
      updateResult(1, 'success', `ID: ${wine.id.slice(0, 8)}... で作成`, Date.now() - start);
    } catch (e: any) {
      updateResult(1, 'error', e.message);
      setIsRunning(false);
      return;
    }

    // テスト2: READ
    updateResult(2, 'running');
    try {
      const start = Date.now();
      const wines = await database.collections.get<Wine>('wines').query().fetch();
      const found = wines.find((w) => w.id === wineId);
      if (!found) throw new Error('作成したワインが見つかりません');
      updateResult(
        2,
        'success',
        `${wines.length}件取得。名前: "${found.name}"`,
        Date.now() - start
      );
    } catch (e: any) {
      updateResult(2, 'error', e.message);
    }

    // テスト3: UPDATE
    updateResult(3, 'running');
    try {
      const start = Date.now();
      const wine = await database.collections.get<Wine>('wines').find(wineId!);
      await database.write(async () => {
        await wine.update((w) => {
          w.quantity = 5;
          w.notes = 'WatermelonDBテスト用（更新済み）';
        });
      });
      // 更新確認
      const updated = await database.collections.get<Wine>('wines').find(wineId!);
      if (updated.quantity !== 5) throw new Error('更新が反映されていません');
      updateResult(3, 'success', `在庫数を 3 → 5 に更新`, Date.now() - start);
    } catch (e: any) {
      updateResult(3, 'error', e.message);
    }

    // テスト4: DELETE
    updateResult(4, 'running');
    try {
      const start = Date.now();
      const wine = await database.collections.get<Wine>('wines').find(wineId!);
      await database.write(async () => {
        await wine.destroyPermanently();
      });
      // 削除確認
      const count = await database.collections.get<Wine>('wines').query().fetchCount();
      updateResult(4, 'success', `削除完了。残り ${count} 件`, Date.now() - start);
      setCreatedWineId(null);
    } catch (e: any) {
      updateResult(4, 'error', e.message);
    }

    // テスト5: 100件作成パフォーマンス
    updateResult(5, 'running');
    try {
      const start = Date.now();
      await database.write(async () => {
        const creates = Array.from({ length: 100 }, (_, i) =>
          database.collections.get<Wine>('wines').prepareCreate((w) => {
            w.name = `パフォーマンステスト ワイン ${i + 1}`;
            w.producer = `生産者 ${i + 1}`;
            w.type = 'red';
            w.country = 'フランス';
            w.quantity = 1;
          })
        );
        await database.batch(...creates);
      });
      const duration = Date.now() - start;
      updateResult(5, 'success', `100件を ${duration}ms で作成`, duration);
    } catch (e: any) {
      updateResult(5, 'error', e.message);
    }

    // テスト6: 100件取得パフォーマンス
    updateResult(6, 'running');
    try {
      const start = Date.now();
      const wines = await database.collections.get<Wine>('wines').query().fetch();
      const duration = Date.now() - start;
      updateResult(6, 'success', `${wines.length}件を ${duration}ms で取得`, duration);
    } catch (e: any) {
      updateResult(6, 'error', e.message);
    }

    // クリーンアップ: 全テストデータ削除
    try {
      await database.write(async () => {
        const all = await database.collections.get<Wine>('wines').query().fetch();
        const deletes = all.map((w) => w.prepareDestroyPermanently());
        await database.batch(...deletes);
      });
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return { name: 'check-circle', color: '#10B981' };
      case 'error': return { name: 'close-circle', color: '#EF4444' };
      case 'running': return { name: 'loading', color: '#7C3AED' };
      default: return { name: 'circle-outline', color: '#D1D5DB' };
    }
  };

  const allDone = results.every((r) => r.status === 'success' || r.status === 'error');
  const allSuccess = results.every((r) => r.status === 'success');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WatermelonDB 検証</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="database" size={24} color="#7C3AED" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>プロトタイプ検証</Text>
            <Text style={styles.infoText}>
              WatermelonDB（ローカルDB）の基本動作とパフォーマンスを確認します
            </Text>
          </View>
        </View>

        {allDone && (
          <View style={[styles.summaryCard, allSuccess ? styles.summarySuccess : styles.summaryError]}>
            <MaterialCommunityIcons
              name={allSuccess ? 'check-circle' : 'alert-circle'}
              size={28}
              color={allSuccess ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.summaryText, { color: allSuccess ? '#065F46' : '#991B1B' }]}>
              {allSuccess
                ? '✅ 全テスト合格！本実装に進めます'
                : '⚠️ 一部のテストが失敗しました'}
            </Text>
          </View>
        )}

        <View style={styles.testList}>
          {results.map((result, index) => {
            const icon = getStatusIcon(result.status);
            return (
              <View key={index} style={styles.testItem}>
                <View style={styles.testHeader}>
                  {result.status === 'running' ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <MaterialCommunityIcons
                      name={icon.name as any}
                      size={22}
                      color={icon.color}
                    />
                  )}
                  <Text style={styles.testName}>{result.name}</Text>
                  {result.duration !== undefined && (
                    <Text style={styles.testDuration}>{result.duration}ms</Text>
                  )}
                </View>
                {result.message && (
                  <Text
                    style={[
                      styles.testMessage,
                      result.status === 'error' && styles.testMessageError,
                    ]}
                  >
                    {result.message}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialCommunityIcons name="play" size={20} color="#fff" />
          )}
          <Text style={styles.runButtonText}>
            {isRunning ? 'テスト実行中...' : 'テストを実行'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#7C3AED',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B21B6',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6D28D9',
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summarySuccess: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  summaryError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  testList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  testDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  testMessage: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 32,
  },
  testMessageError: {
    color: '#EF4444',
  },
  runButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  runButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
