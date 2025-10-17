import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM Casona María',
  description: 'Sistema de gestión de eventos para Casona María',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es'>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
