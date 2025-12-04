import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { ConversationList } from '@/components/messages/conversation-list';
import { getConversations } from '@/lib/actions/messages';
import { MessagesLayoutContent } from '@/components/messages/layout-content';

export default async function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile for Navbar
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const { data: conversations } = await getConversations();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Navbar user={profile || { id: user.id, username: 'user' }} />

            <MessagesLayoutContent
                conversations={conversations || []}
                currentUserId={user.id}
            >
                {children}
            </MessagesLayoutContent>
        </div>
    );
}
