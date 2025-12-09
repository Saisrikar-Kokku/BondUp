'use client';

import { useState } from 'react';
import { sendTestNotification, getSubscriptionStatus } from '@/lib/actions/push-notifications';

interface DebugStatus {
    success: boolean;
    userId?: string;
    subscriptionCount?: number;
    vapidConfigured?: boolean;
    subscriptions?: Array<{
        id: string;
        endpoint: string;
        created_at: string;
    }>;
    error?: string;
}

export function PushDebugPanel({ initialStatus }: { initialStatus: DebugStatus }) {
    const [status, setStatus] = useState<DebugStatus>(initialStatus);
    const [testResult, setTestResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const refreshStatus = async () => {
        setLoading(true);
        const result = await getSubscriptionStatus();
        setStatus(result);
        setLoading(false);
    };

    const sendTest = async () => {
        setLoading(true);
        setTestResult(null);
        const result = await sendTestNotification();
        setTestResult(result);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Subscription Status
                </h2>

                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">VAPID Configured:</span>
                        <span className={status.vapidConfigured ? 'text-green-500' : 'text-red-500'}>
                            {status.vapidConfigured ? '✓ Yes' : '✗ No'}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                        <span className="text-gray-900 dark:text-white font-mono text-sm">
                            {status.userId?.substring(0, 8)}...
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subscriptions:</span>
                        <span className={`font-semibold ${status.subscriptionCount && status.subscriptionCount > 0 ? 'text-green-500' : 'text-orange-500'}`}>
                            {status.subscriptionCount || 0}
                        </span>
                    </div>
                </div>

                {status.subscriptions && status.subscriptions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Active Subscriptions:
                        </h3>
                        {status.subscriptions.map((sub) => (
                            <div key={sub.id} className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                                <div className="truncate">{sub.endpoint}</div>
                                <div className="text-gray-500 mt-1">Created: {new Date(sub.created_at).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={refreshStatus}
                    disabled={loading}
                    className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Refresh Status'}
                </button>
            </div>

            {/* Test Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Send Test Notification
                </h2>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Click the button below to send a test notification to yourself.
                    Make sure you have enabled notifications first.
                </p>

                <button
                    onClick={sendTest}
                    disabled={loading || !status.vapidConfigured}
                    className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Sending...' : 'Send Test Notification'}
                </button>

                {testResult && (
                    <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <h3 className={`font-semibold ${testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {testResult.success ? 'Result: Success' : 'Result: Failed'}
                        </h3>
                        <pre className="mt-2 text-xs font-mono overflow-auto max-h-40">
                            {JSON.stringify(testResult, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
                    Troubleshooting
                </h2>
                <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-400 space-y-2">
                    <li>If VAPID is not configured, check your environment variables in Vercel</li>
                    <li>If subscriptions is 0, go back to the app and enable notifications</li>
                    <li>After enabling, refresh this page and try sending a test</li>
                    <li>Check the Vercel logs for detailed error messages</li>
                    <li>Make sure you allowed notifications in your browser</li>
                </ul>
            </div>
        </div>
    );
}
