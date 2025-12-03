'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getNotifications, getUnreadCount } from '@/lib/actions/notifications';
import type { NotificationWithActor } from '@/types/notifications';

interface NotificationContextType {
    notifications: NotificationWithActor[];
    unreadCount: number;
    loading: boolean;
    refreshNotifications: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const refreshNotifications = async () => {
        const result = await getNotifications(20, 0);
        if (result.success && result.data) {
            setNotifications(result.data);
        }
    };

    const refreshUnreadCount = async () => {
        const result = await getUnreadCount();
        if (result.success && result.data) {
            setUnreadCount(result.data.count);
        }
    };

    useEffect(() => {
        const supabase = createClient();

        // Get current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
                // Initial load
                refreshNotifications();
                refreshUnreadCount();
                setLoading(false);
            }
        });
    }, []);

    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    // Add new notification to the list
                    refreshNotifications();
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Refresh when notifications are marked as read
                    refreshNotifications();
                    refreshUnreadCount();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Refresh when notifications are deleted
                    refreshNotifications();
                    refreshUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                refreshNotifications,
                refreshUnreadCount,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
