import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
