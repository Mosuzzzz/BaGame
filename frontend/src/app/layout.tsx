import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import { LanguageProvider } from '@/components/LanguageContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { Navbar } from '@/components/Navbar';
import { ThemeBackground } from '@/components/ThemeBackground';
import { FloatingMenu } from '@/components/FloatingMenu';

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
      <body className="bg-white dark:bg-[#050505] text-gray-900 dark:text-[#f3f4f6] transition-colors duration-300">
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider>
              <div className="min-h-screen flex flex-col relative">
                <ThemeBackground />
                <Navbar />
                {children}
                <FloatingMenu />
              </div>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
