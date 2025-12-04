'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Activity {
    id: string;
    type: 'signup' | 'post' | 'like' | 'follow' | 'message';
    username: string;
    avatar_url: string | null;
    created_at: string;
    metadata?: {
        count?: number;
        content?: string;
    };
}

// City locations for display
const cities = [
    'New York, USA', 'London, UK', 'Tokyo, Japan', 'Paris, France',
    'Mumbai, India', 'Sydney, Australia', 'Berlin, Germany', 'Singapore',
    'Dubai, UAE', 'Toronto, Canada', 'São Paulo, Brazil', 'Seoul, Korea'
];

function getRandomCity() {
    return cities[Math.floor(Math.random() * cities.length)];
}

function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Real-time activity cards that display around the globe
 */
export function LiveActivityCards() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        // Fetch initial activities
        const fetchActivities = async () => {
            // Get recent signups
            const { data: signups } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(2);

            // Get recent posts
            const { data: posts } = await supabase
                .from('posts')
                .select('id, user_id, created_at, profiles(username, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(2);

            // Get recent follows
            const { data: follows } = await supabase
                .from('follows')
                .select('id, follower_id, created_at, profiles!follows_follower_id_fkey(username, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(2);

            const newActivities: Activity[] = [];

            // Add signups
            signups?.forEach((signup) => {
                newActivities.push({
                    id: `signup-${signup.id}`,
                    type: 'signup',
                    username: signup.username,
                    avatar_url: signup.avatar_url,
                    created_at: signup.created_at,
                });
            });

            // Add posts
            posts?.forEach((post: any) => {
                if (post.profiles) {
                    newActivities.push({
                        id: `post-${post.id}`,
                        type: 'post',
                        username: post.profiles.username,
                        avatar_url: post.profiles.avatar_url,
                        created_at: post.created_at,
                    });
                }
            });

            // Add follows
            follows?.forEach((follow: any) => {
                if (follow.profiles) {
                    newActivities.push({
                        id: `follow-${follow.id}`,
                        type: 'follow',
                        username: follow.profiles.username,
                        avatar_url: follow.profiles.avatar_url,
                        created_at: follow.created_at,
                    });
                }
            });

            // Sort by date and take top 4
            newActivities.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setActivities(newActivities.slice(0, 4));
        };

        fetchActivities();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('live-activity')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'profiles' },
                (payload) => {
                    const profile = payload.new as any;
                    const newActivity: Activity = {
                        id: `signup-${profile.id}`,
                        type: 'signup' as const,
                        username: profile.username,
                        avatar_url: profile.avatar_url,
                        created_at: profile.created_at,
                    };
                    setActivities((prev) => [newActivity, ...prev].slice(0, 4));
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'posts' },
                async (payload) => {
                    const post = payload.new as any;
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', post.user_id)
                        .single();

                    if (profile) {
                        const newActivity: Activity = {
                            id: `post-${post.id}`,
                            type: 'post' as const,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                            created_at: post.created_at,
                        };
                        setActivities((prev) => [newActivity, ...prev].slice(0, 4));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'follows' },
                async (payload) => {
                    const follow = payload.new as any;
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, avatar_url')
                        .eq('id', follow.follower_id)
                        .single();

                    if (profile) {
                        const newActivity: Activity = {
                            id: `follow-${follow.id}`,
                            type: 'follow' as const,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                            created_at: follow.created_at,
                        };
                        setActivities((prev) => [newActivity, ...prev].slice(0, 4));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'signup': return '👋';
            case 'post': return '📸';
            case 'like': return '❤️';
            case 'follow': return '🔔';
            case 'message': return '💬';
            default: return '✨';
        }
    };

    const getActivityText = (type: string) => {
        switch (type) {
            case 'signup': return 'Joined BondUp';
            case 'post': return 'Shared a post';
            case 'like': return 'Liked a post';
            case 'follow': return 'New follower';
            case 'message': return 'New message';
            default: return 'Activity';
        }
    };

    const getGradient = (type: string) => {
        switch (type) {
            case 'signup': return 'from-violet-500 to-purple-500';
            case 'post': return 'from-pink-500 to-rose-500';
            case 'like': return 'from-red-500 to-pink-500';
            case 'follow': return 'from-yellow-500 to-orange-500';
            case 'message': return 'from-green-500 to-emerald-500';
            default: return 'from-blue-500 to-cyan-500';
        }
    };

    // If no activities yet, show placeholder data
    const displayActivities = activities.length > 0 ? activities : [
        { id: '1', type: 'signup' as const, username: 'user', avatar_url: null, created_at: new Date().toISOString() },
        { id: '2', type: 'post' as const, username: 'user', avatar_url: null, created_at: new Date().toISOString() },
        { id: '3', type: 'follow' as const, username: 'user', avatar_url: null, created_at: new Date().toISOString() },
        { id: '4', type: 'message' as const, username: 'user', avatar_url: null, created_at: new Date().toISOString() },
    ];

    const cardPositions = [
        'absolute -top-4 left-0 lg:-left-24 animate-float-slow z-20',
        'absolute -bottom-4 right-0 lg:-right-16 animate-float-reverse z-20',
        'absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-28 animate-float-slow z-20',
        'hidden lg:block absolute top-1/3 -left-32 animate-float-reverse z-20',
    ];

    const animationDelays = ['0s', '0.5s', '1s', '1.5s'];

    return (
        <>
            {displayActivities.slice(0, 4).map((activity, index) => (
                <div
                    key={activity.id}
                    className={cardPositions[index]}
                    style={{ animationDelay: animationDelays[index] }}
                >
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-xl animate-in slide-in-from-right fade-in duration-500">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getGradient(activity.type)} flex items-center justify-center text-white text-sm`}>
                                {getActivityIcon(activity.type)}
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">
                                    {activities.length > 0 ? getActivityText(activity.type) : getActivityText(activity.type)}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {activities.length > 0
                                        ? `@${activity.username} • ${getTimeAgo(activity.created_at)}`
                                        : getRandomCity()
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}
