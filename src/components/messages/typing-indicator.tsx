'use client';

import { memo } from 'react';

interface TypingIndicatorProps {
    username?: string;
    avatarUrl?: string;
}

/**
 * Modern typing indicator inspired by 21st.dev
 * Shows animated bouncing dots when user is typing
 */
function TypingIndicatorInner({ username, avatarUrl }: TypingIndicatorProps) {
    return (
        <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Avatar */}
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={username || 'User'}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white text-xs font-bold flex-shrink-0">
                    {username?.[0]?.toUpperCase() || '?'}
                </div>
            )}

            {/* Typing bubble */}
            <div className="relative">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                        {/* Animated dots */}
                        <span
                            className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 animate-bounce"
                            style={{ animationDelay: '0ms', animationDuration: '600ms' }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 animate-bounce"
                            style={{ animationDelay: '150ms', animationDuration: '600ms' }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 animate-bounce"
                            style={{ animationDelay: '300ms', animationDuration: '600ms' }}
                        />
                    </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl rounded-bl-md bg-gradient-to-r from-primary-500/10 to-secondary-500/10 blur-sm -z-10" />
            </div>
        </div>
    );
}

export const TypingIndicator = memo(TypingIndicatorInner);

/**
 * Hook-style typing status for cleaner integration
 */
interface UseTypingIndicatorProps {
    isTyping: boolean;
    username?: string;
    avatarUrl?: string;
}

export function TypingStatus({ isTyping, username, avatarUrl }: UseTypingIndicatorProps) {
    if (!isTyping) return null;

    return (
        <div className="px-4 py-2">
            <TypingIndicator username={username} avatarUrl={avatarUrl} />
            <p className="mt-1 ml-10 text-xs text-gray-500 dark:text-gray-400">
                {username ? `${username} is typing...` : 'Typing...'}
            </p>
        </div>
    );
}
