'use server';

import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Initialize web-push with error handling
let isWebPushConfigured = false;
try {
    if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(
            'mailto:support@bondup.app',
            vapidPublicKey,
            vapidPrivateKey
        );
        isWebPushConfigured = true;
        console.log('[Push] Web-push configured successfully');
    } else {
        console.warn('[Push] VAPID keys missing - Public:', !!vapidPublicKey, 'Private:', !!vapidPrivateKey);
    }
} catch (error) {
    console.error('[Push] Failed to configure web-push:', error);
}

interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function saveSubscription(subscription: PushSubscription) {
    console.log('[Push] Saving subscription for endpoint:', subscription.endpoint.substring(0, 50) + '...');

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log('[Push] No authenticated user');
            return { success: false, error: 'Not authenticated' };
        }

        console.log('[Push] Saving for user:', user.id);

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
            console.error('[Push] Database error saving subscription:', error);
            return { success: false, error: error.message };
        }

        console.log('[Push] Subscription saved successfully');
        return { success: true };
    } catch (error) {
        console.error('[Push] Exception saving subscription:', error);
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
    console.log('[Push] Attempting to send notification to user:', userId);
    console.log('[Push] Payload:', JSON.stringify(payload));

    try {
        if (!isWebPushConfigured) {
            console.warn('[Push] Web-push not configured, skipping notification');
            return { success: false, error: 'VAPID keys not configured', skipped: true };
        }

        const supabase = await createClient();

        // Get all subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth')
            .eq('user_id', userId);

        console.log('[Push] Found subscriptions:', subscriptions?.length || 0);

        if (error) {
            console.error('[Push] Database error fetching subscriptions:', error);
            return { success: false, error: error.message };
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('[Push] No subscriptions found for user');
            return { success: true, sent: 0, message: 'No subscriptions found' };
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
        const errors: string[] = [];

        // Send to all subscriptions
        for (const sub of subscriptions) {
            console.log('[Push] Sending to endpoint:', sub.endpoint.substring(0, 50) + '...');

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
                console.log('[Push] Successfully sent to endpoint');
            } catch (err: any) {
                console.error('[Push] Error sending notification:', err.message);
                console.error('[Push] Status code:', err.statusCode);
                console.error('[Push] Body:', err.body);

                errors.push(`${err.statusCode}: ${err.message}`);

                // If subscription is invalid, mark for removal
                if (err.statusCode === 404 || err.statusCode === 410) {
                    failedEndpoints.push(sub.endpoint);
                    console.log('[Push] Marking endpoint for removal (expired)');
                }
            }
        }

        // Clean up invalid subscriptions
        if (failedEndpoints.length > 0) {
            console.log('[Push] Removing', failedEndpoints.length, 'expired subscriptions');
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId)
                .in('endpoint', failedEndpoints);
        }

        console.log('[Push] Result: sent', successCount, 'of', subscriptions.length);

        return {
            success: true,
            sent: successCount,
            total: subscriptions.length,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (error: any) {
        console.error('[Push] Exception in sendPushNotification:', error);
        return { success: false, error: error.message || 'Failed to send notification' };
    }
}

export async function getVapidPublicKey() {
    return vapidPublicKey || null;
}

// Debug function to check subscription status
export async function getSubscriptionStatus() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, created_at')
            .eq('user_id', user.id);

        return {
            success: true,
            userId: user.id,
            subscriptionCount: subscriptions?.length || 0,
            vapidConfigured: isWebPushConfigured,
            subscriptions: subscriptions?.map(s => ({
                id: s.id,
                endpoint: s.endpoint.substring(0, 60) + '...',
                created_at: s.created_at
            }))
        };
    } catch (error) {
        return { success: false, error: 'Failed to get status' };
    }
}

// Test function to send a test notification to current user
export async function sendTestNotification() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        console.log('[Push] Sending test notification to user:', user.id);

        const result = await sendPushNotification(user.id, {
            title: 'Test Notification',
            body: 'This is a test notification from BondUp!',
            url: '/feed',
            tag: 'test'
        });

        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
