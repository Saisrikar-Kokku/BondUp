'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RecentUser {
    id: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
}

/**
 * Real-time display of users who recently signed up
 * Shows animated cards as new users join
 */
export function RecentSignups() {
    const [users, setUsers] = useState<RecentUser[]>([]);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        // Fetch initial recent users
        const fetchRecentUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setUsers(data);
            }
        };

        fetchRecentUsers();

        // Subscribe to new signups
        const channel = supabase
            .channel('new-signups')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    const newUser = payload.new as RecentUser;
                    setUsers((prev) => {
                        // Add new user at the beginning, keep only last 5
                        const updated = [newUser, ...prev].slice(0, 5);
                        return updated;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // Get time ago string
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (users.length === 0) return null;

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-400">Live</span>
                </div>
                <p className="text-gray-400 text-sm">People joining right now</p>
            </div>

            <div className="space-y-3">
                {users.map((user, index) => (
                    <div
                        key={user.id}
                        className="animate-in slide-in-from-right fade-in duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                            {/* Avatar */}
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.username}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-500/30"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold ring-2 ring-violet-500/30">
                                    {user.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                    @{user.username}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Joined {getTimeAgo(user.created_at)}
                                </p>
                            </div>

                            {/* New badge for very recent */}
                            {index === 0 && (
                                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full">
                                    New
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Total users hint */}
            <p className="text-center text-gray-500 text-xs mt-4">
                Join thousands of users on BondUp
            </p>
        </div>
    );
}

/**
 * Compact version for sidebar or smaller spaces
 */
export function RecentSignupsCompact() {
    const [users, setUsers] = useState<RecentUser[]>([]);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const fetchRecentUsers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data) {
                setUsers(data);
            }
        };

        fetchRecentUsers();

        const channel = supabase
            .channel('new-signups-compact')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    const newUser = payload.new as RecentUser;
                    setUsers((prev) => [newUser, ...prev].slice(0, 3));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    if (users.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            {/* Stacked avatars */}
            <div className="flex -space-x-3">
                {users.map((user, index) => (
                    <div
                        key={user.id}
                        className="relative"
                        style={{ zIndex: users.length - index }}
                    >
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#030014]"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-[#030014]">
                                {user.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-gray-400">
                    {users.length > 0 && `@${users[0].username} just joined`}
                </span>
            </div>
        </div>
    );
}
