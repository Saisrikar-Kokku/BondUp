import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSubscriptionStatus, sendTestNotification } from '@/lib/actions/push-notifications';
import { Navbar } from '@/components/layout/Navbar';
import { PushDebugPanel } from './debug-panel';

export default async function PushDebugPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Get initial status
    const status = await getSubscriptionStatus();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            <main className="mx-auto max-w-2xl px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Push Notification Debug
                </h1>

                <PushDebugPanel initialStatus={status} />
            </main>
        </div>
    );
}
