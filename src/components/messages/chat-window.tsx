'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, markConversationAsRead, getMessages } from '@/lib/actions/messages';
import { MessageBubble } from './message-bubble';
import { TypingStatus } from './typing-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, X, Reply, ImagePlus, Mic } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VoiceRecorder } from './voice-recorder';

interface Reaction {
    id: string;
    emoji: string;
    user_id: string;
    profiles?: { username: string };
}

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    image_url?: string;
    audio_url?: string;
    audio_duration?: number;
    reply_to_id?: string;
    reply_to?: {
        id: string;
        content: string;
        sender_id: string;
    };
    reactions?: Reaction[];
}

interface ChatWindowProps {
    conversationId: string;
    initialMessages: Message[];
    currentUserId: string;
    otherUser: any;
}

export function ChatWindow({ conversationId, initialMessages, currentUserId, otherUser }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; duration: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingBroadcast = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [supabase] = useState(() => createClient());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOtherUserTyping]);

    // Mark messages as read on mount and when window gains focus
    useEffect(() => {
        markConversationAsRead(conversationId);

        // Also mark as read when window gains focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                markConversationAsRead(conversationId);
                // Refetch messages to get updated read statuses
                getMessages(conversationId).then(result => {
                    if (result.success && result.data) {
                        setMessages(result.data);
                    }
                });
            }
        };

        const handleFocus = () => {
            markConversationAsRead(conversationId);
            // Refetch to update seen status from sender side
            getMessages(conversationId).then(result => {
                if (result.success && result.data) {
                    setMessages(result.data);
                }
            });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [conversationId]);

    // Handle reply selection
    const handleReply = useCallback((message: Message) => {
        setReplyingTo(message);
        // Focus input when replying
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, []);

    // Cancel reply
    const cancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);

    // Handle reaction update - refetch messages to get updated reactions
    const handleReactionUpdate = useCallback(async () => {
        const result = await getMessages(conversationId);
        if (result.success && result.data) {
            setMessages(result.data);
        }
    }, [conversationId]);

    // Handle image selection
    const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setImageError('Please select a JPG, PNG, or WebP image');
            return;
        }

        // Validate file size (6MB)
        const maxSizeMB = 6;
        if (file.size > maxSizeMB * 1024 * 1024) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            setImageError(`Image is ${fileSizeMB}MB. Maximum allowed is ${maxSizeMB}MB.`);
            return;
        }

        setImageError(null);
        setSelectedImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    // Clear selected image
    const clearImage = useCallback(() => {
        setSelectedImage(null);
        setImagePreview(null);
        setImageError(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    }, []);

    // Handle audio recording complete
    const handleRecordingComplete = useCallback((audioBlob: Blob, duration: number) => {
        setPendingAudio({ blob: audioBlob, duration });
        setIsRecording(false);
    }, []);

    // Clear pending audio
    const clearAudio = useCallback(() => {
        setPendingAudio(null);
    }, []);

    // Broadcast typing status
    const broadcastTyping = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingBroadcast.current < 2000) return;
        lastTypingBroadcast.current = now;

        supabase.channel(`typing:${conversationId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId, isTyping: true }
        });
    }, [conversationId, currentUserId, supabase]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (e.target.value.trim()) {
            broadcastTyping();

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                supabase.channel(`typing:${conversationId}`).send({
                    type: 'broadcast',
                    event: 'typing',
                    payload: { userId: currentUserId, isTyping: false }
                });
            }, 3000);
        }
    };

    useEffect(() => {
        // Subscribe to messages
        const messagesChannel = supabase
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
                    const newMsg = payload.new as Message;
                    // Initialize reactions array for new messages
                    newMsg.reactions = newMsg.reactions || [];

                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMsg.id)) {
                            return prev;
                        }

                        // If message has reply_to_id, find the replied message
                        if (newMsg.reply_to_id) {
                            const repliedMessage = prev.find(m => m.id === newMsg.reply_to_id);
                            if (repliedMessage) {
                                newMsg.reply_to = {
                                    id: repliedMessage.id,
                                    content: repliedMessage.content,
                                    sender_id: repliedMessage.sender_id,
                                };
                            }
                        }

                        return [...prev, newMsg];
                    });

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

        // Subscribe to typing indicator
        const typingChannel = supabase
            .channel(`typing:${conversationId}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { userId, isTyping } = payload.payload;
                if (userId !== currentUserId) {
                    setIsOtherUserTyping(isTyping);

                    if (isTyping) {
                        setTimeout(() => setIsOtherUserTyping(false), 5000);
                    }
                }
            })
            .subscribe();

        // Subscribe to reactions - refetch messages when reactions change
        const reactionsChannel = supabase
            .channel(`reactions:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions',
                },
                async (payload) => {
                    // Get the message_id from the reaction
                    const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
                    if (!messageId) return;

                    // Refetch all messages to get updated reactions
                    const result = await getMessages(conversationId);
                    if (result.success && result.data) {
                        setMessages(result.data);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(typingChannel);
            supabase.removeChannel(reactionsChannel);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [conversationId, supabase, currentUserId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        // Allow sending if there's either text, image, or audio
        if ((!newMessage.trim() && !selectedImage && !pendingAudio) || isSending) return;

        // Stop typing indicator when message is sent
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        supabase.channel(`typing:${conversationId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentUserId, isTyping: false }
        });

        setIsSending(true);
        const tempId = Date.now().toString();
        const tempMessage: Message = {
            id: tempId,
            content: newMessage,
            sender_id: currentUserId,
            created_at: new Date().toISOString(),
            image_url: imagePreview || undefined,
            audio_url: pendingAudio ? URL.createObjectURL(pendingAudio.blob) : undefined,
            audio_duration: pendingAudio?.duration,
            reply_to_id: replyingTo?.id,
            reply_to: replyingTo ? {
                id: replyingTo.id,
                content: replyingTo.content,
                sender_id: replyingTo.sender_id,
            } : undefined,
        };

        setMessages((prev) => [...prev, tempMessage]);
        const messageContent = newMessage;
        const imageToSend = selectedImage;
        const audioToSend = pendingAudio ? new File([pendingAudio.blob], 'audio.webm', { type: 'audio/webm' }) : undefined;
        const audioDuration = pendingAudio?.duration;
        const replyToId = replyingTo?.id;

        // Clear inputs after sending
        setNewMessage('');
        setReplyingTo(null);
        clearImage();
        clearAudio();

        const result = await sendMessage(conversationId, messageContent, replyToId, imageToSend || undefined, audioToSend, audioDuration);

        if (!result.success) {
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            setImageError(result.error || 'Failed to send message');
            console.error('Failed to send message');
        } else {
            setMessages((prev) => {
                const realMsg = result.data;
                if (prev.some(m => m.id === realMsg.id)) {
                    return prev.filter(m => m.id !== tempId);
                }
                return prev.map(m => m.id === tempId ? { ...m, ...realMsg } : m);
            });
        }

        setIsSending(false);
    };

    // Map messages to include reply_to data from the messages array
    const messagesWithReplies = messages.map(msg => {
        if (msg.reply_to_id && !msg.reply_to) {
            const repliedMessage = messages.find(m => m.id === msg.reply_to_id);
            if (repliedMessage) {
                return {
                    ...msg,
                    reply_to: {
                        id: repliedMessage.id,
                        content: repliedMessage.content,
                        sender_id: repliedMessage.sender_id,
                    }
                };
            }
        }
        return msg;
    });

    return (
        <div className="flex flex-col h-[100dvh] md:h-full bg-gray-50 dark:bg-gray-900">
            {/* Header - fixed at top */}
            <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 shadow-sm">
                <Link
                    href="/messages"
                    className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {isOtherUserTyping ? (
                                <span className="text-primary-500 font-medium">typing...</span>
                            ) : (
                                `@${otherUser.username}`
                            )}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Messages - scrollable area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
                {messagesWithReplies.map((msg, index) => {
                    const isOwn = msg.sender_id === currentUserId;
                    const isLastOwnMessage = isOwn && !messages.slice(index + 1).some(m => m.sender_id === currentUserId);
                    const showSeen = isLastOwnMessage && (msg as any).is_read;

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={isOwn}
                            showSeen={showSeen}
                            readAt={(msg as any).read_at}
                            onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                            onReply={handleReply}
                            otherUsername={otherUser.username}
                            currentUserId={currentUserId}
                            onReactionUpdate={handleReactionUpdate}
                        />
                    );
                })}

                {/* Typing Indicator */}
                <TypingStatus
                    isTyping={isOtherUserTyping}
                    username={otherUser.username}
                    avatarUrl={otherUser.avatar_url}
                />

                <div ref={messagesEndRef} />
            </div>

            {/* Bottom area - Reply Preview & Input Form */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800">
                {/* Reply Preview - strictly single line, max 50 chars */}
                {replyingTo && (
                    <div className="bg-primary-50/50 dark:bg-gray-800/50 border-t border-primary-100 dark:border-primary-900/50 flex-shrink-0 h-10 flex items-center px-3 gap-2 overflow-hidden">
                        <div className="w-0.5 h-5 rounded-full bg-primary-500 flex-shrink-0" />
                        <Reply className="h-3 w-3 text-primary-500 flex-shrink-0" />
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium flex-shrink-0 whitespace-nowrap">
                            {replyingTo.sender_id === currentUserId ? 'You' : otherUser.username}:
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
                            {replyingTo.content.length > 40 ? replyingTo.content.slice(0, 40) + '...' : replyingTo.content}
                        </span>
                        <button
                            onClick={cancelReply}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
                        >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                    </div>
                )}
                {/* Image Preview */}
                {imagePreview && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="relative inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-20 w-auto rounded-lg object-cover shadow-md"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-gray-800 dark:bg-gray-600 text-white hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors shadow-lg"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Image Error */}
                {imageError && (
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-600 dark:text-red-400">{imageError}</p>
                    </div>
                )}

                {/* Modern Premium Input */}
                <div className="p-3 bg-gradient-to-t from-white via-white to-gray-50/80 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/80 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
                    {/* Hidden file input */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                    />

                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        {/* Image Picker Button */}
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            disabled={isSending || isRecording}
                            className={cn(
                                "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                                "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
                                "hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-primary-500",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            <ImagePlus className="h-5 w-5" />
                        </button>

                        {/* Input or Recording UI */}
                        {isRecording ? (
                            <div className="flex-1 min-w-0">
                                <VoiceRecorder
                                    onRecordingComplete={handleRecordingComplete}
                                    onRecordingStart={() => setIsRecording(true)}
                                    onRecordingCancel={() => setIsRecording(false)}
                                    disabled={isSending}
                                />
                            </div>
                        ) : pendingAudio ? (
                            // Audio preview
                            <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl px-3 py-2 border border-purple-300 dark:border-purple-500/50">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                    <Mic className="h-4 w-4" />
                                    <span className="text-sm font-medium">Voice message</span>
                                    <span className="text-xs text-gray-500">({pendingAudio.duration}s)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearAudio}
                                    className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        ) : (
                            // Normal text input
                            <div className="flex-1 min-w-0 relative group">
                                {/* Gradient border glow on focus */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />

                                {/* Input container */}
                                <div className="relative flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 group-focus-within:border-transparent transition-colors">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        placeholder={imagePreview ? "Add a caption..." : replyingTo ? "Type your reply..." : "Type a message..."}
                                        className="flex-1 min-w-0 h-10 px-4 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
                                        disabled={isSending}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Smart Send/Mic Button */}
                        {(newMessage.trim() || selectedImage || pendingAudio) ? (
                            // Send button when there's content
                            <button
                                type="submit"
                                disabled={isSending}
                                className={cn(
                                    "relative flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                    "bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600",
                                    "hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105",
                                    "active:scale-95",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                                )}
                            >
                                {/* Button shine effect */}
                                <div className="absolute inset-0 rounded-xl overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                                </div>

                                {/* Icon */}
                                <Send className="h-5 w-5 text-white relative translate-x-0.5 -translate-y-0.5" />
                            </button>
                        ) : (
                            // Mic button when input is empty
                            <VoiceRecorder
                                onRecordingComplete={handleRecordingComplete}
                                onRecordingStart={() => setIsRecording(true)}
                                onRecordingCancel={() => setIsRecording(false)}
                                disabled={isSending}
                            />
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
