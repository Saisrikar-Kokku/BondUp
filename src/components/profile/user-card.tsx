'use client';

import Link from 'next/link';
import type { Profile } from '@/types/database.types';
import { FollowButton } from './follow-button';
import { MessageButton } from '@/components/messages/message-button';

interface UserCardProps {
    user: Profile;
    currentUserId?: string;
    isFollowing?: boolean;
    showFollowButton?: boolean;
}

export function UserCard({ user, currentUserId, isFollowing = false, showFollowButton = true }: UserCardProps) {
    const isOwnProfile = currentUserId === user.id;

    return (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <Link href={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-80">
                {user.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="h-12 w-12 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-lg font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                        {user.full_name || user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                    {user.bio && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{user.bio}</p>
                    )}
                </div>
            </Link>

            {showFollowButton && !isOwnProfile && (
                <div className="flex gap-2">
                    <MessageButton targetUserId={user.id} />
                    <FollowButton userId={user.id} initialIsFollowing={isFollowing} size="sm" />
                </div>
            )}
        </div>
    );
}
