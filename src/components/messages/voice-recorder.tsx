'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Mic, Square, X, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onRecordingStart?: () => void;
    onRecordingCancel?: () => void;
    disabled?: boolean;
}

export function VoiceRecorder({
    onRecordingComplete,
    onRecordingStart,
    onRecordingCancel,
    disabled = false
}: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
    const [showPermissionHint, setShowPermissionHint] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check permission status on mount
    useEffect(() => {
        const checkPermission = async () => {
            try {
                // Check if browser supports permissions API
                if (navigator.permissions && navigator.permissions.query) {
                    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    setPermissionState(result.state as 'prompt' | 'granted' | 'denied');

                    result.addEventListener('change', () => {
                        setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
                    });
                }
            } catch {
                // Permissions API not supported, will request on click
            }
        };

        checkPermission();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const requestPermissionAndRecord = useCallback(async () => {
        if (disabled || isRecording) return;

        // Show permission hint for mobile users
        setShowPermissionHint(true);

        try {
            // This will trigger the browser's permission prompt
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            setShowPermissionHint(false);
            setPermissionState('granted');
            streamRef.current = stream;

            // Determine best supported audio format
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                mimeType = 'audio/ogg';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());

                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    const recordingDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
                    if (recordingDuration > 0) {
                        onRecordingComplete(audioBlob, recordingDuration);
                    }
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms for better mobile support
            setIsRecording(true);
            startTimeRef.current = Date.now();
            onRecordingStart?.();

            // Update duration every second
            durationIntervalRef.current = setInterval(() => {
                setDuration(Math.round((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        } catch (error: any) {
            setShowPermissionHint(false);
            console.error('Failed to start recording:', error);

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setPermissionState('denied');
                alert('Microphone access was denied. Please enable microphone permission in your browser settings and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotSupportedError' || error.name === 'TypeError') {
                alert('Audio recording is not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.');
            } else {
                alert('Could not access microphone. Please check your browser settings.');
            }
        }
    }, [disabled, isRecording, onRecordingComplete, onRecordingStart]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        setIsRecording(false);
        setDuration(0);
    }, []);

    const cancelRecording = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
        }

        setIsRecording(false);
        setDuration(0);
        onRecordingCancel?.();
    }, [onRecordingCancel]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Recording UI
    if (isRecording) {
        return (
            <div className="flex items-center gap-2 flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 border border-red-200 dark:border-red-800">
                {/* Cancel button */}
                <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Cancel recording"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Recording indicator and duration */}
                <div className="flex items-center gap-2 flex-1">
                    {/* Pulsing red dot */}
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />

                    {/* Waveform bars */}
                    <div className="flex items-center gap-0.5">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-red-400 dark:bg-red-500 rounded-full animate-pulse"
                                style={{
                                    height: `${8 + Math.sin(i * 0.5) * 8}px`,
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Duration */}
                    <span className="text-sm font-medium text-red-600 dark:text-red-400 tabular-nums ml-2">
                        {formatDuration(duration)}
                    </span>

                    <span className="text-xs text-red-500 dark:text-red-400">
                        Recording...
                    </span>
                </div>

                {/* Stop/Send button */}
                <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
                    title="Stop and send"
                >
                    <Square className="h-4 w-4 fill-current" />
                </button>
            </div>
        );
    }

    // Permission denied state
    if (permissionState === 'denied') {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={requestPermissionAndRecord}
                className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    "bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400",
                    "hover:bg-red-200 dark:hover:bg-red-900/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Microphone access denied - click to try again"
            >
                <AlertCircle className="h-5 w-5" />
            </button>
        );
    }

    // Idle state - mic button with permission hint
    return (
        <div className="relative">
            {showPermissionHint && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Allow microphone access...
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
            <button
                type="button"
                disabled={disabled}
                onClick={requestPermissionAndRecord}
                className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
                    "hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-400",
                    "active:scale-95",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Record voice message"
            >
                <Mic className="h-5 w-5" />
            </button>
        </div>
    );
}
