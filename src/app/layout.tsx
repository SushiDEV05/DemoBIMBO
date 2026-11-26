import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Control Crítico de Planta | Bimbo',
  description: 'Sistema PWA de Monitoreo y Control de Calidad en Planta Panificadora Bimbo',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0c0cff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-gray-100 text-gray-900 antialiased selection:bg-bimbo-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
