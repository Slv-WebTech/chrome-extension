import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Providers } from '@/components/Providers';
import './globals.css';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'New Tab',
  description:
    'Momentum Dashboard — a fast, private new-tab page with search, shortcuts, weather, tasks, a focus timer and notes.',
  icons: { icon: `${basePath}/icons/icon-32.png` },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" data-accent="indigo" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* External (not inline) so it satisfies the extension CSP; applies the saved theme before first paint. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must block rendering so the theme is applied before first paint */}
        <script src={`${basePath}/boot.js`} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
