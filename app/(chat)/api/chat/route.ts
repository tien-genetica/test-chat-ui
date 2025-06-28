import { appendClientMessage } from 'ai';
import { getSession } from '@/lib/auth';
import type { RequestHints } from '@/lib/ai/prompts';
import { apiClient } from '@/lib/api/client';
import { generateUUID } from '@/lib/utils';
// Simple title generation since external server handles complex AI tasks
const generateTitleFromUserMessage = ({ message }: { message: any }) => {
  const content =
    message.parts?.find((part: any) => part.type === 'text')?.text ||
    'New Chat';
  return content.slice(0, 80).trim() || 'New Chat';
};
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import { ChatSDKError } from '@/lib/errors';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message } = requestBody;

    const session = await getSession();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType = 'standard'; // Default user type since we removed type-based entitlements

    const messageCountResponse = await apiClient.getMessageCountByUserId(
      session.user.id,
      24,
    );
    const messageCount = (messageCountResponse as any)?.count || 0;

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await apiClient.getChatById(id);

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await apiClient.saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: 'private', // Default to private - external server handles visibility
      });
    } else {
      if ((chat as any).userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages = await apiClient.getMessagesByChatId(id);

    const messages = appendClientMessage({
      messages: previousMessages as any[],
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await apiClient.saveMessages([
      {
        chatId: id,
        id: message.id,
        role: 'user',
        parts: message.parts,
        attachments: message.experimental_attachments ?? [],
        createdAt: new Date(),
      },
    ]);

    const streamId = generateUUID();
    await apiClient.createStreamId({ chatId: id });

    // TODO: Replace with external API call for chat completions
    // The external server should implement POST /chat/completions with streaming support
    // For now, return a simple JSON response
    return new Response(
      JSON.stringify({
        error:
          'AI functionality disabled. External server integration required.',
        message:
          'Please implement chat completions in your external API server.',
      }),
      {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function GET(request: Request) {
  // Note: Resumable streams disabled since Redis is removed
  return new Response(null, { status: 204 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await apiClient.getChatById(id);

  if ((chat as any).userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await apiClient.deleteChatById(id);

  return Response.json(deletedChat, { status: 200 });
}
