'use client';

import { memo } from 'react';
import type { UserWithStories } from '@/lib/actions/stories';

import Image from 'next/image';

interface StoryCardProps {
    userStories: UserWithStories;
    isOwn?: boolean;
    onClick: () => void;
}

function StoryCardComponent({ userStories, isOwn = false, onClick }: StoryCardProps) {
    const { user, has_unseen, stories } = userStories;
    const latestStory = stories[0];
    const storyCount = stories.length;

    return (
        <button
            onClick={onClick}
            className="flex-shrink-0 group relative focus:outline-none"
        >
            {/* Card Container */}
            <div className={`
                relative w-16 h-16 rounded-full overflow-hidden
                transition-all duration-300 ease-out
                group-hover:scale-110 group-active:scale-95
                ${has_unseen
                    ? 'ring-[3px] ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950 ring-gradient-to-r from-pink-500 via-purple-500 to-primary-500'
                    : 'ring-2 ring-gray-200 dark:ring-gray-700'
                }
            `}>
                {/* Gradient ring for unseen - using pseudo element */}
                {has_unseen && (
                    <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-primary-500 -z-10 animate-pulse"
                        style={{ animationDuration: '3s' }}
                    />
                )}

                {/* Story preview or avatar */}
                {latestStory?.media_url ? (
                    <Image
                        src={latestStory.media_url}
                        alt={`${user.username}'s story`}
                        fill
                        className="object-cover"
                        sizes="64px"
                    />
                ) : user.avatar_url ? (
                    <Image
                        src={user.avatar_url}
                        alt={user.username}
                        fill
                        className="object-cover"
                        sizes="64px"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                            {user.username.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Story count badge */}
                {storyCount > 1 && (
                    <div className="absolute top-0 right-0 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                        {storyCount}
                    </div>
                )}
            </div>

            {/* Username */}
            <p className={`
                mt-2 text-xs text-center truncate w-16
                transition-colors duration-200
                ${has_unseen
                    ? 'font-semibold text-gray-900 dark:text-white'
                    : 'font-medium text-gray-500 dark:text-gray-400'
                }
                group-hover:text-primary-500
            `}>
                {isOwn ? 'You' : user.username}
            </p>
        </button>
    );
}

export const StoryCard = memo(StoryCardComponent);
