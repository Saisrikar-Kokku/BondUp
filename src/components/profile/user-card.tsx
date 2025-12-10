'use client';

import Link from 'next/link';
import { memo } from 'react';
import type { Profile } from '@/types/database.types';
import { FollowButton } from './follow-button';
import { MessageButton } from '@/components/messages/message-button';

interface UserCardProps {
    user: Profile;
    currentUserId?: string;
    isFollowing?: boolean;
    showFollowButton?: boolean;
}

function UserCardComponent({ user, currentUserId, isFollowing = false, showFollowButton = true }: UserCardProps) {
    const isOwnProfile = currentUserId === user.id;

    return (
        <div className="flex items-center justify-between rounded-2xl glass-light p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] group">
            <Link href={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0 flex-1">
                {/* Avatar with subtle ring */}
                <div className="relative flex-shrink-0">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/50 dark:ring-gray-700/50 group-hover:ring-primary-500/30 transition-all"
                        />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-500 text-lg font-bold text-white ring-2 ring-white/50 dark:ring-gray-700/50">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate text-[15px]">
                        {user.full_name || user.username}
                    </p>
                    <p className="text-sm text-primary-500 dark:text-primary-400 font-medium truncate">@{user.username}</p>
                    {user.bio && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{user.bio}</p>
                    )}
                </div>
            </Link>

            {showFollowButton && !isOwnProfile && (
                <div className="flex gap-2 flex-shrink-0 ml-3">
                    <MessageButton targetUserId={user.id} />
                    <FollowButton userId={user.id} initialIsFollowing={isFollowing} size="sm" />
                </div>
            )}
        </div>
    );
}

// Memoize for performance in lists
export const UserCard = memo(UserCardComponent);
