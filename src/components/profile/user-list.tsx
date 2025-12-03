'use client';

import { UserCard } from './user-card';
import type { Profile } from '@/types/database.types';

interface UserListProps {
    users: any[]; // Using any[] because the shape from getFollowers/getFollowing is slightly different (nested profile)
    currentUserId: string;
    followingIds: string[];
    emptyMessage?: string;
}

export function UserList({ users, currentUserId, followingIds, emptyMessage = "No users found" }: UserListProps) {
    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                    <span className="text-4xl">👥</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    {emptyMessage}
                </h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {users.map((item) => {
                // Handle different data structures (direct profile vs nested in follower/following)
                const user = item.follower || item.following || item;

                return (
                    <UserCard
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        isFollowing={followingIds.includes(user.id)}
                    />
                );
            })}
        </div>
    );
}
