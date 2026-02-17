/**
 * Settings Store
 * アプリケーション設定を管理
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  aiEnabled: boolean;
  openaiApiKey: string;
  googleCloudApiKey: string;
  vivinoApiKey: string;

  setAiEnabled: (enabled: boolean) => void;
  setOpenaiApiKey: (key: string) => void;
  setGoogleCloudApiKey: (key: string) => void;
  setVivinoApiKey: (key: string) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const STORAGE_KEY = '@wine_cellar_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // デフォルト値
  aiEnabled: false,
  openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  googleCloudApiKey: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || '',
  vivinoApiKey: process.env.EXPO_PUBLIC_VIVINO_API_KEY || '',

  // AI機能の有効/無効を設定
  setAiEnabled: (enabled: boolean) => {
    set({ aiEnabled: enabled });
    get().saveSettings();
  },

  // OpenAI APIキーを設定
  setOpenaiApiKey: (key: string) => {
    set({ openaiApiKey: key });
    get().saveSettings();
  },

  // Google Cloud APIキーを設定
  setGoogleCloudApiKey: (key: string) => {
    set({ googleCloudApiKey: key });
    get().saveSettings();
  },

  // Vivino APIキーを設定
  setVivinoApiKey: (key: string) => {
    set({ vivinoApiKey: key });
    get().saveSettings();
  },

  // 設定を保存
  saveSettings: async () => {
    try {
      const state = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          aiEnabled: state.aiEnabled,
          openaiApiKey: state.openaiApiKey,
          googleCloudApiKey: state.googleCloudApiKey,
          vivinoApiKey: state.vivinoApiKey,
        })
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // 設定を読み込み
  loadSettings: async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        set({
          aiEnabled: settings.aiEnabled ?? false,
          openaiApiKey: settings.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
          googleCloudApiKey: settings.googleCloudApiKey || process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || '',
          vivinoApiKey: settings.vivinoApiKey || process.env.EXPO_PUBLIC_VIVINO_API_KEY || '',
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
}));
