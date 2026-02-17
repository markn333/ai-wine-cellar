import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { useWineStore } from '../../../src/store/wineStore';
import { useCellarStore } from '../../../src/store/cellarStore';
import { Wine, WineType } from '../../../src/types/wine';
import { updateWine } from '../../../src/services/wineApi';
import { updateWinePosition } from '../../../src/services/cellarApi';
import { fetchWineImages, addWineImage, removeWineImage } from '../../../src/services/wineImageApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WineImage } from '../../../src/types/wine';
import { formatCellarPosition, columnToLetter, letterToColumn } from '../../../src/utils/cellarHelpers';
import { MAJOR_WINE_COUNTRIES, COUNTRY_OTHER } from '../../../src/constants/wineCountries';
import { getRegionsForCountry, REGION_OTHER } from '../../../src/constants/wineRegions';
import { getGrapeVarietiesByType, GRAPE_VARIETY_OTHER } from '../../../src/constants/grapeVarieties';

export default function EditWineScreen() {
  const { id } = useLocalSearchParams();
  const wines = useWineStore((state) => state.wines);
  const wine = wines.find((w) => w.id === id);
  const updateWineInStore = useWineStore((state) => state.updateWine);
  const cellars = useCellarStore((state) => state.cellars);

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
  const [selectedGrapeVarieties, setSelectedGrapeVarieties] = useState<string[]>([]);
  const [customGrapeVariety, setCustomGrapeVariety] = useState('');
  const [showCustomGrapeInput, setShowCustomGrapeInput] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseLocation, setPurchaseLocation] = useState('');
  const [bottleSize, setBottleSize] = useState('');
  const [alcoholContent, setAlcoholContent] = useState('');
  const [drinkFrom, setDrinkFrom] = useState('');
  const [drinkTo, setDrinkTo] = useState('');
  const [cellarLocation, setCellarLocation] = useState('');
  const [notes, setNotes] = useState('');

  // 複数画像の状態
  const [wineImages, setWineImages] = useState<WineImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // セラー位置の状態
  const [selectedCellarId, setSelectedCellarId] = useState<string | null>(null);
  const [positionRow, setPositionRow] = useState<string>('');
  const [positionColumn, setPositionColumn] = useState<string>('');

  useEffect(() => {
    if (wine) {
      setName(wine.name);
      setProducer(wine.producer);
      setVintage(wine.vintage?.toString() || '');
      setType(wine.type);

      // 品種の設定
      if (wine.grape_variety && wine.grape_variety.length > 0) {
        setSelectedGrapeVarieties(wine.grape_variety);
      }

      // 国の設定（主要国かカスタムか判定）
      if (MAJOR_WINE_COUNTRIES.includes(wine.country as any)) {
        setCountry(wine.country);
        setIsCustomCountry(false);
      } else {
        setCustomCountry(wine.country);
        setIsCustomCountry(true);
      }

      // 地域の設定
      const selectedCountryName = MAJOR_WINE_COUNTRIES.includes(wine.country as any) ? wine.country : customCountry;
      const availableRegions = getRegionsForCountry(selectedCountryName);

      if (wine.region && availableRegions.includes(wine.region)) {
        setRegion(wine.region);
        setIsCustomRegion(false);
      } else if (wine.region) {
        setCustomRegion(wine.region);
        setIsCustomRegion(true);
      } else {
        setRegion('');
        setCustomRegion('');
        setIsCustomRegion(false);
      }
      setQuantity(wine.quantity.toString());
      setPurchasePrice(wine.purchase_price?.toString() || '');
      setPurchaseDate(wine.purchase_date || '');
      setPurchaseLocation(wine.purchase_location || '');
      setBottleSize(wine.bottle_size?.toString() || '');
      setAlcoholContent(wine.alcohol_content?.toString() || '');
      setDrinkFrom(wine.drink_from?.toString() || '');
      setDrinkTo(wine.drink_to?.toString() || '');
      setCellarLocation(wine.cellar_location || '');
      setNotes(wine.notes || '');

      // セラー位置の初期値
      setSelectedCellarId(wine.cellar_id || null);
      setPositionRow(wine.position_row !== null && wine.position_row !== undefined ? wine.position_row.toString() : '');
      setPositionColumn(wine.position_column !== null && wine.position_column !== undefined ? wine.position_column.toString() : '');

      // 画像を読み込む
      loadWineImages();
    }
  }, [wine]);

  const loadWineImages = async () => {
    if (!wine) return;
    setIsLoadingImages(true);
    try {
      const images = await fetchWineImages(wine.id);
      setWineImages(images);
    } catch (error) {
      console.error('Error loading wine images:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  if (!wine) {
    return (
      <View style={styles.container}>
        <Text>ワインが見つかりません</Text>
      </View>
    );
  }

  const wineTypes: WineType[] = ['red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
  const wineTypeLabels = {
    red: '赤ワイン',
    white: '白ワイン',
    rose: 'ロゼ',
    sparkling: 'スパークリング',
    dessert: 'デザートワイン',
    fortified: '酒精強化ワイン',
  };

  const pickImage = async () => {
    if (!wine) return;

    // 最大5枚まで
    if (wineImages.length >= 5) {
      alert('画像は最大5枚までです');
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
        // 画像を追加
        setIsLoadingImages(true);
        const newImage = await addWineImage(wine.id, result.assets[0].base64);
        setWineImages([...wineImages, newImage]);
        alert('画像を追加しました');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert('画像の追加に失敗しました');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    const confirmed = window.confirm('この画像を削除しますか？');
    if (!confirmed) return;

    try {
      setIsLoadingImages(true);
      await removeWineImage(imageId);
      setWineImages(wineImages.filter(img => img.id !== imageId));
      alert('画像を削除しました');
    } catch (error) {
      console.error('Error removing image:', error);
      alert('画像の削除に失敗しました');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !producer || !country) {
      alert('ワイン名、生産者、国は必須項目です');
      return;
    }

    try {
      const updatedData: any = {
        name,
        producer,
        vintage: vintage ? parseInt(vintage) : undefined,
        type,
        country: isCustomCountry ? customCountry : country,
        region: (isCustomRegion ? customRegion : region) || undefined,
        grape_variety: selectedGrapeVarieties.length > 0 ? selectedGrapeVarieties : undefined,
        quantity: parseInt(quantity) || 1,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        purchase_date: purchaseDate || undefined,
        purchase_location: purchaseLocation || undefined,
        bottle_size: bottleSize ? parseFloat(bottleSize) : undefined,
        alcohol_content: alcoholContent ? parseFloat(alcoholContent) : undefined,
        drink_from: drinkFrom || undefined,
        drink_to: drinkTo || undefined,
        cellar_location: cellarLocation || undefined,
        notes: notes || undefined,
      };

      // 画像処理は addWineImage/removeWineImage で既に処理済み

      const updated = await updateWine(wine.id, updatedData);

      // セラー位置が変更された場合
      const newCellarId = selectedCellarId || null;
      const newRow = positionRow ? parseInt(positionRow) : null;
      const newCol = positionColumn ? parseInt(positionColumn) : null;

      const cellarChanged = newCellarId !== wine.cellar_id;
      const positionChanged = newRow !== wine.position_row || newCol !== wine.position_column;

      if (cellarChanged || positionChanged) {
        await updateWinePosition(wine.id, newCellarId, newRow, newCol);
      }

      updateWineInStore(wine.id, updated);
      alert('ワイン情報を更新しました');
      router.back();
    } catch (error) {
      console.error('Error updating wine:', error);
      alert('ワイン情報の更新に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ワインを編集</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* 画像セクション */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>ワイン画像（最大5枚）</Text>

            {/* 画像ギャラリー */}
            {wineImages.length > 0 && (
              <View style={styles.imageGallery}>
                {wineImages.map((image, index) => (
                  <View key={image.id} style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: image.image_url }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.imageRemoveButton}
                      onPress={() => handleRemoveImage(image.id)}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.mainImageBadge}>
                        <Text style={styles.mainImageBadgeText}>メイン</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* 画像追加ボタン */}
            {wineImages.length < 5 && (
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImage}
                disabled={isLoadingImages}
              >
                <MaterialCommunityIcons name="image-plus" size={20} color="#fff" />
                <Text style={styles.imageButtonText}>
                  {isLoadingImages ? '処理中...' : '画像を追加'}
                </Text>
              </TouchableOpacity>
            )}

            {wineImages.length === 0 && (
              <Text style={styles.imageHint}>
                ワインラベルや外観の画像を追加できます
              </Text>
            )}

            {wineImages.length > 0 && (
              <Text style={styles.imageHint}>
                {wineImages.length}/5枚 - 最初の画像がメイン画像として使用されます
              </Text>
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

        <Text style={styles.label}>品種（複数選択可）</Text>
        <View style={styles.grapeVarietyContainer}>
          {getGrapeVarietiesByType(type).map((variety) => {
            const isSelected = selectedGrapeVarieties.includes(variety);
            return (
              <TouchableOpacity
                key={variety}
                style={[
                  styles.grapeVarietyButton,
                  isSelected && styles.grapeVarietyButtonActive,
                ]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedGrapeVarieties(selectedGrapeVarieties.filter(v => v !== variety));
                  } else {
                    setSelectedGrapeVarieties([...selectedGrapeVarieties, variety]);
                  }
                }}
              >
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={16} color="#fff" style={{ marginRight: 4 }} />
                )}
                <Text
                  style={[
                    styles.grapeVarietyButtonText,
                    isSelected && styles.grapeVarietyButtonTextActive,
                  ]}
                >
                  {variety}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[
              styles.grapeVarietyButton,
              showCustomGrapeInput && styles.grapeVarietyButtonActive,
            ]}
            onPress={() => setShowCustomGrapeInput(!showCustomGrapeInput)}
          >
            <Text
              style={[
                styles.grapeVarietyButtonText,
                showCustomGrapeInput && styles.grapeVarietyButtonTextActive,
              ]}
            >
              {GRAPE_VARIETY_OTHER}
            </Text>
          </TouchableOpacity>
        </View>

        {showCustomGrapeInput && (
          <View style={styles.customGrapeInputContainer}>
            <TextInput
              style={[styles.input, styles.customGrapeInput]}
              value={customGrapeVariety}
              onChangeText={setCustomGrapeVariety}
              placeholder="品種名を入力してEnter"
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={() => {
                if (customGrapeVariety.trim()) {
                  setSelectedGrapeVarieties([...selectedGrapeVarieties, customGrapeVariety.trim()]);
                  setCustomGrapeVariety('');
                }
              }}
            />
          </View>
        )}

        {selectedGrapeVarieties.length > 0 && (
          <View style={styles.selectedGrapeVarieties}>
            <Text style={styles.selectedGrapeVarietiesLabel}>選択中:</Text>
            <Text style={styles.selectedGrapeVarietiesText}>
              {selectedGrapeVarieties.join(', ')}
            </Text>
          </View>
        )}

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

        <Text style={styles.label}>購入日（YYYY-MM-DD）</Text>
        <TextInput
          style={styles.input}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="例: 2023-06-15"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>購入場所</Text>
        <TextInput
          style={styles.input}
          value={purchaseLocation}
          onChangeText={setPurchaseLocation}
          placeholder="例: ラ・ヴィネ, Amazon"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>容量（ml）</Text>
        <TextInput
          style={styles.input}
          value={bottleSize}
          onChangeText={setBottleSize}
          keyboardType="numeric"
          placeholder="例: 750"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>アルコール度数（%）</Text>
        <TextInput
          style={styles.input}
          value={alcoholContent}
          onChangeText={setAlcoholContent}
          keyboardType="numeric"
          placeholder="例: 13.5"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>飲み頃開始年</Text>
        <TextInput
          style={styles.input}
          value={drinkFrom}
          onChangeText={setDrinkFrom}
          keyboardType="numeric"
          placeholder="例: 2025"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>飲み頃終了年</Text>
        <TextInput
          style={styles.input}
          value={drinkTo}
          onChangeText={setDrinkTo}
          keyboardType="numeric"
          placeholder="例: 2035"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.sectionTitle}>セラー位置</Text>

        <Text style={styles.label}>セラー</Text>
        {cellars.length > 0 ? (
          <>
            <View style={styles.cellarButtonContainer}>
              <TouchableOpacity
                style={[styles.cellarButton, !selectedCellarId && styles.cellarButtonActive]}
                onPress={() => {
                  setSelectedCellarId(null);
                  setPositionRow('');
                  setPositionColumn('');
                }}
              >
                <Text style={[styles.cellarButtonText, !selectedCellarId && styles.cellarButtonTextActive]}>
                  なし
                </Text>
              </TouchableOpacity>
              {cellars.map((cellar) => (
                <TouchableOpacity
                  key={cellar.id}
                  style={[styles.cellarButton, selectedCellarId === cellar.id && styles.cellarButtonActive]}
                  onPress={() => setSelectedCellarId(cellar.id)}
                >
                  <Text style={[styles.cellarButtonText, selectedCellarId === cellar.id && styles.cellarButtonTextActive]}>
                    {cellar.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedCellarId && (
              <>
                {/* 現在の位置を表示 */}
                {positionRow !== '' && positionColumn !== '' && (
                  <View style={styles.currentPositionDisplay}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#7C3AED" />
                    <Text style={styles.currentPositionText}>
                      現在の位置: {formatCellarPosition(parseInt(positionRow), parseInt(positionColumn))}
                    </Text>
                  </View>
                )}

                <View style={styles.positionInputContainer}>
                  <View style={styles.positionInputWrapper}>
                    <Text style={styles.label}>行（数字: 1, 2, 3...）</Text>
                    <TextInput
                      style={styles.positionInput}
                      value={positionRow !== '' ? (parseInt(positionRow) + 1).toString() : ''}
                      onChangeText={(text) => {
                        const num = parseInt(text);
                        setPositionRow(!isNaN(num) && num > 0 ? (num - 1).toString() : '');
                      }}
                      placeholder="1"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.positionInputWrapper}>
                    <Text style={styles.label}>列（A, B, C...）</Text>
                    <TextInput
                      style={styles.positionInput}
                      value={positionColumn !== '' ? columnToLetter(parseInt(positionColumn)) : ''}
                      onChangeText={(text) => {
                        const upper = text.toUpperCase();
                        if (/^[A-Z]+$/.test(upper)) {
                          setPositionColumn(letterToColumn(upper).toString());
                        } else if (text === '') {
                          setPositionColumn('');
                        }
                      }}
                      placeholder="A"
                      autoCapitalize="characters"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => {
                    router.push({
                      pathname: '/cellar/map/[id]' as any,
                      params: { id: selectedCellarId },
                    });
                  }}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
                  <Text style={styles.mapButtonText}>マップで位置を確認</Text>
                </TouchableOpacity>

                <Text style={styles.hint}>
                  セラーマップで空きセルをタップして位置を選択できます
                </Text>
              </>
            )}
          </>
        ) : (
          <Text style={styles.noDataText}>
            セラーが登録されていません。先にセラーを作成してください。
          </Text>
        )}

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
          <Text style={styles.submitButtonText}>更新する</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  grapeVarietyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  grapeVarietyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  grapeVarietyButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  grapeVarietyButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  grapeVarietyButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  customGrapeInputContainer: {
    marginBottom: 12,
  },
  customGrapeInput: {
    marginTop: 0,
  },
  selectedGrapeVarieties: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  selectedGrapeVarietiesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  selectedGrapeVarietiesText: {
    fontSize: 14,
    color: '#1E40AF',
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
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mainImageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cellarButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cellarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cellarButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  cellarButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cellarButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  currentPositionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  currentPositionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  positionInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  positionInputWrapper: {
    flex: 1,
  },
  positionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 12,
  },
});
