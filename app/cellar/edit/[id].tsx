import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCellarStore } from '../../../src/store/cellarStore';
import { fetchCellar, updateCellar, fetchWinesInCellar } from '../../../src/services/cellarApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditCellarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateCellarInStore = useCellarStore((state) => state.updateCellar);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState('');
  const [columns, setColumns] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [originalRows, setOriginalRows] = useState(0);
  const [originalColumns, setOriginalColumns] = useState(0);

  useEffect(() => {
    loadCellar();
  }, [id]);

  const loadCellar = async () => {
    if (!id) return;
    try {
      const cellar = await fetchCellar(id);
      if (cellar) {
        setName(cellar.name);
        setDescription(cellar.description || '');
        setRows(cellar.rows.toString());
        setColumns(cellar.columns.toString());
        setOriginalRows(cellar.rows);
        setOriginalColumns(cellar.columns);
      }
    } catch (error) {
      console.error('Error loading cellar:', error);
      alert('セラーの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      alert('セラー名は必須です');
      return;
    }

    const rowsNum = parseInt(rows);
    const columnsNum = parseInt(columns);

    if (!rowsNum || rowsNum < 1 || rowsNum > 20) {
      alert('行数は1〜20の範囲で入力してください');
      return;
    }

    if (!columnsNum || columnsNum < 1 || columnsNum > 30) {
      alert('列数は1〜30の範囲で入力してください');
      return;
    }

    // サイズが縮小される場合、配置済みワインへの影響を確認
    if (rowsNum < originalRows || columnsNum < originalColumns) {
      const wines = await fetchWinesInCellar(id!);
      const affectedWines = wines.filter(
        (w) =>
          w.position_row !== null &&
          w.position_column !== null &&
          (w.position_row! >= rowsNum || w.position_column! >= columnsNum)
      );

      if (affectedWines.length > 0) {
        const confirmed = window.confirm(
          `サイズを縮小すると、${affectedWines.length}本のワインのセラー位置情報が失われます。続けますか？`
        );
        if (!confirmed) return;
      }
    }

    try {
      const updated = await updateCellar(id!, {
        name,
        description: description || undefined,
        rows: rowsNum,
        columns: columnsNum,
      });
      updateCellarInStore(id!, updated);
      alert('セラーを更新しました');
      router.back();
    } catch (error) {
      console.error('Error updating cellar:', error);
      alert('セラーの更新に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>セラーを編集</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>セラーを編集</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          <Text style={styles.label}>セラー名 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例: メインセラー, リビングラック"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="セラーの説明を入力"
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.sectionTitle}>サイズ設定</Text>
          <Text style={styles.sectionDescription}>
            サイズを縮小すると、範囲外のワインの位置情報が失われます。
          </Text>

          <Text style={styles.label}>行数（縦）</Text>
          <TextInput
            style={styles.input}
            value={rows}
            onChangeText={setRows}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>列数（横）</Text>
          <TextInput
            style={styles.input}
            value={columns}
            onChangeText={setColumns}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor="#9CA3AF"
          />

          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>プレビュー</Text>
            <View style={styles.preview}>
              <MaterialCommunityIcons name="grid" size={40} color="#7C3AED" />
              <Text style={styles.previewText}>
                {rows || '0'} 行 × {columns || '0'} 列 = {(parseInt(rows) || 0) * (parseInt(columns) || 0)} スロット
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>変更を保存</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
    height: 80,
    textAlignVertical: 'top',
  },
  previewContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  preview: {
    backgroundColor: '#EDE9FE',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: 16,
    color: '#5B21B6',
    fontWeight: '600',
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
});
