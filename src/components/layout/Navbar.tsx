'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MessageBell } from '@/components/messages/message-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
            {/* Desktop Navigation (Top) - Glassmorphism */}
            <nav className="hidden md:block border-b border-white/10 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/feed" className="group">
                            <h1 className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-2xl font-bold text-transparent group-hover:scale-105 transition-transform duration-300">
                                BondUp
                            </h1>
                        </Link>

                        <div className="flex items-center gap-2">
                            {navItems.map((item) => (
                                <Link key={item.href} href={item.href} prefetch={true}>
                                    <Button
                                        variant={isActive(item.href) ? 'default' : 'ghost'}
                                        className={`gap-2 transition-all duration-200 active:scale-95 ${isActive(item.href) ? 'shadow-lg shadow-primary-500/25' : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/80'}`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                </Link>
                            ))}

                            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                                <ThemeToggle />
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

            {/* Mobile Navigation (Top Bar) - Glassmorphism */}
            <nav className="md:hidden border-b border-white/10 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 px-4 h-14 flex items-center justify-between shadow-sm">
                <Link href="/feed" className="group">
                    <h1 className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-xl font-bold text-transparent group-hover:scale-105 transition-transform duration-300">
                        BondUp
                    </h1>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <MessageBell />
                    <NotificationBell />
                    <form action="/api/auth/signout" method="post">
                        <Button variant="ghost" size="icon" type="submit" className="h-8 w-8">
                            <LogOut className="h-5 w-5 text-gray-500" />
                        </Button>
                    </form>
                </div>
            </nav>

            {/* Mobile Navigation (Bottom Bar) - Glassmorphism */}
            <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 dark:border-gray-700/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg z-50 pb-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] ${pathname?.startsWith('/messages/') && pathname !== '/messages' ? 'hidden' : ''}`}>
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
