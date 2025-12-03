'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Configure NProgress
        NProgress.configure({
            showSpinner: false,
            trickleSpeed: 200,
            minimum: 0.08,
            easing: 'ease',
            speed: 500,
        });
    }, []);

    useEffect(() => {
        // Start progress on route change
        NProgress.start();

        // Complete progress after a short delay
        const timeout = setTimeout(() => {
            NProgress.done();
        }, 100);

        return () => {
            clearTimeout(timeout);
            NProgress.done();
        };
    }, [pathname, searchParams]);

    return null;
}
