'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, markConversationAsRead } from '@/lib/actions/messages';
import { MessageBubble } from './message-bubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ChatWindowProps {
    conversationId: string;
    initialMessages: any[];
    currentUserId: string;
    otherUser: any;
}

export function ChatWindow({ conversationId, initialMessages, currentUserId, otherUser }: ChatWindowProps) {
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // Use useState to ensure client is created once per component lifecycle
    const [supabase] = useState(() => createClient());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Mark as read on mount
        markConversationAsRead(conversationId);
    }, [conversationId]);

    useEffect(() => {
        // Subscribe to new messages
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages((prev) => {
                        // Check if message already exists (deduplication)
                        if (prev.some(m => m.id === newMsg.id)) {
                            return prev;
                        }
                        return [...prev, newMsg];
                    });

                    // Mark as read if it's from other user AND window is focused
                    if (newMsg.sender_id !== currentUserId && document.hasFocus()) {
                        markConversationAsRead(conversationId);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const updatedMsg = payload.new;
                    setMessages((prev) => prev.map(m =>
                        m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
                    ));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const deletedId = payload.old.id;
                    setMessages((prev) => prev.filter(m => m.id !== deletedId));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase, currentUserId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        // Optimistic update
        const tempId = Date.now().toString();
        const tempMessage = {
            id: tempId,
            content: newMessage,
            sender_id: currentUserId,
            created_at: new Date().toISOString(),
            conversation_id: conversationId,
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage('');

        const result = await sendMessage(conversationId, tempMessage.content);

        if (!result.success) {
            // Revert optimistic update on failure
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            console.error('Failed to send message');
        } else {
            // Replace temp message with real one
            setMessages((prev) => {
                const realMsg = result.data;
                // Check if real message was already added by subscription
                if (prev.some(m => m.id === realMsg.id)) {
                    // If yes, just remove the temp message
                    return prev.filter(m => m.id !== tempId);
                }
                // If no, replace temp with real
                return prev.map(m => m.id === tempId ? realMsg : m);
            });
        }

        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm sticky top-0 z-50">
                <Link href="/messages" className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <Link
                    href={`/profile/${otherUser.username}`}
                    className="flex-1 flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
                >
                    {otherUser.avatar_url ? (
                        <img
                            src={otherUser.avatar_url}
                            alt={otherUser.username}
                            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-bold flex-shrink-0">
                            {otherUser.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {otherUser.full_name || otherUser.username}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{otherUser.username}</p>
                    </div>
                </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === currentUserId;
                    const isLastOwnMessage = isOwn && !messages.slice(index + 1).some(m => m.sender_id === currentUserId);
                    const showSeen = isLastOwnMessage && msg.is_read;

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            showSeen={showSeen}
                            readAt={msg.read_at}
                            onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                        />
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={isSending}
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
