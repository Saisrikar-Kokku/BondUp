'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Lightweight navigation progress indicator
 * Shows a simple loading bar at the top for faster perceived performance
 */
function NavigationProgressInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);

    const startLoading = useCallback(() => {
        setIsNavigating(true);
        setProgress(0);

        // Animate progress
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 15;
            if (currentProgress >= 90) {
                clearInterval(interval);
                currentProgress = 90;
            }
            setProgress(currentProgress);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const stopLoading = useCallback(() => {
        setProgress(100);
        setTimeout(() => {
            setIsNavigating(false);
            setProgress(0);
        }, 200);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href && link.href.startsWith(window.location.origin)) {
                const url = new URL(link.href);
                if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
                    startLoading();
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [startLoading]);

    useEffect(() => {
        stopLoading();
    }, [pathname, searchParams, stopLoading]);

    if (!isNavigating && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[200] h-1">
            <div
                className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 transition-all duration-200 ease-out"
                style={{
                    width: `${progress}%`,
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)'
                }}
            />
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export const NavigationProgress = memo(NavigationProgressInner);
