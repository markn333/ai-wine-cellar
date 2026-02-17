import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatMessage } from '../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.error;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      {!isUser && (
        <MaterialCommunityIcons
          name="robot"
          size={24}
          color="#7C3AED"
          style={styles.avatar}
        />
      )}

      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        isError && styles.errorBubble,
      ]}>
        <Text style={[
          styles.text,
          isUser ? styles.userText : styles.assistantText,
          isError && styles.errorText,
        ]}>
          {message.content}
        </Text>

        <Text style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {isUser && (
        <MaterialCommunityIcons
          name="account-circle"
          size={24}
          color="#10B981"
          style={styles.avatar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
  },
  errorBubble: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1F2937',
  },
  errorText: {
    color: '#991B1B',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
