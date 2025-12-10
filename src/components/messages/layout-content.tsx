'use client';

import { usePathname } from 'next/navigation';
import { ConversationList } from './conversation-list';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';

interface MessagesLayoutContentProps {
    children: React.ReactNode;
    conversations: any[];
    currentUserId: string;
    userProfile: any;
}

export function MessagesLayoutContent({ children, conversations: initialConversations, currentUserId, userProfile }: MessagesLayoutContentProps) {
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
                            return prev;
                        }

                        const updatedConversation = {
                            ...prev[conversationIndex],
                            last_message: newMsg,
                            updated_at: newMsg.created_at
                        };

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
        <>
            {/* Mobile Navbar - only show when NOT in a chat */}
            {!isChatOpen && (
                <div className="md:hidden">
                    <Navbar user={userProfile} />
                </div>
            )}

            <div className={cn(
                "flex-1 flex max-w-7xl mx-auto w-full overflow-x-hidden",
                isChatOpen ? "h-[100dvh] md:h-[calc(100vh-4rem)]" : "h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-4rem)]"
            )}>
                <div className={cn(
                    "w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
                    isChatOpen ? "hidden md:flex" : "flex"
                )}>
                    <ConversationList conversations={conversations} currentUserId={currentUserId} />
                </div>
                <div className={cn(
                    "flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden",
                    !isChatOpen ? "hidden md:flex" : "flex"
                )}>
                    {children}
                </div>
            </div>
        </>
    );
}
