import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '../../src/store/settingsStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const {
    aiEnabled,
    openaiApiKey,
    googleCloudApiKey,
    vivinoApiKey,
    setAiEnabled,
    setOpenaiApiKey,
    setGoogleCloudApiKey,
    setVivinoApiKey,
    loadSettings,
  } = useSettingsStore();

  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showVivinoKey, setShowVivinoKey] = useState(false);

  const [tempOpenaiKey, setTempOpenaiKey] = useState('');
  const [tempGoogleKey, setTempGoogleKey] = useState('');
  const [tempVivinoKey, setTempVivinoKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setTempOpenaiKey(openaiApiKey);
    setTempGoogleKey(googleCloudApiKey);
    setTempVivinoKey(vivinoApiKey);
  }, [openaiApiKey, googleCloudApiKey, vivinoApiKey]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* AI機能セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI機能</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <MaterialCommunityIcons name="brain" size={24} color="#7C3AED" />
                <Text style={styles.settingTitle}>ラベル認識</Text>
              </View>
              <Text style={styles.settingDescription}>
                ワイン追加時にラベル画像からワイン情報を自動認識します。
                Google Cloud Vision APIキーが必要です。
              </Text>
            </View>
            <Switch
              value={aiEnabled}
              onValueChange={setAiEnabled}
              trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
              thumbColor={aiEnabled ? '#7C3AED' : '#F3F4F6'}
            />
          </View>

          {aiEnabled && (
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information" size={20} color="#7C3AED" />
              <Text style={styles.infoText}>
                AI機能が有効です。ワイン追加画面に「ラベルから認識」ボタンが表示されます。
              </Text>
            </View>
          )}

          {!aiEnabled && (
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#6B7280" />
              <Text style={styles.warningText}>
                AI機能が無効です。画像は追加できますが、自動認識は行われません。
              </Text>
            </View>
          )}
        </View>

        {/* APIキー設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APIキー設定</Text>

          <Text style={styles.sectionDescription}>
            AI機能を使用するには、各サービスのAPIキーが必要です。設定したAPIキーはデバイス内に安全に保存されます。
          </Text>

          {/* OpenAI APIキー */}
          <View style={styles.apiKeyItem}>
            <View style={styles.apiKeyHeader}>
              <MaterialCommunityIcons name="robot" size={20} color="#7C3AED" />
              <Text style={styles.apiKeyTitle}>OpenAI APIキー</Text>
            </View>
            <Text style={styles.apiKeyDescription}>
              AIソムリエチャット、ラベル認識、テイスティングノート生成に使用
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={tempOpenaiKey}
                onChangeText={setTempOpenaiKey}
                placeholder="sk-..."
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showOpenaiKey}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => setOpenaiApiKey(tempOpenaiKey)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowOpenaiKey(!showOpenaiKey)}
              >
                <MaterialCommunityIcons
                  name={showOpenaiKey ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {openaiApiKey ? (
              <View style={styles.statusBox}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.statusTextSuccess}>APIキーが設定されています</Text>
              </View>
            ) : (
              <View style={styles.statusBoxWarning}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.statusTextWarning}>APIキーが未設定です</Text>
              </View>
            )}
          </View>

          {/* Google Cloud Vision APIキー */}
          <View style={styles.apiKeyItem}>
            <View style={styles.apiKeyHeader}>
              <MaterialCommunityIcons name="google-cloud" size={20} color="#4285F4" />
              <Text style={styles.apiKeyTitle}>Google Cloud Vision APIキー</Text>
            </View>
            <Text style={styles.apiKeyDescription}>
              ワインラベル画像からのテキスト抽出に使用（オプション）
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={tempGoogleKey}
                onChangeText={setTempGoogleKey}
                placeholder="AIza..."
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showGoogleKey}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => setGoogleCloudApiKey(tempGoogleKey)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowGoogleKey(!showGoogleKey)}
              >
                <MaterialCommunityIcons
                  name={showGoogleKey ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {googleCloudApiKey ? (
              <View style={styles.statusBox}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.statusTextSuccess}>APIキーが設定されています</Text>
              </View>
            ) : (
              <View style={styles.statusBoxWarning}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.statusTextWarning}>APIキーが未設定です（オプション）</Text>
              </View>
            )}
          </View>

          {/* Vivino APIキー */}
          <View style={styles.apiKeyItem}>
            <View style={styles.apiKeyHeader}>
              <MaterialCommunityIcons name="web" size={20} color="#DC2626" />
              <Text style={styles.apiKeyTitle}>Vivino APIキー</Text>
            </View>
            <Text style={styles.apiKeyDescription}>
              ワイン情報の自動取得に使用（オプション、将来対応予定）
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={tempVivinoKey}
                onChangeText={setTempVivinoKey}
                placeholder="APIキーを入力"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showVivinoKey}
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={() => setVivinoApiKey(tempVivinoKey)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowVivinoKey(!showVivinoKey)}
              >
                <MaterialCommunityIcons
                  name={showVivinoKey ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {vivinoApiKey ? (
              <View style={styles.statusBox}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.statusTextSuccess}>APIキーが設定されています</Text>
              </View>
            ) : (
              <View style={styles.statusBoxWarning}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.statusTextWarning}>APIキーが未設定です（オプション）</Text>
              </View>
            )}
          </View>

          <View style={styles.helpBox}>
            <MaterialCommunityIcons name="help-circle" size={18} color="#6B7280" />
            <Text style={styles.helpText}>
              APIキーの取得方法: {'\n'}
              • OpenAI: https://platform.openai.com/api-keys{'\n'}
              • Google Cloud: https://console.cloud.google.com/apis/credentials
            </Text>
          </View>
        </View>

        {/* アプリ情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ情報</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>バージョン</Text>
            <Text style={styles.infoValue}>v1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>開発者</Text>
            <Text style={styles.infoValue}>Claude Sonnet 4.5</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>技術スタック</Text>
            <Text style={styles.infoValue}>React Native + Expo + Supabase</Text>
          </View>
        </View>

        {/* データ管理セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>

          <TouchableOpacity style={styles.actionButton} disabled>
            <MaterialCommunityIcons name="export" size={20} color="#9CA3AF" />
            <Text style={styles.actionButtonTextDisabled}>CSVエクスポート（開発中）</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} disabled>
            <MaterialCommunityIcons name="import" size={20} color="#9CA3AF" />
            <Text style={styles.actionButtonTextDisabled}>CSVインポート（開発中）</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} disabled>
            <MaterialCommunityIcons name="backup-restore" size={20} color="#9CA3AF" />
            <Text style={styles.actionButtonTextDisabled}>バックアップ（開発中）</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 開発者向けセクション */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>開発者向け</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/db-test' as any)}
        >
          <MaterialCommunityIcons name="database-check" size={20} color="#7C3AED" />
          <Text style={styles.actionButtonText}>WatermelonDB 動作確認</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
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
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  actionButtonTextDisabled: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionButtonText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  apiKeyItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  apiKeyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  apiKeyDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 10,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusTextSuccess: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  statusBoxWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusTextWarning: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
