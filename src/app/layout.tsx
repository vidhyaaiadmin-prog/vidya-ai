import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Vidya AI', template: '%s · Vidya AI' },
  description: 'The all-in-one AI education platform for India. Offline-first, vernacular-first, AI-first.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050816',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-navy antialiased">
        {children}
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0F1228',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '13px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#050816' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#050816' } },
            duration: 3500,
          }}
        />
      </body>
    </html>
  );
}
