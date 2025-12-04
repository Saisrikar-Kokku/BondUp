'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface UploadProgressProps {
    progress: number;
    isUploading: boolean;
    fileName?: string;
}

/**
 * Animated upload progress indicator inspired by 21st.dev
 */
export function UploadProgress({ progress, isUploading, fileName }: UploadProgressProps) {
    if (!isUploading) return null;

    return (
        <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    {/* Animated upload icon */}
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 p-0.5">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-gray-900">
                                <svg
                                    className="h-5 w-5 text-primary-600 animate-bounce"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                            </div>
                        </div>
                        {/* Spinning ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin" />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {progress < 100 ? 'Uploading your post...' : 'Processing...'}
                        </p>
                        {fileName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {fileName}
                            </p>
                        )}
                    </div>
                </div>

                {/* Percentage */}
                <div className="text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        {Math.round(progress)}%
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                {/* Animated shimmer overlay */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                    style={{ backgroundSize: '200% 100%' }}
                />
                {/* Progress fill */}
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 transition-all duration-300 ease-out"
                    style={{
                        width: `${progress}%`,
                        backgroundSize: '200% 100%',
                        animation: 'gradient-x 2s linear infinite',
                    }}
                />
            </div>

            {/* Steps indicator */}
            <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className={progress >= 0 ? 'text-primary-600 dark:text-primary-400 font-medium' : ''}>
                    Preparing
                </span>
                <span className={progress >= 40 ? 'text-primary-600 dark:text-primary-400 font-medium' : ''}>
                    Uploading
                </span>
                <span className={progress >= 80 ? 'text-primary-600 dark:text-primary-400 font-medium' : ''}>
                    Finalizing
                </span>
            </div>
        </div>
    );
}

interface SuccessToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

/**
 * Success toast notification that auto-dismisses
 */
export function SuccessToast({ message, isVisible, onClose, duration = 3000 }: SuccessToastProps) {
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsShowing(true);
            const timer = setTimeout(() => {
                setIsShowing(false);
                setTimeout(onClose, 300); // Wait for animation to complete
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible && !isShowing) return null;

    return (
        <div
            className={`fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 transform transition-all duration-300 ${isShowing ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
        >
            <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 text-white shadow-lg shadow-green-500/25">
                <div className="flex items-center justify-center rounded-full bg-white/20 p-1">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="font-medium">{message}</span>
                <button
                    onClick={() => {
                        setIsShowing(false);
                        setTimeout(onClose, 300);
                    }}
                    className="ml-2 rounded-full p-1 hover:bg-white/20 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
