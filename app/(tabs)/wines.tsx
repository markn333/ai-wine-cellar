import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { useWineStore } from '../../src/store/wineStore';
import { fetchWines } from '../../src/services/wineApi';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WineType } from '../../src/types/wine';

export default function WinesScreen() {
  const wines = useWineStore((state) => state.wines);
  const setWines = useWineStore((state) => state.setWines);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<WineType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'vintage' | 'price' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadWines = async () => {
    try {
      setLoading(true);
      const data = await fetchWines();
      setWines(data);
    } catch (error) {
      console.error('Error fetching wines:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWines();
    setRefreshing(false);
  };

  useEffect(() => {
    loadWines();
  }, []);

  // フィルター・ソート・検索ロジック
  const filteredAndSortedWines = useMemo(() => {
    let result = [...wines];

    // 検索（名前、生産者、国、地域、品種）
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(wine => {
        // 名前と生産者
        if (wine.name.toLowerCase().includes(query) ||
            wine.producer.toLowerCase().includes(query)) {
          return true;
        }

        // 国
        if (wine.country && wine.country.toLowerCase().includes(query)) {
          return true;
        }

        // 地域
        if (wine.region && wine.region.toLowerCase().includes(query)) {
          return true;
        }

        // 品種（配列の場合）
        if (wine.grape_variety && Array.isArray(wine.grape_variety)) {
          return wine.grape_variety.some(variety =>
            variety.toLowerCase().includes(query)
          );
        }

        return false;
      });
    }

    // フィルター
    if (filterType !== 'all') {
      result = result.filter(wine => wine.type === filterType);
    }

    // ソート
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'vintage':
          comparison = (a.vintage || 0) - (b.vintage || 0);
          break;
        case 'price':
          comparison = (a.purchase_price || 0) - (b.purchase_price || 0);
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [wines, searchQuery, filterType, sortBy, sortOrder]);

  if (loading && wines.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  const wineTypes: (WineType | 'all')[] = ['all', 'red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
  const typeLabels = {
    all: 'すべて',
    red: '赤',
    white: '白',
    rose: 'ロゼ',
    sparkling: 'スパークリング',
    dessert: 'デザート',
    fortified: '酒精強化',
  };

  const sortOptions: { value: 'name' | 'vintage' | 'price' | 'date'; label: string }[] = [
    { value: 'date', label: '追加日' },
    { value: 'name', label: '名前' },
    { value: 'vintage', label: 'ヴィンテージ' },
    { value: 'price', label: '価格' },
  ];

  if (wines.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ワインが登録されていません</Text>
          <Text style={styles.emptySubtext}>「追加」タブからワインを登録してください</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {wines.length > 0 && (
        <>
          {/* 検索バー */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ワイン名、生産者、国、地域、品種で検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* フィルター */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>種類:</Text>
            <View style={styles.filterButtons}>
              {wineTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[styles.filterButtonText, filterType === type && styles.filterButtonTextActive]}>
                    {typeLabels[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ソート */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>並び替え:</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortButton, sortBy === option.value && styles.sortButtonActive]}
                onPress={() => {
                  if (sortBy === option.value) {
                    // 同じボタンをクリックした場合は昇順・降順を切り替え
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    // 別のボタンをクリックした場合は降順にリセット
                    setSortBy(option.value);
                    setSortOrder('desc');
                  }
                }}
              >
                <Text style={[styles.sortButtonText, sortBy === option.value && styles.sortButtonTextActive]}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <MaterialCommunityIcons
                    name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={14}
                    color={sortBy === option.value ? '#fff' : '#6B7280'}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* ワイン一覧 */}
          <FlatList
            data={filteredAndSortedWines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.wineCard}
              onPress={() => router.push(`/wine/${item.id}` as any)}
            >
              <Text style={styles.wineName}>{item.name}</Text>
              <Text style={styles.wineProducer}>{item.producer}</Text>
              <View style={styles.wineDetails}>
                {item.vintage && <Text style={styles.detailText}>{item.vintage}年</Text>}
                <Text style={styles.detailText}>{item.type}</Text>
                <Text style={styles.detailText}>{item.country}</Text>
              </View>
              <Text style={styles.quantityText}>在庫: {item.quantity}本</Text>
            </TouchableOpacity>
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
        </>
      )}
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  listContainer: {
    padding: 16,
  },
  wineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  wineProducer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  wineDetails: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  sortButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
