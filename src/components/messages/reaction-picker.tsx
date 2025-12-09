'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { addReaction } from '@/lib/actions/reactions';

const EMOJIS = ['❤️', '😂', '😮', '😢', '🔥'] as const;

interface ReactionPickerProps {
    messageId: string;
    isVisible: boolean;
    onClose: () => void;
    onReact: (emoji: string) => void;
    position: 'left' | 'right';
    currentReaction?: string;
}

export function ReactionPicker({
    messageId,
    isVisible,
    onClose,
    onReact,
    position,
    currentReaction
}: ReactionPickerProps) {
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(currentReaction || null);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const handleEmojiClick = async (emoji: string) => {
        const isRemoving = selectedEmoji === emoji;
        setSelectedEmoji(isRemoving ? null : emoji);
        onReact(isRemoving ? '' : emoji);

        // Small delay for animation before closing
        setTimeout(() => {
            onClose();
        }, 150);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Picker */}
            <div
                className={cn(
                    "absolute z-50 flex gap-1 p-2 rounded-full",
                    "bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl",
                    "shadow-2xl border border-gray-200/50 dark:border-gray-700/50",
                    "transform transition-all duration-300 ease-out",
                    isAnimating ? "scale-100 opacity-100" : "scale-75 opacity-0",
                    position === 'right' ? "-top-14 right-0" : "-top-14 left-0"
                )}
                style={{
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.05)'
                }}
            >
                {EMOJIS.map((emoji, index) => (
                    <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full",
                            "text-xl transition-all duration-200 ease-out",
                            "hover:scale-125 hover:bg-violet-100 dark:hover:bg-violet-900/30",
                            "active:scale-95",
                            selectedEmoji === emoji && "bg-violet-100 dark:bg-violet-900/50 ring-2 ring-violet-400"
                        )}
                        style={{
                            animationDelay: `${index * 30}ms`,
                            animation: isAnimating ? 'popIn 0.3s ease-out forwards' : 'none'
                        }}
                    >
                        <span className={cn(
                            "transition-transform duration-200",
                            selectedEmoji === emoji && "scale-110"
                        )}>
                            {emoji}
                        </span>
                    </button>
                ))}
            </div>

            <style jsx>{`
                @keyframes popIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.5) translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </>
    );
}
