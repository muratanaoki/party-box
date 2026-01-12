import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Party Box',
  description: 'Real-time board game platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
