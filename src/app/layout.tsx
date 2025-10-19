import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Plexo - Tu centro de operaciones para eventos inolvidables',
  description: 'Plexo es el sistema nervioso central de tu negocio de eventos. No es solo una lista de salas; es la red inteligente que conecta cada punto del proceso.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light'
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark')
                }
              })()
            `
          }}
        />
      </head>
      <body className="bg-background text-foreground transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
