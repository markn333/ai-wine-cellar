import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useWineStore } from '../../src/store/wineStore';
import { deleteWine, fetchTastingNotes, fetchDrinkingRecords, drinkWine, deleteTastingNote, deleteDrinkingRecord } from '../../src/services/wineApi';
import { fetchWineImages } from '../../src/services/wineImageApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TastingNote, DrinkingRecord, WineImage } from '../../src/types/wine';
import { formatCellarPosition } from '../../src/utils/cellarHelpers';

export default function WineDetailScreen() {
  const { id } = useLocalSearchParams();
  const wines = useWineStore((state) => state.wines);
  const wine = wines.find((w) => w.id === id);
  const removeWine = useWineStore((state) => state.deleteWine);
  const updateWineInStore = useWineStore((state) => state.updateWine);

  const [tastingNotes, setTastingNotes] = useState<TastingNote[]>([]);
  const [drinkingRecords, setDrinkingRecords] = useState<DrinkingRecord[]>([]);
  const [wineImages, setWineImages] = useState<WineImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [drinkQuantity, setDrinkQuantity] = useState('1');
  const [drinkOccasion, setDrinkOccasion] = useState('');
  const [drinkNotes, setDrinkNotes] = useState('');

  useEffect(() => {
    if (wine) {
      loadTastingNotes();
      loadDrinkingRecords();
      loadWineImages();
    }
  }, [wine]);

  const loadTastingNotes = async () => {
    if (!wine) return;
    try {
      const notes = await fetchTastingNotes(wine.id);
      setTastingNotes(notes);
    } catch (error) {
      console.error('Error loading tasting notes:', error);
    }
  };

  const loadDrinkingRecords = async () => {
    if (!wine) return;
    try {
      const records = await fetchDrinkingRecords(wine.id);
      setDrinkingRecords(records);
    } catch (error) {
      console.error('Error loading drinking records:', error);
    }
  };

  const loadWineImages = async () => {
    if (!wine) return;
    try {
      const images = await fetchWineImages(wine.id);
      setWineImages(images);
    } catch (error) {
      console.error('Error loading wine images:', error);
    }
  };

  if (!wine) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>ワインが見つかりません</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(`${wine.name}を削除しますか？`);
    if (!confirmed) return;

    try {
      await deleteWine(wine.id);
      removeWine(wine.id);
      router.back();
    } catch (error) {
      console.error('Error deleting wine:', error);
      alert('ワインの削除に失敗しました');
    }
  };

  const handleDeleteTastingNote = async (noteId: string) => {
    const confirmed = window.confirm('このテイスティングノートを削除しますか？');
    if (!confirmed) return;
    try {
      await deleteTastingNote(noteId);
      setTastingNotes(tastingNotes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting tasting note:', error);
      alert('テイスティングノートの削除に失敗しました');
    }
  };

  const handleDeleteDrinkingRecord = async (recordId: string) => {
    const confirmed = window.confirm('この飲酒記録を削除しますか？');
    if (!confirmed) return;
    try {
      await deleteDrinkingRecord(recordId);
      setDrinkingRecords(drinkingRecords.filter((r) => r.id !== recordId));
    } catch (error) {
      console.error('Error deleting drinking record:', error);
      alert('飲酒記録の削除に失敗しました');
    }
  };

  const handleEdit = () => {
    router.push(`/wine/edit/${wine.id}` as any);
  };

  const handleCopyWine = () => {
    if (window.confirm(`「${wine.name}」をコピーして新しいワインを登録しますか？`)) {
      router.push(`/add?copyFromId=${wine.id}` as any);
    }
  };

  const handleDrink = async () => {
    const quantity = parseInt(drinkQuantity);
    if (!quantity || quantity < 1) {
      alert('本数を入力してください');
      return;
    }
    if (quantity > wine.quantity) {
      alert('在庫数を超えています');
      return;
    }

    try {
      await drinkWine(wine.id, quantity, drinkOccasion || undefined, drinkNotes || undefined);
      // Update local store（在庫が0になった場合はセラー位置もクリア）
      const newQuantity = wine.quantity - quantity;
      const storeUpdate: Partial<typeof wine> = { quantity: newQuantity };
      if (newQuantity <= 0) {
        storeUpdate.cellar_id = undefined;
        storeUpdate.position_row = undefined;
        storeUpdate.position_column = undefined;
      }
      updateWineInStore(wine.id, storeUpdate);
      // Reload records
      await loadDrinkingRecords();
      // Reset form
      setShowDrinkModal(false);
      setDrinkQuantity('1');
      setDrinkOccasion('');
      setDrinkNotes('');
      alert('飲酒記録を保存しました');
    } catch (error) {
      console.error('Error recording drink:', error);
      alert('飲酒記録の保存に失敗しました');
    }
  };

  const wineTypeLabels = {
    red: '赤ワイン',
    white: '白ワイン',
    rose: 'ロゼ',
    sparkling: 'スパークリング',
    dessert: 'デザートワイン',
    fortified: '酒精強化ワイン',
  };

  return (
    <>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
              <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopyWine} style={styles.iconButton}>
              <MaterialCommunityIcons name="content-copy" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
              <MaterialCommunityIcons name="delete" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.wineName}>{wine.name}</Text>
        <Text style={styles.producer}>{wine.producer}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{wineTypeLabels[wine.type]}</Text>
        </View>
      </View>

      {/* Wine Images Gallery */}
      {wineImages.length > 0 && (
        <View style={styles.imageSection}>
          <FlatList
            data={wineImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => setSelectedImageIndex(index)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.wineImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
          {wineImages.length > 1 && (
            <View style={styles.imageIndicatorContainer}>
              {wineImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageIndicator,
                    index === 0 && styles.imageIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本情報</Text>
        
        {wine.vintage && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>ヴィンテージ</Text>
            <Text style={styles.value}>{wine.vintage}年</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>種類</Text>
          <Text style={styles.value}>{wineTypeLabels[wine.type]}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>国</Text>
          <Text style={styles.value}>{wine.country}</Text>
        </View>

        {wine.region && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>地域</Text>
            <Text style={styles.value}>{wine.region}</Text>
          </View>
        )}

        {wine.grape_variety && wine.grape_variety.length > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>品種</Text>
            <Text style={styles.value}>{wine.grape_variety.join(', ')}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>在庫・購入情報</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>在庫数</Text>
          <Text style={[styles.value, styles.quantityText]}>{wine.quantity}本</Text>
        </View>

        {wine.purchase_price && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>購入価格</Text>
            <Text style={styles.value}>¥{wine.purchase_price.toLocaleString()}</Text>
          </View>
        )}

        {wine.purchase_date && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>購入日</Text>
            <Text style={styles.value}>{new Date(wine.purchase_date).toLocaleDateString('ja-JP')}</Text>
          </View>
        )}

        {wine.purchase_location && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>購入場所</Text>
            <Text style={styles.value}>{wine.purchase_location}</Text>
          </View>
        )}

        {wine.bottle_size && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>容量</Text>
            <Text style={styles.value}>{wine.bottle_size}ml</Text>
          </View>
        )}

        {wine.alcohol_content && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>アルコール度数</Text>
            <Text style={styles.value}>{wine.alcohol_content}%</Text>
          </View>
        )}

        {(wine.drink_from || wine.drink_to) && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>飲み頃</Text>
            <Text style={styles.value}>
              {wine.drink_from && wine.drink_to
                ? `${wine.drink_from} 〜 ${wine.drink_to}年`
                : wine.drink_from
                ? `${wine.drink_from}年〜`
                : `〜${wine.drink_to}年`}
            </Text>
          </View>
        )}

      </View>

      {/* Cellar Map Location */}
      {wine.cellar_id && wine.position_row !== null && wine.position_column !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>セラーマップ</Text>
          <View style={styles.mapLocationCard}>
            <View style={styles.mapLocationInfo}>
              <MaterialCommunityIcons name="map-marker" size={40} color="#7C3AED" />
              <View style={styles.mapLocationText}>
                <Text style={styles.mapLocationPosition}>
                  位置: {formatCellarPosition(wine.position_row, wine.position_column)}
                </Text>
                <Text style={styles.mapLocationDescription}>
                  セラーマップで確認できます
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewOnMapButton}
              onPress={() => router.push(`/cellar/map/${wine.cellar_id}?highlight=${wine.position_row}-${wine.position_column}` as any)}
            >
              <MaterialCommunityIcons name="map-search" size={20} color="#fff" />
              <Text style={styles.viewOnMapButtonText}>マップで表示</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {wine.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>メモ</Text>
          <Text style={styles.notes}>{wine.notes}</Text>
        </View>
      )}

      {/* Drink Wine Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.drinkButton}
          onPress={() => setShowDrinkModal(true)}
          disabled={wine.quantity === 0}
        >
          <MaterialCommunityIcons name="glass-wine" size={20} color="#fff" />
          <Text style={styles.drinkButtonText}>ワインを飲む</Text>
        </TouchableOpacity>
      </View>

      {/* Drink Wine Modal */}
      {showDrinkModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ワインを飲む</Text>

            <Text style={styles.modalLabel}>本数</Text>
            <TextInput
              style={styles.modalInput}
              value={drinkQuantity}
              onChangeText={setDrinkQuantity}
              keyboardType="numeric"
              placeholder="1"
            />

            <Text style={styles.modalLabel}>機会（任意）</Text>
            <TextInput
              style={styles.modalInput}
              value={drinkOccasion}
              onChangeText={setDrinkOccasion}
              placeholder="例: 友人との食事"
            />

            <Text style={styles.modalLabel}>メモ（任意）</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={drinkNotes}
              onChangeText={setDrinkNotes}
              placeholder="感想など"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDrinkModal(false)}
              >
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleDrink}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>記録する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Drinking Records */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>飲酒記録</Text>
          <Text style={styles.sectionCount}>({drinkingRecords.length}件)</Text>
        </View>
        {drinkingRecords.length === 0 ? (
          <Text style={styles.emptyText}>まだ記録がありません</Text>
        ) : (
          drinkingRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>
                  {new Date(record.drunk_at).toLocaleDateString('ja-JP')}
                </Text>
                <Text style={styles.recordQuantity}>{record.quantity}本</Text>
                <TouchableOpacity onPress={() => handleDeleteDrinkingRecord(record.id)} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              {record.occasion && (
                <Text style={styles.recordOccasion}>{record.occasion}</Text>
              )}
              {record.notes && (
                <Text style={styles.recordNotes}>{record.notes}</Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Tasting Notes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>テイスティングノート</Text>
          <TouchableOpacity onPress={() => router.push(`/wine/tasting/${wine.id}` as any)}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#7C3AED" />
          </TouchableOpacity>
        </View>
        {tastingNotes.length === 0 ? (
          <Text style={styles.emptyText}>まだテイスティングノートがありません</Text>
        ) : (
          tastingNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteDate}>
                  {new Date(note.tasted_at).toLocaleDateString('ja-JP')}
                </Text>
                <View style={styles.ratingContainer}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name={i < note.rating ? 'star' : 'star-outline'}
                      size={16}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <TouchableOpacity onPress={() => handleDeleteTastingNote(note.id)} style={styles.deleteButton}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              {note.aroma && (
                <Text style={styles.noteDetail}>
                  <Text style={styles.noteLabel}>香り: </Text>
                  {note.aroma}
                </Text>
              )}
              {note.taste && (
                <Text style={styles.noteDetail}>
                  <Text style={styles.noteLabel}>味: </Text>
                  {note.taste}
                </Text>
              )}
              {note.notes && (
                <Text style={styles.noteNotes}>{note.notes}</Text>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>

    {/* 全画面画像表示モーダル */}
    <Modal
      visible={selectedImageIndex !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedImageIndex(null)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => setSelectedImageIndex(null)}
        >
          <MaterialCommunityIcons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        {selectedImageIndex !== null && (
          <FlatList
            data={wineImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImageIndex}
            getItemLayout={(_, index) => ({
              length: 400,
              offset: 400 * index,
              index,
            })}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  </>
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
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  wineName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  producer: {
    fontSize: 18,
    color: '#E9D5FF',
    marginBottom: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  wineImage: {
    width: 400,
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalImageContainer: {
    width: 400,
    height: 600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  quantityText: {
    color: '#7C3AED',
  },
  notes: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
  drinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  drinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonConfirm: {
    backgroundColor: '#7C3AED',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  recordCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  recordQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  recordOccasion: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 4,
  },
  recordNotes: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 14,
    color: '#92400E',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  noteDetail: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: 4,
  },
  noteLabel: {
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  noteNotes: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 4,
  },
  mapLocationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  mapLocationText: {
    flex: 1,
  },
  mapLocationPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapLocationDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewOnMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewOnMapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
