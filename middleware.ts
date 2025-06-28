import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Skip auth check for login/register pages
  if (['/login', '/register'].includes(pathname)) {
    return NextResponse.next();
  }

  // Get session from our custom auth system
  const session = await getSession();

  if (!session) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/login?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - login, register (auth pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login|register).*)',
  ],
};
