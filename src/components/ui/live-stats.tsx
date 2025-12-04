'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Stats {
    totalUsers: number;
    totalPosts: number;
    totalConnections: number;
}

/**
 * Real-time stats component that fetches actual counts from database
 */
export function LiveStats() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalPosts: 0,
        totalConnections: 0,
    });
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch user count
                const { count: userCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // Fetch post count
                const { count: postCount } = await supabase
                    .from('posts')
                    .select('*', { count: 'exact', head: true });

                // Fetch follows count (connections)
                const { count: followCount } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    totalUsers: userCount || 0,
                    totalPosts: postCount || 0,
                    totalConnections: followCount || 0,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Subscribe to changes for live updates
        const profilesChannel = supabase
            .channel('stats-profiles')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => fetchStats()
            )
            .subscribe();

        const postsChannel = supabase
            .channel('stats-posts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => fetchStats()
            )
            .subscribe();

        const followsChannel = supabase
            .channel('stats-follows')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'follows' },
                () => fetchStats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(profilesChannel);
            supabase.removeChannel(postsChannel);
            supabase.removeChannel(followsChannel);
        };
    }, [supabase]);

    // Format number for display
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                        <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-1" />
                        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center lg:justify-start gap-8 pt-8">
            <div className="text-center">
                <p className="text-3xl font-bold text-white">
                    {formatNumber(stats.totalUsers)}
                    <span className="text-violet-400">+</span>
                </p>
                <p className="text-sm text-gray-500">Active Users</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
                <p className="text-3xl font-bold text-white">
                    {formatNumber(stats.totalPosts)}
                    <span className="text-violet-400">+</span>
                </p>
                <p className="text-sm text-gray-500">Posts Shared</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
                <p className="text-3xl font-bold text-white">
                    {formatNumber(stats.totalConnections)}
                    <span className="text-violet-400">+</span>
                </p>
                <p className="text-sm text-gray-500">Connections</p>
            </div>
        </div>
    );
}
