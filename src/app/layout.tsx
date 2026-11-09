import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import AuthProvider from '@/components/AuthProvider';
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
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-navy antialiased">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#0A2540',
              border: '1px solid rgba(10,37,64,0.08)',
              borderRadius: '12px',
              fontSize: '13px',
              padding: '12px 16px',
              boxShadow: '0 4px 16px rgba(10,37,64,0.08)',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
            duration: 3500,
          }}
        />
      </body>
    </html>
  );
}
