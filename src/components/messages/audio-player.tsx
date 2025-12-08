'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
    src: string;
    duration?: number;
    isOwn?: boolean;
}

export function AudioPlayer({ src, duration: propDuration, isOwn = false }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(propDuration || 0);
    const [isLoading, setIsLoading] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
            // Only use audio.duration if it's a valid number
            if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            } else if (propDuration && propDuration > 0) {
                // Fallback to propDuration if audio.duration is invalid
                setDuration(propDuration);
            }
            setIsLoading(false);
        });

        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
        });

        audio.addEventListener('error', () => {
            setIsLoading(false);
        });

        // Also try to get duration after a short delay for some audio formats
        audio.addEventListener('canplaythrough', () => {
            if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        });

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [src, propDuration]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !progressRef.current || !duration || duration <= 0) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration]);

    const formatTime = (seconds: number) => {
        // Handle invalid values
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress safely
    const progress = duration > 0 && isFinite(duration) ? (currentTime / duration) * 100 : 0;

    return (
        <div className={cn(
            "flex items-center gap-3 py-2 px-1 min-w-[200px]",
        )}>
            {/* Play/Pause button */}
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                    isOwn
                        ? "bg-white/20 hover:bg-white/30 text-white"
                        : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-500",
                    isLoading && "opacity-50 cursor-not-allowed"
                )}
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21" />
                    </svg>
                )}
            </button>

            {/* Progress bar */}
            <div className="flex-1 flex flex-col gap-1">
                <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className={cn(
                        "h-1.5 rounded-full cursor-pointer relative overflow-hidden",
                        isOwn ? "bg-white/20" : "bg-zinc-300 dark:bg-zinc-600"
                    )}
                >
                    {/* Progress fill */}
                    <div
                        className={cn(
                            "absolute inset-y-0 left-0 rounded-full transition-all duration-100",
                            isOwn
                                ? "bg-white"
                                : "bg-gradient-to-r from-violet-500 to-pink-500"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                    {/* Scrubber */}
                    <div
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md transition-all",
                            isOwn ? "bg-white" : "bg-violet-500",
                            !isPlaying && "opacity-0"
                        )}
                        style={{ left: `calc(${progress}% - 6px)` }}
                    />
                </div>

                {/* Duration */}
                <div className={cn(
                    "text-[10px] tabular-nums",
                    isOwn ? "text-white/60" : "text-zinc-500"
                )}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
}
