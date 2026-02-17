import { useEffect, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWineStore } from '../../src/store/wineStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useChatStore } from '../../src/store/chatStore';
import { askSommelier } from '../../src/services/openai';
import ChatBubble from '../../src/components/ChatBubble';
import ChatInput from '../../src/components/ChatInput';
import { ChatMessage } from '../../src/types/chat';

export default function ChatScreen() {
  const { messages, isLoading, addMessage, setLoading, generateContext } = useChatStore();
  const wines = useWineStore((state) => state.wines);
  const { aiEnabled } = useSettingsStore();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!aiEnabled) {
      alert('AI機能が無効です。設定画面で有効にしてください。');
      return;
    }

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // コンテキスト生成
    const context = generateContext(wines);
    const wineTypeLabels: Record<string, string> = {
      red: '赤',
      white: '白',
      rose: 'ロゼ',
      sparkling: 'スパークリング',
      dessert: 'デザート',
      fortified: '酒精強化',
    };

    const typeBreakdown = Object.entries(context.by_type)
      .map(([type, count]) => `${wineTypeLabels[type]}: ${count}本`)
      .join(', ');

    const contextString = `
ユーザーのワインセラー情報:
- ワイン種類: ${context.total_wines}種類
- 総本数: ${context.total_bottles}本
- 種類別在庫: ${typeBreakdown || 'なし'}
- 最近追加されたワイン: ${context.recent_wines.join(', ') || 'なし'}
    `.trim();

    setLoading(true);

    try {
      const response = await askSommelier(text, contextString);

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      addMessage(aiMessage);

    } catch (error: any) {
      console.error('Chat error:', error);

      let errorMsg = 'エラーが発生しました。';
      if (error.message?.includes('APIキーが設定されていません')) {
        errorMsg = 'OpenAI APIキーが設定されていません。設定画面の「APIキー設定」セクションでAPIキーを入力してください。';
      } else if (error.message?.includes('API key')) {
        errorMsg = 'OpenAI APIキーが無効です。設定画面で正しいAPIキーを入力してください。';
      } else if (error.message?.includes('rate limit')) {
        errorMsg = 'APIの利用制限に達しました。しばらくしてから再試行してください。';
      } else if (error.message?.includes('network')) {
        errorMsg = 'ネットワークエラーが発生しました。接続を確認してください。';
      } else {
        errorMsg = `エラーが発生しました: ${error.message || '不明なエラー'}`;
      }

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
        error: true,
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  return (
    <View style={styles.container}>
      {/* コンテキスト情報バー */}
      <View style={styles.contextBar}>
        <MaterialCommunityIcons name="information" size={16} color="#7C3AED" />
        <Text style={styles.contextText}>
          {wines.length}種類 • {totalBottles}本のワイン
        </Text>
      </View>

      {/* メッセージ一覧 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chat" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>AIソムリエに質問</Text>
            <Text style={styles.emptyText}>
              ワインのペアリング、保管方法、{'\n'}
              おすすめなど、なんでも聞いてください
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingText}>考え中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 入力エリア */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  contextText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
