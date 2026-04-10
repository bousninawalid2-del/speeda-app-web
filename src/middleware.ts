import { NextRequest, NextResponse } from 'next/server';

// Public routes — accessible without authentication
const PUBLIC_PATHS = [
  '/',
  '/onboarding',
  '/auth',
  '/auth/verify',
  '/auth/verified',
  '/auth/reset-password',
  '/auth/magic',
  '/product',
];

// Paths that should redirect to /dashboard when already authenticated
const AUTH_ONLY_PATHS = ['/auth', '/onboarding', '/'];

/**
 * Middleware runs on every request.
 * - Reads the access token stored in a cookie (set by AuthContext SSR-compat helper).
 * - Redirects unauthenticated users trying to reach /dashboard/** to /auth.
 * - Redirects already-authenticated users trying to reach /auth/* to /dashboard.
 *
 * NOTE: Because auth state lives in localStorage (client-side), the middleware
 * uses a lightweight cookie `speeda_auth` that AuthContext keeps in sync.
 * See AuthContext where we write/clear this cookie alongside localStorage.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.has('speeda_auth');
  const hasSetup = request.cookies.has('speeda_setup_done');
  const isDashboard = pathname.startsWith('/dashboard');
  const isSetup = pathname === '/setup';
  const isAuthPath = AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Protect dashboard routes
  if (isDashboard && !isAuthenticated) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect setup route — requires auth
  if (isSetup && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If authenticated but setup not done → force /setup before dashboard
  if (isDashboard && isAuthenticated && !hasSetup) {
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // Redirect logged-in users away from auth screens
  if (isAuthPath && isAuthenticated && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
