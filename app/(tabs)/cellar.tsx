import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useCellarStore } from '../../src/store/cellarStore';
import { fetchCellars, fetchWinesInCellar } from '../../src/services/cellarApi';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CellarsScreen() {
  const cellars = useCellarStore((state) => state.cellars);
  const setCellars = useCellarStore((state) => state.setCellars);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cellarWineCounts, setCellarWineCounts] = useState<Record<string, number>>({});

  const loadCellars = async () => {
    try {
      setLoading(true);
      const data = await fetchCellars();
      setCellars(data);

      // Load wine counts for each cellar
      const counts: Record<string, number> = {};
      for (const cellar of data) {
        const wines = await fetchWinesInCellar(cellar.id);
        counts[cellar.id] = wines.length;
      }
      setCellarWineCounts(counts);
    } catch (error) {
      console.error('Error fetching cellars:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCellars();
    setRefreshing(false);
  };

  useEffect(() => {
    loadCellars();
  }, []);

  if (loading && cellars.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (cellars.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="fridge-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>セラーが登録されていません</Text>
          <Text style={styles.emptySubtext}>セラーを追加してワインを整理しましょう</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/cellar/add' as any)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
            <Text style={styles.addButtonText}>セラーを追加</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cellars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cellarCard}>
            <TouchableOpacity
              style={styles.cellarCardMain}
              onPress={() => router.push(`/cellar/map/${item.id}` as any)}
            >
              <View style={styles.cellarIcon}>
                <MaterialCommunityIcons name="fridge" size={40} color="#7C3AED" />
              </View>
              <View style={styles.cellarInfo}>
                <Text style={styles.cellarName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.cellarDescription}>{item.description}</Text>
                )}
                <View style={styles.cellarDetails}>
                  <View style={styles.detailBadge}>
                    <MaterialCommunityIcons name="grid" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {item.rows} × {item.columns}
                    </Text>
                  </View>
                  <View style={styles.detailBadge}>
                    <MaterialCommunityIcons name="bottle-wine" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {cellarWineCounts[item.id] || 0}本
                    </Text>
                  </View>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/cellar/edit/${item.id}` as any)}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/cellar/add' as any)}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  cellarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cellarCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cellarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cellarInfo: {
    flex: 1,
  },
  cellarName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cellarDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cellarDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  editButton: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
