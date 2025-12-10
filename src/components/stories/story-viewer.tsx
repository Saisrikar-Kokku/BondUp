'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserWithStories, Story } from '@/lib/actions/stories';
import { viewStory, deleteStory, getStoryViewers } from '@/lib/actions/stories';
import Image from 'next/image';

interface StoryViewerProps {
    usersWithStories: UserWithStories[];
    initialUserIndex: number;
    currentUserId: string;
    onClose: () => void;
    onStoryDeleted?: () => void;
}

interface Viewer {
    viewed_at: string;
    profiles: {
        id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export function StoryViewer({
    usersWithStories,
    initialUserIndex,
    currentUserId,
    onClose,
    onStoryDeleted
}: StoryViewerProps) {
    const [mounted, setMounted] = useState(false);
    const [userIndex, setUserIndex] = useState(initialUserIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showViewers, setShowViewers] = useState(false);
    const [viewers, setViewers] = useState<Viewer[]>([]);
    const [loadingViewers, setLoadingViewers] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentUser = usersWithStories[userIndex];
    const currentStory = currentUser?.stories[storyIndex];
    const isOwnStory = currentUser?.user.id === currentUserId;

    const STORY_DURATION = 5000;

    // Mount effect for portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    useEffect(() => {
        if (currentStory && !currentStory.has_viewed && !isOwnStory) {
            viewStory(currentStory.id);
        }
    }, [currentStory, isOwnStory]);

    // Load viewers for own stories
    useEffect(() => {
        if (isOwnStory && currentStory) {
            loadViewers();
        }
    }, [isOwnStory, currentStory?.id]);

    const loadViewers = async () => {
        if (!currentStory) return;
        setLoadingViewers(true);
        const result = await getStoryViewers(currentStory.id);
        if (result.success && result.data) {
            setViewers(result.data);
        }
        setLoadingViewers(false);
    };

    // Progress timer
    useEffect(() => {
        if (isPaused || showViewers) return;

        setProgress(0);
        const startTime = Date.now();

        progressInterval.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / STORY_DURATION) * 100;

            if (newProgress >= 100) {
                goToNext();
            } else {
                setProgress(newProgress);
            }
        }, 50);

        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [userIndex, storyIndex, isPaused, showViewers]);

    const goToNext = useCallback(() => {
        if (storyIndex < currentUser.stories.length - 1) {
            setStoryIndex(prev => prev + 1);
            setShowViewers(false);
        } else if (userIndex < usersWithStories.length - 1) {
            setUserIndex(prev => prev + 1);
            setStoryIndex(0);
            setShowViewers(false);
        } else {
            onClose();
        }
    }, [storyIndex, userIndex, currentUser, usersWithStories.length, onClose]);

    const goToPrev = useCallback(() => {
        if (storyIndex > 0) {
            setStoryIndex(prev => prev - 1);
            setShowViewers(false);
        } else if (userIndex > 0) {
            setUserIndex(prev => prev - 1);
            const prevUser = usersWithStories[userIndex - 1];
            setStoryIndex(prevUser.stories.length - 1);
            setShowViewers(false);
        }
    }, [storyIndex, userIndex, usersWithStories]);

    const handleDelete = async () => {
        if (!currentStory || !isOwnStory || isDeleting) return;

        const confirmed = confirm('Delete this story? It will be removed permanently.');
        if (!confirmed) return;

        setIsDeleting(true);
        const result = await deleteStory(currentStory.id);

        if (result.success) {
            onStoryDeleted?.();

            // Navigate to next story or close
            if (currentUser.stories.length === 1) {
                if (usersWithStories.length === 1) {
                    onClose();
                } else if (userIndex < usersWithStories.length - 1) {
                    setUserIndex(prev => prev + 1);
                    setStoryIndex(0);
                } else {
                    setUserIndex(prev => prev - 1);
                    setStoryIndex(0);
                }
            } else if (storyIndex < currentUser.stories.length - 1) {
                // Stay at same index, next story will shift down
            } else {
                setStoryIndex(prev => prev - 1);
            }
        }

        setIsDeleting(false);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') {
                e.preventDefault();
                setIsPaused(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToPrev, goToNext, onClose]);

    // Touch handling
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchStartX.current - touchEndX;
        const diffY = touchStartY.current - touchEndY;

        // Horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) goToNext();
            else goToPrev();
        }
        // Vertical swipe up - show viewers (for own stories)
        else if (diffY > 50 && isOwnStory) {
            setShowViewers(true);
            setIsPaused(true);
        }
        // Vertical swipe down - hide viewers
        else if (diffY < -50 && showViewers) {
            setShowViewers(false);
            setIsPaused(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (showViewers) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const third = rect.width / 3;

        if (x < third) goToPrev();
        else if (x > third * 2) goToNext();
        else setIsPaused(prev => !prev);
    };

    if (!currentUser || !currentStory) return null;
    if (!mounted) return null;

    const timeAgo = (date: string) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    const storyContent = (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden">
            {/* Main Story Container */}
            <div
                ref={containerRef}
                className="relative w-full h-[100dvh] max-w-lg mx-auto flex flex-col overflow-hidden"
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                    {currentUser.stories.map((_, idx) => (
                        <div key={idx} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-100"
                                style={{
                                    width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-10 left-4 right-4 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/50">
                            {currentUser.user.avatar_url ? (
                                <img src={currentUser.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {currentUser.user.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">{currentUser.user.username}</p>
                            <p className="text-white/60 text-xs">{timeAgo(currentStory.created_at)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {isOwnStory && (
                            <>
                                {/* Viewers button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20 gap-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowViewers(!showViewers);
                                        setIsPaused(!showViewers);
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span className="text-sm">{viewers.length || currentStory.view_count || 0}</span>
                                </Button>

                                {/* Delete button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-red-500/20 hover:text-red-400"
                                    disabled={isDeleting}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                {/* Audio Control */}
                {currentStory.media_type === 'video' && (
                    <div className="absolute top-24 right-4 z-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full w-8 h-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                        >
                            {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" x2="1" y1="9" y2="9" /><line x1="23" x2="1" y1="15" y2="15" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                            )}
                        </Button>
                    </div>
                )}

                {/* Story Content */}
                <div className={`relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${showViewers ? 'scale-90 opacity-80' : ''}`}>
                    {currentStory.media_type === 'image' ? (
                        <Image
                            src={currentStory.media_url}
                            alt="Story"
                            fill
                            className="object-contain"
                            priority
                            sizes="100vw"
                        />
                    ) : (
                        <video
                            src={currentStory.media_url}
                            autoPlay
                            muted={isMuted}
                            playsInline
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                            onEnded={goToNext}
                        />
                    )}
                </div>

                {/* Caption */}
                {currentStory.caption && !showViewers && (
                    <div className="absolute bottom-20 left-4 right-4 z-20">
                        <p className="text-white text-center text-sm bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2">
                            {currentStory.caption}
                        </p>
                    </div>
                )}

                {/* Viewers Panel - Unique Design */}
                {isOwnStory && (
                    <div className={`
                        absolute bottom-0 left-0 right-0 z-30
                        bg-gradient-to-t from-black via-black/95 to-transparent
                        rounded-t-3xl transition-all duration-500 ease-out
                        ${showViewers ? 'h-[60%]' : 'h-16'}
                    `}>
                        {/* Pull indicator */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowViewers(!showViewers);
                                setIsPaused(!showViewers);
                            }}
                            className="absolute top-0 left-0 right-0 h-16 flex flex-col items-center justify-center"
                        >
                            <div className="w-12 h-1 bg-white/30 rounded-full mb-2" />
                            <div className="flex items-center gap-2 text-white/80">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm font-medium">{viewers.length || currentStory.view_count || 0} views</span>
                                {showViewers ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </div>
                        </button>

                        {/* Viewers list */}
                        {showViewers && (
                            <div className="absolute top-16 left-0 right-0 bottom-0 overflow-y-auto px-4 pb-8">
                                {loadingViewers ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : viewers.length > 0 ? (
                                    <div className="space-y-3">
                                        {viewers.map((viewer, idx) => (
                                            <div
                                                key={viewer.profiles.id}
                                                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 backdrop-blur-sm animate-fadeIn"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20">
                                                    {viewer.profiles.avatar_url ? (
                                                        <img src={viewer.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                            {viewer.profiles.username.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold truncate">
                                                        {viewer.profiles.full_name || viewer.profiles.username}
                                                    </p>
                                                    <p className="text-white/50 text-sm">@{viewer.profiles.username}</p>
                                                </div>
                                                <p className="text-white/40 text-xs">{timeAgo(viewer.viewed_at)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                                            <Eye className="w-8 h-8 text-white/40" />
                                        </div>
                                        <p className="text-white/60 font-medium">No views yet</p>
                                        <p className="text-white/40 text-sm mt-1">Views will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Arrows (Desktop) */}
                <button
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                    onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                >
                    <ChevronRight className="w-6 h-6 text-white" />
                </button>

                {/* Pause indicator */}
                {isPaused && !showViewers && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-8 bg-white rounded-full" />
                                <div className="w-2 h-8 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(storyContent, document.body);
}
