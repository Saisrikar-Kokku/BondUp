'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        sender_id: string;
        created_at: string;
    };
    isOwn: boolean;
}

import { useState, useRef, useEffect } from 'react';
import { deleteMessage } from '@/lib/actions/messages';
import { Trash2, X } from 'lucide-react';

export function MessageBubble({ message, isOwn, showSeen, readAt, onDelete }: MessageBubbleProps & { showSeen?: boolean; readAt?: string; onDelete?: (id: string) => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handleLongPress = () => {
        if (isOwn) {
            setShowMenu(true);
            // Trigger haptic feedback if available
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    };

    const startPress = () => {
        longPressTimer.current = setTimeout(handleLongPress, 500);
    };

    const cancelPress = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);

        // Optimistic update
        if (onDelete) {
            onDelete(message.id);
        }

        const result = await deleteMessage(message.id);
        if (!result.success) {
            // Handle error (maybe revert? but for now just log)
            console.error('Failed to delete message:', result.error);
        }

        setShowMenu(false);
        setIsDeleting(false);
    };

    return (
        <>
            <div
                className={cn("flex flex-col w-full mb-4 select-none", isOwn ? "items-end" : "items-start")}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={startPress}
                onTouchEnd={cancelPress}
                onContextMenu={(e) => {
                    if (isOwn) {
                        e.preventDefault();
                        setShowMenu(true);
                    }
                }}
            >
                <div
                    className={cn(
                        "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm transition-transform active:scale-95",
                        isOwn
                            ? "bg-primary-600 text-white rounded-br-none"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700"
                    )}
                >
                    <p className="break-words break-all">{message.content}</p>
                    <p className={cn("text-[10px] mt-1 opacity-70", isOwn ? "text-primary-100" : "text-gray-500")}>
                        {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                </div>
                {showSeen && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 mr-1">
                        Seen {readAt ? formatDistanceToNow(new Date(readAt), { addSuffix: true }) : ''}
                    </span>
                )}
            </div>

            {/* Custom Action Sheet / Menu */}
            {showMenu && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="relative w-full max-w-sm p-4 m-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl animate-in slide-in-from-bottom-10 duration-200">
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center justify-center gap-2 w-full p-3 text-red-600 font-semibold bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                {isDeleting ? 'Unsending...' : 'Unsend Message'}
                            </button>
                            <button
                                onClick={() => setShowMenu(false)}
                                className="w-full p-3 text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
