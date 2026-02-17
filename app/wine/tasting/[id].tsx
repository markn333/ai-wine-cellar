import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useWineStore } from '../../../src/store/wineStore';
import { createTastingNote } from '../../../src/services/wineApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddTastingNoteScreen() {
  const { id } = useLocalSearchParams();
  const wines = useWineStore((state) => state.wines);
  const wine = wines.find((w) => w.id === id);

  const [rating, setRating] = useState(3);
  const [appearance, setAppearance] = useState('');
  const [aroma, setAroma] = useState('');
  const [taste, setTaste] = useState('');
  const [finish, setFinish] = useState('');
  const [foodPairing, setFoodPairing] = useState('');
  const [notes, setNotes] = useState('');

  if (!wine) {
    return (
      <View style={styles.container}>
        <Text>ワインが見つかりません</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    try {
      await createTastingNote({
        wine_id: wine.id,
        tasted_at: new Date().toISOString(),
        rating,
        appearance: appearance || undefined,
        aroma: aroma || undefined,
        taste: taste || undefined,
        finish: finish || undefined,
        food_pairing: foodPairing || undefined,
        notes: notes || undefined,
      });
      alert('テイスティングノートを保存しました');
      router.back();
    } catch (error) {
      console.error('Error creating tasting note:', error);
      alert('テイスティングノートの保存に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>テイスティングノート</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <Text style={styles.wineTitle}>{wine.name}</Text>
          <Text style={styles.wineProducer}>{wine.producer}</Text>

          <Text style={styles.sectionTitle}>評価</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setRating(value)}
                style={styles.starButton}
              >
                <MaterialCommunityIcons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color="#F59E0B"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>テイスティングノート</Text>

          <Text style={styles.label}>外観</Text>
          <TextInput
            style={styles.input}
            value={appearance}
            onChangeText={setAppearance}
            placeholder="色、透明度など"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>香り</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={aroma}
            onChangeText={setAroma}
            placeholder="フルーティー、スパイシーなど"
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>味わい</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={taste}
            onChangeText={setTaste}
            placeholder="甘味、酸味、タンニンなど"
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>余韻</Text>
          <TextInput
            style={styles.input}
            value={finish}
            onChangeText={setFinish}
            placeholder="長い、短いなど"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>料理とのペアリング</Text>
          <TextInput
            style={styles.input}
            value={foodPairing}
            onChangeText={setFoodPairing}
            placeholder="相性の良い料理"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>その他メモ</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="全体的な印象など"
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>保存</Text>
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
  wineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  wineProducer: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
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
