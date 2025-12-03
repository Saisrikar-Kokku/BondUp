'use client';

import { useState, useEffect } from 'react';
import { getFollowers, getFollowing } from '@/lib/actions/follows';
import { UserCard } from './user-card';
import type { Profile } from '@/types/database.types';

interface FollowListProps {
    userId: string;
    currentUserId?: string;
    type: 'followers' | 'following';
}

export function FollowList({ userId, currentUserId, type }: FollowListProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            const result =
                type === 'followers'
                    ? await getFollowers(userId, 20, 0)
                    : await getFollowing(userId, 20, 0);

            if (result.success && result.data) {
                setUsers(result.data);
                setHasMore(result.data.length === 20);
                setOffset(result.data.length);
            } else {
                setUsers([]);
                setHasMore(false);
                setOffset(0);
            }
            setLoading(false);
        };

        fetchInitial();
    }, [userId, type]);

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);

        const result =
            type === 'followers'
                ? await getFollowers(userId, 20, offset)
                : await getFollowing(userId, 20, offset);

        if (result.success && result.data) {
            setUsers((prev) => [...prev, ...result.data!]);
            setHasMore(result.data.length === 20);
            setOffset((prev) => prev + result.data!.length);
        }

        setLoading(false);
    };

    if (loading && users.length === 0) {
        return <p className="text-center text-gray-500">Loading...</p>;
    }

    if (users.length === 0) {
        return (
            <p className="text-center text-gray-500">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {users.map((item) => {
                const user: Profile = type === 'followers' ? item.follower : item.following;
                return <UserCard key={user.id} user={user} currentUserId={currentUserId} />;
            })}

            {hasMore && (
                <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
}
