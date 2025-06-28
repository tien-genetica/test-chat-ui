import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { apiClient } from '@/lib/api/client';
import { ChatSDKError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chats = await apiClient.getChatsByUserId(session.user.id, {
    limit,
    startingAfter: startingAfter || undefined,
    endingBefore: endingBefore || undefined,
  });

  return Response.json(chats);
}
