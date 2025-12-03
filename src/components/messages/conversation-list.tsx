'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationListProps {
    conversations: any[];
    currentUserId: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
    const pathname = usePathname();

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
                                    <img
                                        src={otherUser.avatar_url}
                                        alt={otherUser.username}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold">
                                        {otherUser.username?.[0]?.toUpperCase()}
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
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
