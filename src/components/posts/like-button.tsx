'use client';

import { useState } from 'react';
import { toggleLike } from '@/lib/actions/likes';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
    postId: string;
    initialLikeCount: number;
    initialUserHasLiked: boolean;
}

export function LikeButton({ postId, initialLikeCount, initialUserHasLiked }: LikeButtonProps) {
    const router = useRouter();
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [userHasLiked, setUserHasLiked] = useState(initialUserHasLiked);
    const [isLoading, setIsLoading] = useState(false);

    const handleLike = async () => {
        if (isLoading) return;

        // Optimistic update
        const previousLikeCount = likeCount;
        const previousUserHasLiked = userHasLiked;

        setUserHasLiked(!userHasLiked);
        setLikeCount(userHasLiked ? likeCount - 1 : likeCount + 1);
        setIsLoading(true);

        try {
            const result = await toggleLike(postId);

            if (!result.success) {
                // Revert on error
                setUserHasLiked(previousUserHasLiked);
                setLikeCount(previousLikeCount);
                console.error('Failed to toggle like:', result.error);
            } else {
                // Refresh to get accurate counts from server
                router.refresh();
            }
        } catch (error) {
            // Revert on error
            setUserHasLiked(previousUserHasLiked);
            setLikeCount(previousLikeCount);
            console.error('Error toggling like:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLike}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
            <svg
                className={`h-5 w-5 transition-all ${userHasLiked
                        ? 'fill-red-500 text-red-500 scale-110'
                        : 'fill-none text-gray-600 dark:text-gray-400'
                    }`}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            <span className={userHasLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                {likeCount}
            </span>
        </button>
    );
}
