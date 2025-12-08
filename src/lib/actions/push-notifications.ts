'use server';

import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:support@bondup.app',
        vapidPublicKey,
        vapidPrivateKey
    );
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

        if (error) return { success: false, error: error.message };

        return { success: true };
    } catch (error) {
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
        return { success: false, error: 'Failed to delete subscription' };
    }
}

interface NotificationPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    requireInteraction?: boolean;
}

export async function sendPushNotification(
    userId: string,
    payload: NotificationPayload
) {
    try {
        if (!vapidPublicKey || !vapidPrivateKey) {
            console.log('VAPID keys not configured, skipping push notification');
            return { success: true, skipped: true };
        }

        const supabase = await createClient();

        // Get all subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId);

        if (error || !subscriptions?.length) {
            return { success: true, sent: 0 };
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

        // Send to all subscriptions
        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    },
                    notificationPayload
                );
                successCount++;
            } catch (err: any) {
                console.error('Push notification error:', err);
                // If subscription is invalid, mark for removal
                if (err.statusCode === 404 || err.statusCode === 410) {
                    failedEndpoints.push(sub.endpoint);
                }
            }
        }

        // Clean up invalid subscriptions
        if (failedEndpoints.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId)
                .in('endpoint', failedEndpoints);
        }

        return { success: true, sent: successCount };
    } catch (error) {
        console.error('Send push notification error:', error);
        return { success: false, error: 'Failed to send notification' };
    }
}

export async function getVapidPublicKey() {
    return vapidPublicKey || null;
}
