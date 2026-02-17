import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useWineStore } from '../../../src/store/wineStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { WineType } from '../../../src/types/wine';
import { createWine, updateWine } from '../../../src/services/wineApi';
import { addWineImage } from '../../../src/services/wineImageApi';
import { recognizeWineLabel } from '../../../src/services/visionApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MAJOR_WINE_COUNTRIES, COUNTRY_OTHER } from '../../../src/constants/wineCountries';
import { getRegionsForCountry, REGION_OTHER } from '../../../src/constants/wineRegions';

const MAX_IMAGES = 5; // 最大画像数

export default function AddWineToCellarScreen() {
  const { id: cellarId, row, column } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [producer, setProducer] = useState('');
  const [vintage, setVintage] = useState('');
  const [type, setType] = useState<WineType>('red');
  const [country, setCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [region, setRegion] = useState('');
  const [customRegion, setCustomRegion] = useState('');
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [grapeVariety, setGrapeVariety] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number | null>(null);

  const addWine = useWineStore((state) => state.addWine);
  const { aiEnabled, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const wineTypes: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
  const wineTypeLabels = {
    red: '赤ワイン',
    white: '白ワイン',
    rose: 'ロゼ',
    sparkling: 'スパークリング',
    dessert: 'デザートワイン',
    fortified: '酒精強化ワイン',
  };

  const pickImageFromGallery = async () => {
    // 最大数チェック
    if (selectedImages.length >= MAX_IMAGES) {
      alert(`画像は最大${MAX_IMAGES}枚まで追加できます`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        // 配列に追加
        setSelectedImages([...selectedImages, result.assets[0].base64]);
        setShowImageSourceModal(false);

        // AI機能が有効で、最初の画像の場合のみラベル認識を実行
        if (aiEnabled && selectedImages.length === 0) {
          await recognizeLabel(result.assets[0].base64);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('画像の選択に失敗しました');
    }
  };

  const takePicture = async () => {
    // 最大数チェック
    if (selectedImages.length >= MAX_IMAGES) {
      alert(`画像は最大${MAX_IMAGES}枚まで追加できます`);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        // 配列に追加
        setSelectedImages([...selectedImages, result.assets[0].base64]);
        setShowImageSourceModal(false);
        // AI機能が有効で、最初の画像の場合のみラベル認識を実行
        if (aiEnabled && selectedImages.length === 0) {
          await recognizeLabel(result.assets[0].base64);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      alert('写真の撮影に失敗しました');
    }
  };

  const recognizeLabel = async (imageBase64: string) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;
    if (!apiKey || apiKey === 'your_google_cloud_api_key') {
      alert('Google Cloud APIキーが設定されていません。.envファイルを確認してください。');
      // 追加した画像を削除
      setSelectedImages([]);
      return;
    }

    try {
      setIsRecognizing(true);
      const result = await recognizeWineLabel(imageBase64);

      setRecognitionConfidence(result.confidence);

      // フォームに自動入力（既存値は上書きしない）
      if (result.name && !name) setName(result.name);
      if (result.producer && !producer) setProducer(result.producer);
      if (result.vintage && !vintage) setVintage(result.vintage.toString());
      if (result.country && !country) setCountry(result.country);
      if (result.region && !region) setRegion(result.region);
      if (result.grape_variety && result.grape_variety.length > 0 && !grapeVariety) {
        setGrapeVariety(result.grape_variety.join(', '));
      }

      if (result.confidence < 0.5) {
        alert('ラベルを認識しましたが、確信度が低いため内容を確認してください。');
      }
    } catch (error) {
      console.error('Error recognizing label:', error);
      alert('ラベルの認識に失敗しました。手動で入力してください。');
      // 追加した画像を削除
      setSelectedImages([]);
    } finally {
      setIsRecognizing(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    // 画像が全て削除されたら認識結果もクリア
    if (newImages.length === 0) {
      setRecognitionConfidence(null);
    }
  };

  const handleSubmit = async () => {
    if (!name || !producer || !country) {
      alert('ワイン名、生産者、国は必須項目です');
      return;
    }

    try {
      // 1. ワインを作成（IDを取得）
      const wineData = {
        name,
        producer,
        vintage: vintage ? parseInt(vintage) : undefined,
        type,
        country: isCustomCountry ? customCountry : country,
        region: (isCustomRegion ? customRegion : region) || undefined,
        grape_variety: grapeVariety ? grapeVariety.split(',').map(v => v.trim()) : undefined,
        quantity: parseInt(quantity) || 1,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        cellar_id: cellarId as string,
        position_row: parseInt(row as string),
        position_column: parseInt(column as string),
        notes: notes || undefined,
      };

      const newWine = await createWine(wineData);

      // 2. 画像があればアップロード（複数対応）
      if (selectedImages.length > 0) {
        try {
          for (const imageBase64 of selectedImages) {
            await addWineImage(newWine.id, imageBase64);
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert('画像のアップロードに失敗しましたが、ワイン情報は保存されました');
        }
      }

      // 3. ストアに追加
      addWine(newWine);
      alert('ワインを登録しました');
      router.back();
    } catch (error) {
      console.error('Error creating wine:', error);
      alert('ワインの登録に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>ワインを追加</Text>
          <Text style={styles.headerSubtitle}>
            位置: {row}-{column}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* 画像選択セクション */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={aiEnabled ? styles.labelRecognitionButton : styles.imageAddButton}
              onPress={() => setShowImageSourceModal(true)}
            >
              <MaterialCommunityIcons
                name={aiEnabled ? "camera" : "image-plus"}
                size={24}
                color="#fff"
              />
              <Text style={styles.labelRecognitionButtonText}>
                {aiEnabled ? 'ラベルから認識' : '画像を追加'}
              </Text>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesScrollView}
                contentContainerStyle={{ gap: 12 }}
              >
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${image}` }}
                      style={styles.imagePreview}
                    />
                    {index === 0 && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>メイン</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.imageRemoveButton}
                      onPress={() => removeImage(index)}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {aiEnabled && recognitionConfidence !== null && (
              <View style={[
                styles.confidenceBar,
                recognitionConfidence >= 0.5 ? styles.confidenceBarHigh : styles.confidenceBarLow
              ]}>
                <MaterialCommunityIcons
                  name={recognitionConfidence >= 0.5 ? "check-circle" : "alert"}
                  size={20}
                  color={recognitionConfidence >= 0.5 ? "#10B981" : "#F59E0B"}
                />
                <Text style={styles.confidenceText}>
                  {recognitionConfidence >= 0.5
                    ? 'ラベルを認識しました'
                    : '確信度が低いため、内容を確認してください'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>基本情報</Text>

          <Text style={styles.label}>ワイン名 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例: シャトー・マルゴー"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>生産者 *</Text>
          <TextInput
            style={styles.input}
            value={producer}
            onChangeText={setProducer}
            placeholder="例: Château Margaux"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>ヴィンテージ（年）</Text>
          <TextInput
            style={styles.input}
            value={vintage}
            onChangeText={setVintage}
            placeholder="例: 2015"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>種類</Text>
          <View style={styles.typeContainer}>
            {wineTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeButton, type === t && styles.typeButtonActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                  {wineTypeLabels[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>産地情報</Text>

          <Text style={styles.label}>国 *</Text>
          <View style={styles.countryContainer}>
            {MAJOR_WINE_COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.countryButton,
                  country === c && !isCustomCountry && styles.countryButtonActive,
                ]}
                onPress={() => {
                  setCountry(c);
                  setIsCustomCountry(false);
                }}
              >
                <Text
                  style={[
                    styles.countryButtonText,
                    country === c && !isCustomCountry && styles.countryButtonTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.countryButton,
                isCustomCountry && styles.countryButtonActive,
              ]}
              onPress={() => setIsCustomCountry(true)}
            >
              <Text
                style={[
                  styles.countryButtonText,
                  isCustomCountry && styles.countryButtonTextActive,
                ]}
              >
                {COUNTRY_OTHER}
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomCountry && (
            <TextInput
              style={[styles.input, styles.customCountryInput]}
              value={customCountry}
              onChangeText={setCustomCountry}
              placeholder="国名を入力してください"
              placeholderTextColor="#9CA3AF"
            />
          )}

          <Text style={styles.label}>地域</Text>
          {(() => {
            const selectedCountryName = isCustomCountry ? customCountry : country;
            const availableRegions = getRegionsForCountry(selectedCountryName);

            if (availableRegions.length > 0) {
              return (
                <>
                  <View style={styles.regionContainer}>
                    {availableRegions.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.regionButton,
                          region === r && !isCustomRegion && styles.regionButtonActive,
                        ]}
                        onPress={() => {
                          setRegion(r);
                          setIsCustomRegion(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.regionButtonText,
                            region === r && !isCustomRegion && styles.regionButtonTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[
                        styles.regionButton,
                        isCustomRegion && styles.regionButtonActive,
                      ]}
                      onPress={() => setIsCustomRegion(true)}
                    >
                      <Text
                        style={[
                          styles.regionButtonText,
                          isCustomRegion && styles.regionButtonTextActive,
                        ]}
                      >
                        {REGION_OTHER}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isCustomRegion && (
                    <TextInput
                      style={[styles.input, styles.customRegionInput]}
                      value={customRegion}
                      onChangeText={setCustomRegion}
                      placeholder="地域名を入力してください"
                      placeholderTextColor="#9CA3AF"
                    />
                  )}
                </>
              );
            } else {
              return (
                <TextInput
                  style={styles.input}
                  value={customRegion || region}
                  onChangeText={(text) => {
                    setCustomRegion(text);
                    setRegion(text);
                  }}
                  placeholder="例: ボルドー"
                  placeholderTextColor="#9CA3AF"
                />
              );
            }
          })()}

          <Text style={styles.label}>品種（カンマ区切り）</Text>
          <TextInput
            style={styles.input}
            value={grapeVariety}
            onChangeText={setGrapeVariety}
            placeholder="例: カベルネ・ソーヴィニヨン, メルロー"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.sectionTitle}>購入・在庫情報</Text>

          <Text style={styles.label}>本数</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>購入価格（円）</Text>
          <TextInput
            style={styles.input}
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            keyboardType="numeric"
            placeholder="例: 15000"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>メモ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="特記事項があれば入力してください"
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>ワインを登録</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 画像ソース選択モーダル */}
      {showImageSourceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>画像を選択</Text>

            <TouchableOpacity
              style={styles.imageSourceButton}
              onPress={takePicture}
            >
              <MaterialCommunityIcons name="camera" size={24} color="#7C3AED" />
              <Text style={styles.imageSourceButtonText}>カメラで撮影</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageSourceButton}
              onPress={pickImageFromGallery}
            >
              <MaterialCommunityIcons name="image" size={24} color="#7C3AED" />
              <Text style={styles.imageSourceButtonText}>ギャラリーから選択</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setShowImageSourceModal(false)}
            >
              <Text style={styles.modalButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 認識中ローディング */}
      {isRecognizing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>ラベルを認識中...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7C3AED',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  typeButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  countryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  countryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  countryButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  countryButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  countryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customCountryInput: {
    marginTop: 0,
  },
  regionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  regionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  regionButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  regionButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  regionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customRegionInput: {
    marginTop: 0,
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageSection: {
    marginBottom: 24,
  },
  labelRecognitionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  labelRecognitionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagesScrollView: {
    marginTop: 16,
  },
  imagePreviewItem: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 150,
    height: 200,
    borderRadius: 12,
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 4,
  },
  confidenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  confidenceBarHigh: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  confidenceBarLow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
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
    zIndex: 1000,
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
    textAlign: 'center',
  },
  imageSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
    gap: 12,
  },
  imageSourceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
