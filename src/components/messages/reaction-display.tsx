'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Reaction {
    id: string;
    emoji: string;
    user_id: string;
    profiles?: { username: string };
}

interface ReactionDisplayProps {
    reactions: Reaction[];
    isOwn: boolean;
    currentUserId: string;
    onReactionClick?: () => void;
}

export function ReactionDisplay({
    reactions,
    isOwn,
    currentUserId,
    onReactionClick
}: ReactionDisplayProps) {
    if (!reactions || reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
    }, {} as Record<string, Reaction[]>);

    const emojiList = Object.keys(groupedReactions);
    const totalCount = reactions.length;
    const hasOwnReaction = reactions.some(r => r.user_id === currentUserId);

    return (
        <button
            onClick={onReactionClick}
            className={cn(
                "absolute -bottom-4 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full z-10",
                "bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700",
                "hover:scale-105 active:scale-95 transition-transform duration-150",
                "cursor-pointer select-none text-xs",
                isOwn ? "right-1" : "left-1"
            )}
            style={{
                boxShadow: hasOwnReaction
                    ? '0 1px 8px rgba(139, 92, 246, 0.2)'
                    : '0 1px 4px rgba(0, 0, 0, 0.1)'
            }}
        >
            {/* Emoji orbs - show up to 3 */}
            <div className="flex space-x-0.5">
                {emojiList.slice(0, 3).map((emoji, index) => (
                    <span
                        key={emoji}
                        className={cn(
                            "text-sm relative",
                            "animate-pulse-subtle"
                        )}
                        style={{
                            zIndex: 3 - index,
                            animationDelay: `${index * 200}ms`
                        }}
                    >
                        {emoji}
                    </span>
                ))}
            </div>

            {/* Count if more than 1 */}
            {totalCount > 1 && (
                <span className={cn(
                    "text-[10px] font-medium ml-0.5",
                    hasOwnReaction
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-gray-500 dark:text-gray-400"
                )}>
                    {totalCount}
                </span>
            )}

            {/* Subtle glow for own reaction */}
            {hasOwnReaction && (
                <div
                    className="absolute inset-0 rounded-full opacity-30 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)'
                    }}
                />
            )}

            <style jsx>{`
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s ease-in-out infinite;
                }
            `}</style>
        </button>
    );
}
