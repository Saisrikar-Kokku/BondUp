'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Notification, NotificationWithActor } from '@/types/notifications';

export interface NotificationResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * Get user's notifications with pagination
 */
export async function getNotifications(
    limit: number = 20,
    offset: number = 0
): Promise<NotificationResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const { data, error } = await supabase
            .from('notifications')
            .select(
                `
        *,
        actor:actor_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        post:post_id (
          id,
          content
        )
      `
            )
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data: data as NotificationWithActor[],
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(): Promise<NotificationResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data: { count: count || 0 },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<NotificationResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/');

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<NotificationResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/');

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<NotificationResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/');

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
