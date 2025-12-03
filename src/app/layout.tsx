import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/contexts/NotificationProvider';
import { NavigationProgress } from '@/components/ui/NavigationProgress';

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

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <NotificationProvider>
                    <Suspense fallback={null}>
                        <NavigationProgress />
                    </Suspense>
                    {children}
                </NotificationProvider>
            </body>
        </html>
    );
}
