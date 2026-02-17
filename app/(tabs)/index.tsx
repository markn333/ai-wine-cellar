import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useWineStore } from '../../src/store/wineStore';
import { fetchWines } from '../../src/services/wineApi';
import { router } from 'expo-router';

export default function HomeScreen() {
  const wines = useWineStore((state) => state.wines);
  const setWines = useWineStore((state) => state.setWines);

  const loadWines = async () => {
    try {
      const data = await fetchWines();
      setWines(data);
    } catch (error) {
      console.error('Error fetching wines:', error);
    }
  };

  useEffect(() => {
    loadWines();
  }, []);

  // Calculate statistics
  const totalBottles = wines.reduce((sum, wine) => sum + wine.quantity, 0);
  const totalValue = wines.reduce((sum, wine) => sum + (wine.purchase_price || 0) * wine.quantity, 0);

  // Count by type
  const countByType = wines.reduce((acc, wine) => {
    acc[wine.type] = (acc[wine.type] || 0) + wine.quantity;
    return acc;
  }, {} as Record<string, number>);

  const wineTypeLabels = {
    red: '赤',
    white: '白',
    rose: 'ロゼ',
    sparkling: 'スパークリング',
    dessert: 'デザート',
    fortified: '酒精強化',
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wine Cellar</Text>
        <Text style={styles.subtitle}>ワインセラー管理アプリ</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalBottles}</Text>
          <Text style={styles.statLabel}>総在庫本数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>¥{totalValue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>総額</Text>
        </View>
      </View>

      {wines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>種類別在庫</Text>
          <View style={styles.typeGrid}>
            {Object.entries(countByType).map(([type, count]) => (
              <View key={type} style={styles.typeCard}>
                <Text style={styles.typeLabel}>{wineTypeLabels[type as keyof typeof wineTypeLabels]}</Text>
                <Text style={styles.typeCount}>{count}本</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近追加したワイン</Text>
        {wines.length === 0 ? (
          <Text style={styles.emptyText}>まだワインが登録されていません</Text>
        ) : (
          wines.slice(0, 3).map((wine) => (
            <TouchableOpacity
              key={wine.id}
              style={styles.wineCard}
              onPress={() => router.push(`/wine/${wine.id}` as any)}
            >
              <Text style={styles.wineName}>{wine.name}</Text>
              <Text style={styles.wineDetails}>
                {wine.producer} • {wine.vintage ? `${wine.vintage}年` : ''}
              </Text>
            </TouchableOpacity>
          ))
        )}
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
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#E9D5FF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    minWidth: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  typeCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  wineCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  wineDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
});
