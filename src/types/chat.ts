export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  error?: boolean;
}

export interface ChatContext {
  total_wines: number;
  total_bottles: number;
  by_type: Record<string, number>;
  recent_wines: string[];
}
