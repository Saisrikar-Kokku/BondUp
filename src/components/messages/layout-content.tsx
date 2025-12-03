'use client';

import { usePathname } from 'next/navigation';
import { ConversationList } from './conversation-list';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MessagesLayoutContentProps {
    children: React.ReactNode;
    conversations: any[];
    currentUserId: string;
}

export function MessagesLayoutContent({ children, conversations: initialConversations, currentUserId }: MessagesLayoutContentProps) {
    const pathname = usePathname();
    const isChatOpen = pathname !== '/messages';
    const [conversations, setConversations] = useState(initialConversations);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        // Subscribe to all new messages to update the conversation list
        const channel = supabase
            .channel('user-conversations')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new;
                    setConversations((prev) => {
                        const conversationIndex = prev.findIndex(c => c.id === newMsg.conversation_id);

                        if (conversationIndex === -1) {
                            // New conversation or one we don't have loaded? 
                            // Ideally we should fetch it, but for now we ignore to avoid complexity
                            return prev;
                        }

                        const updatedConversation = {
                            ...prev[conversationIndex],
                            last_message: newMsg,
                            updated_at: newMsg.created_at
                        };

                        // Remove old entry and add new one at top
                        const newConversations = [...prev];
                        newConversations.splice(conversationIndex, 1);
                        return [updatedConversation, ...newConversations];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <div className={cn(
            "flex-1 flex max-w-7xl mx-auto w-full md:h-[calc(100vh-4rem)] md:pb-0 overflow-x-hidden",
            isChatOpen ? "h-[calc(100dvh-3.5rem)]" : "h-[calc(100dvh-7.5rem)]"
        )}>
            <div className={cn(
                "w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
                isChatOpen ? "hidden md:flex" : "flex"
            )}>
                <ConversationList conversations={conversations} currentUserId={currentUserId} />
            </div>
            <div className={cn(
                "flex-1 bg-gray-50 dark:bg-gray-900",
                !isChatOpen ? "hidden md:flex" : "flex"
            )}>
                {children}
            </div>
        </div>
    );
}
