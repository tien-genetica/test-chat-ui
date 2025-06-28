import { notFound, redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { Chat } from '@/components/chat';
import { apiClient } from '@/lib/api/client';

import type { APIMessage } from '@/lib/api/types';
import type { Attachment, UIMessage } from 'ai';

export const dynamic = 'force-dynamic';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = (await apiClient.getChatById(id)) as any;

  if (!chat) {
    notFound();
  }

  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = (await apiClient.getMessagesByChatId(
    id,
  )) as APIMessage[];

  function convertToUIMessages(messages: Array<APIMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
      />
      {/* DataStreamHandler removed - artifacts handled by external server */}
    </>
  );
}
