import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arcade — Product Demos, AI Launch Videos & Multi-Channel Visuals',
  description:
    'Turn any product URL, recording, or screenshot into interactive demos, custom-code AI launch videos, and multi-channel visuals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
