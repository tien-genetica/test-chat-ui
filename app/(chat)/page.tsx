import { Chat } from '@/components/chat';

import { generateUUID } from '@/lib/utils';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const id = generateUUID();

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      {/* DataStreamHandler removed - artifacts handled by external server */}
    </>
  );
}
