import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BaGame | Web Game Hub',
  description: 'Discover, frame, and play user-submitted web games, HTML5 & WebGL titles in BaGame.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col bg-[#f5f5f4]">
          {children}
        </div>
      </body>
    </html>
  );
}
