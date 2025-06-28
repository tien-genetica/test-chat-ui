import { getSession } from '@/lib/auth';
import type { ArtifactKind } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { ChatSDKError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is missing',
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const documentsResponse = await apiClient.getDocumentsById(id);
  const documents = Array.isArray(documentsResponse)
    ? documentsResponse
    : [documentsResponse];

  const [document] = documents;

  if (!document) {
    return new ChatSDKError('not_found:document').toResponse();
  }

  if ((document as any).userId !== session.user.id) {
    return new ChatSDKError('forbidden:document').toResponse();
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is required.',
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatSDKError('not_found:document').toResponse();
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  const documentsResponse = await apiClient.getDocumentsById(id);
  const documents = Array.isArray(documentsResponse)
    ? documentsResponse
    : documentsResponse
      ? [documentsResponse]
      : [];

  if (documents.length > 0) {
    const [document] = documents;

    if ((document as any).userId !== session.user.id) {
      return new ChatSDKError('forbidden:document').toResponse();
    }
  }

  const document = await apiClient.saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return Response.json(document, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter id is required.',
    ).toResponse();
  }

  if (!timestamp) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter timestamp is required.',
    ).toResponse();
  }

  const session = await getSession();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:document').toResponse();
  }

  const documentsResponse = await apiClient.getDocumentsById(id);
  const documents = Array.isArray(documentsResponse)
    ? documentsResponse
    : [documentsResponse];

  const [document] = documents;

  if ((document as any).userId !== session.user.id) {
    return new ChatSDKError('forbidden:document').toResponse();
  }

  const documentsDeleted = await apiClient.deleteDocumentsByIdAfterTimestamp(
    id,
    new Date(timestamp),
  );

  return Response.json(documentsDeleted, { status: 200 });
}
