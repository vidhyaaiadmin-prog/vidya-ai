import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * ═══════════════════════════════════════════════════════════
 *  GLOBAL SECURITY MIDDLEWARE
 *  Runs on EVERY request before it reaches any page or API.
 *  One file protects the whole app (DRY).
 * ═══════════════════════════════════════════════════════════
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const PROTECTED_PATHS = ['/home', '/doubt', '/quiz', '/flashcards', '/planner', '/career', '/interview', '/pyq', '/analytics', '/profile', '/leaderboard', '/resources', '/plagiarism', '/admin'];
const AUTH_PATHS = ['/login', '/onboarding'];

function matches(pathname: string, paths: string[]) {
  return paths.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': [
      "default-src 'self'",
      process.env.NODE_ENV === 'production'
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: *.supabase.co",
      "connect-src 'self' *.supabase.co api.anthropic.com generativelanguage.googleapis.com graph.facebook.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join('; '),
  };
  for (const [key, value] of Object.entries(headers)) res.headers.set(key, value);
  return res;
}

export async function middleware(req: NextRequest) {
  // ── Block suspicious request patterns ─────────────────────
  const url = req.nextUrl.pathname.toLowerCase();
  const BLOCKED_PATHS = ['/.env', '/wp-admin', '/wp-login', '/.git', '/phpmyadmin', '/admin.php', '/xmlrpc.php', '/.aws'];
  if (BLOCKED_PATHS.some(p => url.includes(p))) {
    return new NextResponse('Not found', { status: 404 });
  }

  // ── Block oversized request bodies at the edge ────────────
  // 500KB covers small compressed Vault Mode webcam snapshots (base64, ~320x240 JPEG).
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 500_000) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  // API routes handle their own auth (Bearer token via requireAuth) — never redirect them.
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/');

  // ── Fail closed: if Supabase isn't configured, block protected routes ──
  if (!supabaseReady && !isApiRoute && matches(req.nextUrl.pathname, PROTECTED_PATHS)) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', req.url)));
  }

  // ── Session gate ──
  if (supabaseReady && !isApiRoute) {
    let res = NextResponse.next({ request: req });
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });

    // getUser() revalidates the JWT against the auth server — safe to trust,
    // unlike getSession() which only reads the (spoofable) cookie.
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = req.nextUrl.pathname;

    if (!user && matches(pathname, PROTECTED_PATHS)) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', req.url)));
    }
    if (user && matches(pathname, AUTH_PATHS)) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/home', req.url)));
    }
    return applySecurityHeaders(res);
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    // Apply to everything except static files
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};
