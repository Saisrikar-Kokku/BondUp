'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Session manager component that handles "Keep me signed in" functionality
 * Uses a combination of localStorage and sessionStorage to track session preference
 */
export function SessionManager({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const hasChecked = useRef(false);

    useEffect(() => {
        // Only check once per page load
        if (hasChecked.current) return;
        hasChecked.current = true;

        const checkSession = async () => {
            try {
                const keepSignedIn = localStorage.getItem('bondup_keep_signed_in');
                const sessionActive = sessionStorage.getItem('bondup_session_active');

                // Skip check on public pages
                if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
                    return;
                }

                // If user chose NOT to keep signed in (keepSignedIn === 'false')
                // AND this is a new browser session (sessionActive is null - sessionStorage clears on browser close)
                // Then sign them out
                if (keepSignedIn === 'false' && !sessionActive) {
                    console.log('[SessionManager] Session expired - signing out');

                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        await supabase.auth.signOut();
                        localStorage.removeItem('bondup_keep_signed_in');
                        router.push('/login');
                        return;
                    }
                }

                // Mark this session as active
                if (keepSignedIn !== null) {
                    sessionStorage.setItem('bondup_session_active', 'true');
                }
            } catch (error) {
                console.error('[SessionManager] Error checking session:', error);
            }
        };

        checkSession();
    }, [pathname, router]);

    return <>{children}</>;
}

/**
 * Helper function to set session preference on login
 */
export function setSessionPreference(keepSignedIn: boolean) {
    if (typeof window === 'undefined') return;

    if (keepSignedIn) {
        localStorage.setItem('bondup_keep_signed_in', 'true');
    } else {
        localStorage.setItem('bondup_keep_signed_in', 'false');
    }
    // Always mark current session as active
    sessionStorage.setItem('bondup_session_active', 'true');
}

/**
 * Helper function to clear session preference on logout
 */
export function clearSessionPreference() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('bondup_keep_signed_in');
    sessionStorage.removeItem('bondup_session_active');
}
