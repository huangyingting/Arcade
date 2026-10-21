import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arcade Studio — Product stories, considered.',
  description:
    'Compose interactive walkthroughs, launch films and campaign visuals in one private, invite-only workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="sr-only z-50 rounded bg-white p-3 text-slate-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
