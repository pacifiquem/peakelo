import type { Metadata } from 'next';
import { IBM_Plex_Mono, Source_Sans_3, Syne } from 'next/font/google';
import { cn } from '@/utils/cn';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

const display = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const body = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Peakelo — Master chess',
  description: 'Human chess analysis, player profiles, and drills that actually improve your game.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(display.variable, body.variable, mono.variable, 'antialiased')}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
