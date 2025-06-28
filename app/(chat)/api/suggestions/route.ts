import { getSession } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { ChatSDKError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter documentId is required.',
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:suggestions').toResponse();
  }

  const suggestionsResponse =
    await apiClient.getSuggestionsByDocumentId(documentId);
  const suggestions = Array.isArray(suggestionsResponse)
    ? suggestionsResponse
    : [suggestionsResponse];

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if ((suggestion as any).userId !== session.user.id) {
    return new ChatSDKError('forbidden:api').toResponse();
  }

  return Response.json(suggestions, { status: 200 });
}
