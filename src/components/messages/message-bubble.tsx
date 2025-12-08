'use client';

import React, { useState, useRef, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { deleteMessage } from '@/lib/actions/messages';
import { Trash2, CornerDownRight, X, MessageCircle } from 'lucide-react';
import { AudioPlayer } from './audio-player';

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
}

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showSeen?: boolean;
    readAt?: string;
    onDelete?: (id: string) => void;
    onReply?: (message: Message) => void;
    otherUsername?: string;
}

const SWIPE_THRESHOLD = 60;

export function MessageBubble({
    message,
    isOwn,
    showSeen,
    readAt,
    onDelete,
    onReply,
    otherUsername = 'User'
}: MessageBubbleProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [showFullscreenImage, setShowFullscreenImage] = useState(false);

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startXRef = useRef(0);
    const isDraggingRef = useRef(false);
    const translateXRef = useRef(0);

    const handleLongPress = useCallback(() => {
        setShowMenu(true);
        if (navigator.vibrate) navigator.vibrate(50);
    }, []);

    const handleDownloadImage = useCallback(async () => {
        if (!message.image_url) return;
        try {
            const response = await fetch(message.image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-image-${message.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download image:', error);
        }
    }, [message.image_url, message.id]);

    const startPress = useCallback(() => {
        longPressTimer.current = setTimeout(handleLongPress, 500);
    }, [handleLongPress]);

    const cancelPress = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        if (onDelete) onDelete(message.id);
        await deleteMessage(message.id);
        setShowMenu(false);
        setIsDeleting(false);
    };

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
        isDraggingRef.current = true;
        setIsDragging(true);
        startPress();
    }, [startPress]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDraggingRef.current) return;
        cancelPress();
        const diff = e.touches[0].clientX - startXRef.current;
        if (diff > 0) {
            const dampedDiff = diff > 100 ? 100 + (diff - 100) * 0.1 : diff;
            translateXRef.current = dampedDiff;
            setTranslateX(dampedDiff);
        }
    }, [cancelPress]);

    const handleTouchEnd = useCallback(() => {
        cancelPress();
        isDraggingRef.current = false;
        setIsDragging(false);
        if (translateXRef.current >= SWIPE_THRESHOLD && onReply) {
            if (navigator.vibrate) navigator.vibrate(25);
            onReply(message);
        }
        translateXRef.current = 0;
        setTranslateX(0);
    }, [cancelPress, message, onReply]);

    // Mouse handlers  
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        startXRef.current = e.clientX;
        isDraggingRef.current = true;
        setIsDragging(true);
        startPress();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDraggingRef.current) return;
            cancelPress();
            const diff = moveEvent.clientX - startXRef.current;
            if (diff > 0) {
                const dampedDiff = diff > 100 ? 100 + (diff - 100) * 0.1 : diff;
                translateXRef.current = dampedDiff;
                setTranslateX(dampedDiff);
            }
        };

        const handleMouseUp = () => {
            cancelPress();
            isDraggingRef.current = false;
            setIsDragging(false);
            if (translateXRef.current >= SWIPE_THRESHOLD && onReply) {
                if (navigator.vibrate) navigator.vibrate(25);
                onReply(message);
            }
            translateXRef.current = 0;
            setTranslateX(0);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [cancelPress, message, onReply, startPress]);

    const swipeProgress = Math.min(translateX / SWIPE_THRESHOLD, 1);

    return (
        <React.Fragment>
            <div className={cn("flex w-full mb-2 relative", isOwn ? "justify-end" : "justify-start")}>

                {/* Swipe Reply Indicator - Unique pill design */}
                <div
                    className="absolute left-0 top-1/2 pointer-events-none flex items-center gap-2"
                    style={{
                        opacity: swipeProgress,
                        transform: `translateY(-50%) translateX(${Math.min(translateX * 0.3, 20)}px)`,
                        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        swipeProgress >= 1
                            ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    )}>
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Reply</span>
                    </div>
                </div>

                {/* Message Container */}
                <div
                    className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", isOwn ? "items-end" : "items-start")}
                    style={{
                        transform: `translateX(${translateX}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
                >
                    {/* UNIQUE REPLY QUOTE DESIGN - Glassmorphism card with connection line */}
                    {message.reply_to && (
                        <div className={cn("relative mb-2", isOwn ? "mr-3" : "ml-3")}>
                            {/* Connection line */}
                            <div className={cn(
                                "absolute top-full w-0.5 h-3",
                                isOwn ? "right-4 bg-gradient-to-b from-primary-400/50 to-transparent" : "left-4 bg-gradient-to-b from-gray-400/50 to-transparent"
                            )} />

                            {/* Quote card with glassmorphism */}
                            <div className={cn(
                                "relative overflow-hidden rounded-lg px-3 py-2",
                                "backdrop-blur-md border shadow-sm",
                                isOwn
                                    ? "bg-primary-500/10 border-primary-300/30 dark:border-primary-500/30"
                                    : "bg-gray-100/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-600/50"
                            )}>
                                {/* Subtle gradient overlay */}
                                <div className={cn(
                                    "absolute inset-0 opacity-30",
                                    isOwn
                                        ? "bg-gradient-to-br from-primary-400/20 via-transparent to-transparent"
                                        : "bg-gradient-to-br from-gray-400/10 via-transparent to-transparent"
                                )} />

                                {/* Quote content */}
                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageCircle className={cn(
                                            "w-3 h-3",
                                            isOwn ? "text-primary-500" : "text-gray-500 dark:text-gray-400"
                                        )} />
                                        <span className={cn(
                                            "text-[11px] font-semibold",
                                            isOwn ? "text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-gray-300"
                                        )}>
                                            {message.reply_to.sender_id === message.sender_id ? 'You' : otherUsername}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-xs leading-snug line-clamp-2",
                                        isOwn ? "text-gray-700 dark:text-gray-200" : "text-gray-600 dark:text-gray-300"
                                    )}>
                                        {message.reply_to.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Message Bubble - Modern with subtle glow */}
                    <div className={cn(
                        "relative rounded-2xl px-3 py-2 shadow-sm",
                        isOwn
                            ? "bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 text-white shadow-primary-500/20"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 shadow-gray-200/50 dark:shadow-gray-900/50",
                        isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                    )}>
                        {/* Subtle shine effect for own messages */}
                        {isOwn && (
                            <div className="absolute inset-0 rounded-2xl rounded-br-sm overflow-hidden pointer-events-none">
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
                            </div>
                        )}

                        {/* Image if present - clickable for fullscreen */}
                        {message.image_url && (
                            <div
                                className="mb-2 -mx-1 -mt-1 cursor-pointer"
                                onClick={() => setShowFullscreenImage(true)}
                            >
                                <img
                                    src={message.image_url}
                                    alt="Shared image"
                                    className="max-w-full max-h-64 rounded-xl object-cover shadow-sm hover:opacity-90 transition-opacity"
                                />
                            </div>
                        )}

                        {/* Audio player if present */}
                        {message.audio_url && (
                            <div className="-mx-1">
                                <AudioPlayer
                                    src={message.audio_url}
                                    duration={message.audio_duration}
                                    isOwn={isOwn}
                                />
                            </div>
                        )}

                        {/* Text content - only show if there's actual text */}
                        {message.content && (
                            <p className="relative text-[14px] leading-normal whitespace-pre-wrap break-words">
                                {message.content}
                            </p>
                        )}
                        {/* Timestamp and Status Indicator */}
                        <div className={cn(
                            "flex items-center justify-end gap-1.5 mt-1",
                            isOwn ? "text-white/60" : "text-gray-400"
                        )}>
                            <span className="text-[9px]">
                                {format(new Date(message.created_at), 'h:mm a')}
                            </span>

                            {/* Unique Message Status Indicators - Only for own messages */}
                            {isOwn && (
                                <div className="flex items-center ml-1">
                                    {showSeen ? (
                                        // SEEN: Animated concentric rings with gradient glow
                                        <div className="relative flex items-center justify-center w-4 h-4">
                                            {/* Outer ring - pulsing */}
                                            <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-80 animate-ping"
                                                style={{ animationDuration: '1.5s' }} />
                                            {/* Inner filled circle */}
                                            <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/60" />
                                        </div>
                                    ) : (
                                        // SENT: Simple hollow dot
                                        <div className="w-2 h-2 rounded-full border border-white/40" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seen timestamp - shown below for more context */}
                    {showSeen && isOwn && (
                        <span className="text-[10px] text-emerald-400 mt-0.5 px-1 font-medium tracking-wider uppercase">
                            seen {readAt ? formatDistanceToNow(new Date(readAt), { addSuffix: true }) : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Modern Glassmorphism Action Sheet */}
            {showMenu && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setShowMenu(false)}
                    />

                    <div className="relative w-full max-w-sm mx-4 mb-6 sm:mb-0">
                        {/* Glass card */}
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50">
                            {/* Message preview header */}
                            <div className="px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 italic">
                                    "{message.content}"
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="p-2">
                                <button
                                    onClick={() => { setShowMenu(false); if (onReply) onReply(message); }}
                                    className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                                        <CornerDownRight className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900 dark:text-white">Reply</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Swipe right or tap here</p>
                                    </div>
                                </button>

                                {isOwn && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:shadow-red-500/40 transition-shadow">
                                            <Trash2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-red-600 dark:text-red-400">
                                                {isDeleting ? 'Deleting...' : 'Unsend'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Remove for everyone</p>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Cancel */}
                            <div className="p-2 pt-0">
                                <button
                                    onClick={() => setShowMenu(false)}
                                    className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Image Modal */}
            {showFullscreenImage && message.image_url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowFullscreenImage(false)}
                >
                    {/* Top buttons container */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        {/* Download button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage();
                            }}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                            title="Download image"
                        >
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </button>
                        {/* Close button */}
                        <button
                            onClick={() => setShowFullscreenImage(false)}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Fullscreen Image */}
                    <img
                        src={message.image_url}
                        alt="Fullscreen view"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </React.Fragment>
    );
}
