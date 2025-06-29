/**
 * Types for External API responses
 * These replace the database schema types
 */

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  type?: 'user' | 'admin';
}

export interface Chat {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
}

export interface APIMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: 'text';
    text: string;
  }>;
  attachments?: Array<{
    url: string;
    name: string;
    contentType: string;
  }>;
  createdAt: Date;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface Stream {
  id: string;
  chatId: string;
  createdAt: Date;
}

// API Response wrapper types
export interface APIResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Request types
export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface CreateChatRequest {
  id: string;
  userId: string;
  title: string;
  visibility: 'public' | 'private';
}

export interface SaveMessagesRequest {
  messages: Array<{
    id: string;
    chatId: string;
    role: 'user' | 'assistant' | 'system';
    parts: Array<{
      type: 'text';
      text: string;
    }>;
    attachments?: Array<{
      url: string;
      name: string;
      contentType: string;
    }>;
    createdAt: Date;
  }>;
}

export interface VoteMessageRequest {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}

// Legacy type aliases for backward compatibility
export type DBMessage = APIMessage;
