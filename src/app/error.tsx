'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const w = window as any;
    if (w.__SENTRY__?.hub) w.__SENTRY__.hub.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="font-display font-bold text-xl text-text-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-text-secondary">
          An unexpected error occurred. Please try again or refresh the page.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-orange text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <a
            href="/home"
            className="px-5 py-2.5 rounded-xl border border-card-border text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
