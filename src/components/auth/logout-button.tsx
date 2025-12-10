'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { clearSessionPreference } from '@/components/auth/session-manager';

interface LogoutButtonProps {
    children: React.ReactNode;
    className?: string;
    onLogoutStart?: () => void;
}

/**
 * Client-side logout button that properly clears session preferences
 */
export function LogoutButton({ children, className, onLogoutStart }: LogoutButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        onLogoutStart?.();

        try {
            // Clear session preferences first
            clearSessionPreference();

            // Sign out from Supabase
            const supabase = createClient();
            await supabase.auth.signOut();

            // Force full page navigation to landing page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className={className}
        >
            {loading ? 'Signing out...' : children}
        </button>
    );
}
