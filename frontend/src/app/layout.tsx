import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { LanguageProvider } from '@/components/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { ThemeBackground } from '@/components/ThemeBackground';

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
        <ThemeBackground />
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col bg-[#050505] text-[#f3f4f6]">
              <Navbar />
              {children}
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
