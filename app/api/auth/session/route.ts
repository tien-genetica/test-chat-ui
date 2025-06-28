import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      return NextResponse.json({ user: session.user });
    } else {
      return NextResponse.json({ user: null });
    }
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
