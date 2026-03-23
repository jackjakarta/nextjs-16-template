import { cn } from '@/utils/tailwind';
import { type Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Manrope, Space_Mono } from 'next/font/google';

import './globals.css';

const manropeSans = Manrope({
  variable: '--font-manrope-sans',
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Next.js 16 Template',
    description: 'Template by @jackjakarta',
    icons: { icon: '/favicon.ico' },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(manropeSans.variable, spaceMono.variable, 'antialiased')}>
        <ThemeProvider
          defaultTheme="system"
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
