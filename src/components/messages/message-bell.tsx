'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getUnreadMessageCount } from '@/lib/actions/messages';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function MessageBell() {
    const [count, setCount] = useState(0);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        // Fetch initial count
        const fetchCount = async () => {
            const result = await getUnreadMessageCount();
            if (result.success && typeof result.count === 'number') {
                setCount(result.count);
            }
        };

        fetchCount();

        // Subscribe to new messages
        const channel = supabase
            .channel('unread-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    const newMsg = payload.new;
                    // Check if message is for us (not sent by us)
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user && newMsg.sender_id !== user.id) {
                        setCount((prev) => prev + 1);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    // If message marked as read, re-fetch or decrement
                    // Re-fetching is safer to stay in sync
                    fetchCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <Link href="/messages">
            <Button variant="ghost" size="icon" className="relative">
                <MessageCircle className="h-5 w-5 text-gray-500 hover:text-primary-600 transition-colors" />
                {count > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[1.25rem] h-5">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </Button>
        </Link>
    );
}
