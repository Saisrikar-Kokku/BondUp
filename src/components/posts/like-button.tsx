'use client';

import { useState, useRef } from 'react';
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
    const [isAnimating, setIsAnimating] = useState(false);
    const heartRef = useRef<SVGSVGElement>(null);

    const handleLike = async () => {
        if (isLoading) return;

        // Trigger animation
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 400);

        // Optimistic update
        const previousLikeCount = likeCount;
        const previousUserHasLiked = userHasLiked;

        setUserHasLiked(!userHasLiked);
        setLikeCount(userHasLiked ? likeCount - 1 : likeCount + 1);
        setIsLoading(true);

        try {
            const result = await toggleLike(postId);

            if (!result.success) {
                setUserHasLiked(previousUserHasLiked);
                setLikeCount(previousLikeCount);
            } else {
                router.refresh();
            }
        } catch (error) {
            setUserHasLiked(previousUserHasLiked);
            setLikeCount(previousLikeCount);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLike}
            disabled={isLoading}
            className="group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 interactive-glow"
        >
            <svg
                ref={heartRef}
                className={`h-5 w-5 transition-all duration-200 ${isAnimating ? 'animate-like' : ''} ${userHasLiked
                        ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : 'fill-none text-gray-600 dark:text-gray-400 group-hover:text-red-400'
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
            <span className={`font-semibold transition-colors ${userHasLiked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300 group-hover:text-red-400'}`}>
                {likeCount}
            </span>
        </button>
    );
}
