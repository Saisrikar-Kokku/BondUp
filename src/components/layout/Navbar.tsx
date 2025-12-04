'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MessageBell } from '@/components/messages/message-bell';
import { Home, Compass, Users, User, LogOut, Search } from 'lucide-react';

interface NavbarProps {
    user: {
        id: string;
        username: string;
        avatar_url?: string | null;
    };
}

export function Navbar({ user }: NavbarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/feed' && pathname === '/feed') return true;
        if (path !== '/feed' && pathname?.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        {
            label: 'Feed',
            href: '/feed',
            icon: Home,
        },
        {
            label: 'Search',
            href: '/search',
            icon: Search,
        },
        {
            label: 'Explore',
            href: '/explore',
            icon: Compass,
        },
        {
            label: 'Discover',
            href: '/discover',
            icon: Users,
        },
        {
            label: 'Profile',
            href: `/profile/${user.username}`,
            icon: User,
        },
    ];

    return (
        <>
            {/* Desktop Navigation (Top) */}
            <nav className="hidden md:block border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/feed">
                            <h1 className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-2xl font-bold text-transparent hover:opacity-80 transition-opacity">
                                BondUp
                            </h1>
                        </Link>

                        <div className="flex items-center gap-2">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} prefetch={true}>
                                    <Button
                                        variant={isActive(item.href) ? 'default' : 'ghost'}
                                        className="gap-2 transition-transform active:scale-95"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}

                            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                                <MessageBell />
                                <NotificationBell />
                                <form action="/api/auth/signout" method="post">
                                    <Button variant="ghost" size="icon" type="submit" title="Sign Out">
                                        <LogOut className="h-5 w-5 text-gray-500 hover:text-red-500 transition-colors" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation (Top Bar) */}
            <nav className="md:hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-40 px-4 h-14 flex items-center justify-between">
                <Link href="/feed">
                    <h1 className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-xl font-bold text-transparent">
                        BondUp
                    </h1>
                </Link>
                <div className="flex items-center gap-3">
                    <MessageBell />
                    <NotificationBell />
                    <form action="/api/auth/signout" method="post">
                        <Button variant="ghost" size="icon" type="submit" className="h-8 w-8">
                            <LogOut className="h-5 w-5 text-gray-500" />
                        </Button>
                    </form>
                </div>
            </nav>

            {/* Mobile Navigation (Bottom Bar) */}
            <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 z-50 pb-1 ${pathname?.startsWith('/messages/') && pathname !== '/messages' ? 'hidden' : ''}`}>
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-transform active:scale-90 ${active
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <item.icon
                                    className={`h-6 w-6 transition-transform duration-200 ${active ? 'scale-110' : ''
                                        }`}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
