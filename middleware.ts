import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/reset-password',
];

const authPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/reset-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  
  const isAuthenticated = !!(accessToken && refreshToken);
  const isPublicPath = publicPaths.includes(pathname);
  const isAuthPath = authPaths.includes(pathname);

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};