// @ts-nocheck — only active after: npm install @sentry/nextjs@8
try {
  const Sentry = require('@sentry/nextjs');
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    enabled: process.env.NODE_ENV === 'production',
  });
} catch {}
