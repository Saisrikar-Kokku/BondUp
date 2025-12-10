'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ConversationListProps {
    conversations: any[];
    currentUserId: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
    const pathname = usePathname();
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
    const [supabase] = useState(() => createClient());

    // Subscribe to typing indicators for all conversations
    useEffect(() => {
        const channels = conversations.map(convo => {
            const channel = supabase
                .channel(`typing:${convo.id}`)
                .on('broadcast', { event: 'typing' }, (payload) => {
                    const { userId, isTyping } = payload.payload;
                    if (userId !== currentUserId) {
                        setTypingUsers(prev => ({
                            ...prev,
                            [convo.id]: isTyping
                        }));

                        // Auto-clear typing after 4 seconds
                        if (isTyping) {
                            setTimeout(() => {
                                setTypingUsers(prev => ({
                                    ...prev,
                                    [convo.id]: false
                                }));
                            }, 4000);
                        }
                    }
                })
                .subscribe();
            return channel;
        });

        return () => {
            channels.forEach(channel => {
                supabase.removeChannel(channel);
            });
        };
    }, [conversations, currentUserId, supabase]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No conversations yet
                    </div>
                ) : (
                    conversations.map((convo) => {
                        const isActive = pathname === `/messages/${convo.id}`;
                        const otherUser = convo.other_user;
                        const isTyping = typingUsers[convo.id];

                        if (!otherUser) return null;

                        return (
                            <Link
                                key={convo.id}
                                href={`/messages/${convo.id}`}
                                className={cn(
                                    "flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800",
                                    isActive && "bg-primary-50 dark:bg-primary-900/10 border-l-4 border-l-primary-500"
                                )}
                            >
                                {otherUser.avatar_url ? (
                                    <div className="relative">
                                        <img
                                            src={otherUser.avatar_url}
                                            alt={otherUser.username}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                        {isTyping && (
                                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                                <span className="animate-pulse text-[8px] text-white">●</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold">
                                            {otherUser.username?.[0]?.toUpperCase()}
                                        </div>
                                        {isTyping && (
                                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                                <span className="animate-pulse text-[8px] text-white">●</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {otherUser.full_name || otherUser.username}
                                        </h3>
                                        {convo.last_message && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                                {formatDistanceToNow(new Date(convo.last_message.created_at), { addSuffix: false })}
                                            </span>
                                        )}
                                        {convo.last_message && !convo.last_message.is_read && convo.last_message.sender_id !== currentUserId && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 flex-shrink-0 ml-2" />
                                        )}
                                    </div>
                                    {isTyping ? (
                                        <p className="text-sm text-primary-500 dark:text-primary-400 italic flex items-center gap-1">
                                            <span className="inline-flex gap-0.5">
                                                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                                                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                                                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                                            </span>
                                            typing...
                                        </p>
                                    ) : (
                                        <p className={cn(
                                            "text-sm truncate",
                                            convo.last_message && !convo.last_message.is_read && convo.last_message.sender_id !== currentUserId
                                                ? "font-bold text-gray-900 dark:text-white"
                                                : "text-gray-500 dark:text-gray-400"
                                        )}>
                                            {convo.last_message
                                                ? (convo.last_message.sender_id === currentUserId ? 'You: ' : '') + convo.last_message.content
                                                : 'Start a conversation'}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
