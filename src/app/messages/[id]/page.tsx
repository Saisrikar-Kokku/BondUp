import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ChatWindow } from '@/components/messages/chat-window';
import { getMessages } from '@/lib/actions/messages';

interface ConversationPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const { id: conversationId } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify participation and get other user details
    const { data: participant, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

    if (error || !participant) {
        notFound();
    }

    // Get other participant details
    const { data: otherParticipant } = await supabase
        .from('conversation_participants')
        .select('profiles(*)')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .single();

    const otherUser = otherParticipant?.profiles;

    if (!otherUser) {
        notFound();
    }

    // Get initial messages
    const { data: messages } = await getMessages(conversationId);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <ChatWindow
                conversationId={conversationId}
                initialMessages={messages || []}
                currentUserId={user.id}
                otherUser={otherUser}
            />
        </div>
    );
}
