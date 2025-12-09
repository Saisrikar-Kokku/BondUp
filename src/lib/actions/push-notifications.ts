'use server';

import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Initialize web-push
let isWebPushConfigured = false;
try {
    if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(
            'mailto:support@bondup.app',
            vapidPublicKey,
            vapidPrivateKey
        );
        isWebPushConfigured = true;
    }
} catch (error) {
    console.error('[Push] Failed to configure:', error);
}

interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function saveSubscription(subscription: PushSubscription) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,endpoint'
            });

        if (error) {
            console.error('[Push] Save error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('[Push] Save exception:', error);
        return { success: false, error: 'Failed to save subscription' };
    }
}

export async function deleteSubscription(endpoint: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', endpoint);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (error) {
        console.error('[Push] Delete exception:', error);
        return { success: false, error: 'Failed to delete subscription' };
    }
}

export async function getVapidPublicKey() {
    return vapidPublicKey || null;
}

interface NotificationPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
}

export async function sendPushNotification(userId: string, payload: NotificationPayload) {
    try {
        if (!isWebPushConfigured) {
            return { success: false, error: 'VAPID not configured', skipped: true };
        }

        const supabase = await createClient();

        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId);

        if (error) return { success: false, error: error.message };
        if (!subscriptions || subscriptions.length === 0) {
            return { success: true, sent: 0, message: 'No subscriptions' };
        }

        const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/',
            tag: payload.tag || 'notification',
            requireInteraction: payload.requireInteraction || false
        });

        let successCount = 0;
        const failedEndpoints: string[] = [];

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    },
                    notificationPayload
                );
                successCount++;
            } catch (err: any) {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    failedEndpoints.push(sub.endpoint);
                }
            }
        }

        // Clean up expired subscriptions
        if (failedEndpoints.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId)
                .in('endpoint', failedEndpoints);
        }

        return { success: true, sent: successCount, total: subscriptions.length };
    } catch (error) {
        console.error('[Push] Send exception:', error);
        return { success: false, error: 'Failed to send notification' };
    }
}

// Debug functions for /push-debug page
export async function getSubscriptionStatus() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, updated_at')
            .eq('user_id', user.id);

        if (error) return { success: false, error: error.message };

        return {
            success: true,
            isVapidConfigured: isWebPushConfigured,
            subscriptionCount: subscriptions?.length || 0,
            endpoints: subscriptions?.map(s => s.endpoint.substring(0, 50) + '...') || []
        };
    } catch (error) {
        return { success: false, error: 'Failed to get status' };
    }
}

export async function sendTestNotification() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        return await sendPushNotification(user.id, {
            title: 'Test Notification 🔔',
            body: 'Push notifications are working!',
            url: '/messages',
            tag: 'test'
        });
    } catch (error) {
        return { success: false, error: 'Failed to send test' };
    }
}
