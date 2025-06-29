/**
 * External API Client
 * Handles all HTTP requests to external server APIs
 */

import { ChatSDKError } from '../errors';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.EXTERNAL_API_BASE_URL || 'http://localhost:8000/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = this.baseUrl + endpoint;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ChatSDKError(
          'bad_request:api',
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ChatSDKError) {
        throw error;
      }
      throw new ChatSDKError(
        'bad_request:api',
        `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // User Management
  async authenticateUser(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getUser(email: string) {
    return this.request(`/users?email=${encodeURIComponent(email)}`);
  }

  async createUser(email: string, password: string) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Chat Management
  async getChatById(id: string) {
    return this.request(`/chats/${id}`);
  }

  async getChatsByUserId(
    userId: string,
    params?: {
      limit?: number;
      startingAfter?: string;
      endingBefore?: string;
    },
  ) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.startingAfter)
      searchParams.append('starting_after', params.startingAfter);
    if (params?.endingBefore)
      searchParams.append('ending_before', params.endingBefore);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/users/${userId}/chats${query}`);
  }

  async saveChat(data: {
    id: string;
    userId: string;
    title: string;
    visibility: string;
  }) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteChatById(id: string) {
    return this.request(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  async updateChatVisibility(chatId: string, visibility: string) {
    return this.request(`/chats/${chatId}`, {
      method: 'PATCH',
      body: JSON.stringify({ visibility }),
    });
  }

  // Message Management
  async getMessagesByChatId(chatId: string) {
    return this.request(`/chats/${chatId}/messages`);
  }

  async getMessageById(id: string) {
    return this.request(`/messages/${id}`);
  }

  async saveMessages(messages: any[]) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  async deleteMessagesByChatIdAfterTimestamp(chatId: string, timestamp: Date) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'DELETE',
      body: JSON.stringify({ timestamp: timestamp.toISOString() }),
    });
  }

  async getMessageCountByUserId(userId: string, differenceInHours: number) {
    return this.request(
      `/users/${userId}/message-count?hours=${differenceInHours}`,
    );
  }

  // Vote Management
  async getVotesByChatId(chatId: string) {
    return this.request(`/chats/${chatId}/votes`);
  }

  async voteMessage(data: {
    chatId: string;
    messageId: string;
    type: 'up' | 'down';
  }) {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // File Upload Management
  async uploadFile(data: {
    filename: string;
    fileBuffer: ArrayBuffer;
    contentType: string;
    userId: string;
  }) {
    // Convert ArrayBuffer to FormData for file upload
    const formData = new FormData();
    const blob = new Blob([data.fileBuffer], { type: data.contentType });
    formData.append('file', blob, data.filename);
    formData.append('userId', data.userId);

    // For file uploads, we don't set Content-Type to application/json
    // Let FormData set the appropriate multipart/form-data boundary
    const headers: Record<string, string> = {};

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ChatSDKError(
        'bad_request:api',
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return await response.json();
  }

  // Stream Management (if needed for external API)
  async createStreamId(data: { chatId: string }) {
    return this.request('/streams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStreamIdsByChatId(chatId: string) {
    return this.request(`/chats/${chatId}/streams`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
