import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/contexts/NotificationProvider';
import { NavigationProgress } from '@/components/ui/NavigationProgress';
import { SessionManager } from '@/components/auth/session-manager';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'BondUp - Connect with Friends',
    description:
        'A modern social media platform to connect, share, and engage with friends and communities.',
    keywords: ['social media', 'networking', 'community', 'chat', 'posts'],
    authors: [{ name: 'BondUp Team' }],
    openGraph: {
        title: 'BondUp - Connect with Friends',
        description: 'A modern social media platform to connect, share, and engage.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'BondUp - Connect with Friends',
        description: 'A modern social media platform to connect, share, and engage.',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

import { PushNotificationPrompt } from '@/components/ui/push-notification-prompt';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Preconnect to Supabase for faster API calls */}
                <link rel="preconnect" href="https://jpzcuudpoepsjawreoic.supabase.co" />
                <link rel="dns-prefetch" href="https://jpzcuudpoepsjawreoic.supabase.co" />
                {/* PWA manifest */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#8B5CF6" />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <NotificationProvider>
                        <SessionManager>
                            <Suspense fallback={null}>
                                <NavigationProgress />
                            </Suspense>
                            <PushNotificationPrompt />
                            {children}
                        </SessionManager>
                    </NotificationProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
