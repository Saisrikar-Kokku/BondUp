'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveSubscription, deleteSubscription, getVapidPublicKey } from '@/lib/actions/push-notifications';

export function PushNotificationPrompt() {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [vapidKey, setVapidKey] = useState<string | null>(null);

    useEffect(() => {
        // Check if push notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPermission('unsupported');
            return;
        }

        setPermission(Notification.permission);

        // Get VAPID key
        getVapidPublicKey().then(key => setVapidKey(key));

        // Check if already subscribed
        checkSubscription();

        // Show prompt after a delay if not subscribed and permission not denied
        const timer = setTimeout(() => {
            if (Notification.permission === 'default') {
                setShowPrompt(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribe = async () => {
        if (!vapidKey) {
            console.error('VAPID key not available');
            alert('Push notification configuration is missing. Please contact support.');
            return;
        }

        setLoading(true);
        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Request permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                setShowPrompt(false);
                setLoading(false);
                return;
            }

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            // Save to database
            const result = await saveSubscription({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                    auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
                }
            });

            if (result.success) {
                setIsSubscribed(true);
                setShowPrompt(false);
            } else {
                console.error('Failed to save subscription:', result.error);
                // Optional: Show error to user
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to enable notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                await deleteSubscription(subscription.endpoint);
            }

            setIsSubscribed(false);
        } catch (error) {
            console.error('Unsubscribe error:', error);
        }
        setLoading(false);
    };

    // Don't show if unsupported or already subscribed
    if (permission === 'unsupported' || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Enable Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Get notified when someone messages you or interacts with your posts.
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={subscribe}
                                disabled={loading}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                                    "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
                                    "hover:from-violet-600 hover:to-purple-700",
                                    "disabled:opacity-50"
                                )}
                            >
                                {loading ? 'Enabling...' : 'Enable'}
                            </button>
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Settings toggle for notifications
export function NotificationToggle() {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vapidKey, setVapidKey] = useState<string | null>(null);

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission);
        getVapidPublicKey().then(key => setVapidKey(key));
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            setIsSubscribed(false);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const toggle = async () => {
        if (!vapidKey) {
            console.error('VAPID key missing');
            alert('Push notification configuration is missing');
            return;
        }
        setLoading(true);

        try {
            if (isSubscribed) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    await deleteSubscription(subscription.endpoint);
                }
                setIsSubscribed(false);
            } else {
                const registration = await navigator.serviceWorker.register('/sw.js');
                await navigator.serviceWorker.ready;
                const permissionResult = await Notification.requestPermission();
                setPermission(permissionResult);

                if (permissionResult === 'granted') {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidKey)
                    });

                    await saveSubscription({
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
                            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
                        }
                    });
                    setIsSubscribed(true);
                }
            }
        } catch (error) {
            console.error('Toggle error:', error);
            alert('Failed to update notification settings');
        } finally {
            setLoading(false);
        }
    };

    if (permission === 'unsupported') {
        return (
            <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                    <BellOff className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-500">Push notifications not supported</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive alerts for messages & activity</p>
                </div>
            </div>
            <button
                onClick={toggle}
                disabled={loading}
                className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    isSubscribed ? "bg-violet-500" : "bg-gray-300 dark:bg-gray-600",
                    loading && "opacity-50"
                )}
            >
                <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    isSubscribed ? "translate-x-7" : "translate-x-1"
                )} />
            </button>
        </div>
    );
}
