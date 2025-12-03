'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getConversations() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        // Get conversations where current user is a participant
        const { data: conversations, error } = await supabase
            .from('conversation_participants')
            .select(`
        conversation_id,
        conversations (
          updated_at,
          last_message: messages (
            content,
            created_at,
            is_read,
            sender_id
          )
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { foreignTable: 'conversations', ascending: false });

        if (error) return { success: false, error: error.message };

        // For each conversation, get the OTHER participant
        const conversationsWithDetails = await Promise.all(
            conversations.map(async (c: any) => {
                const { data: participants } = await supabase
                    .from('conversation_participants')
                    .select('profiles(*)')
                    .eq('conversation_id', c.conversation_id)
                    .neq('user_id', user.id)
                    .single();

                // Get the actual last message (since the join above returns all messages, we need to limit or sort)
                // Actually, the join above might return array of messages. Let's optimize.
                // Better approach: fetch conversations, then fetch details.

                // Let's refetch last message properly
                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', c.conversation_id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return {
                    id: c.conversation_id,
                    other_user: participants?.profiles,
                    last_message: lastMsg,
                    updated_at: c.conversations.updated_at
                };
            })
        );

        // Sort by updated_at desc
        conversationsWithDetails.sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        return { success: true, data: conversationsWithDetails };
    } catch (error) {
        return { success: false, error: 'Failed to fetch conversations' };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) return { success: false, error: error.message };

        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'Failed to fetch messages' };
    }
}

export async function sendMessage(conversationId: string, content: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content
            })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        revalidatePath(`/messages/${conversationId}`);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'Failed to send message' };
    }
}

export async function startConversation(targetUserId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        // Check if conversation already exists
        // This is tricky with RLS and many-to-many. 
        // We need to find a conversation where BOTH users are participants.

        // 1. Get my conversations
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        const myConvoIds = myConvos?.map(c => c.conversation_id) || [];

        if (myConvoIds.length > 0) {
            // 2. Check if target user is in any of these
            const { data: existing } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', targetUserId)
                .in('conversation_id', myConvoIds)
                .single();

            if (existing) {
                return { success: true, data: { id: existing.conversation_id } };
            }
        }

        // Create new conversation using RPC to avoid RLS issues
        const { data: newConvo, error: createError } = await supabase
            .rpc('create_new_conversation', { other_user_id: targetUserId });

        if (createError) {
            console.error('Error creating conversation:', createError);
            return { success: false, error: createError.message };
        }

        revalidatePath('/messages');
        return { success: true, data: newConvo };
    } catch (error) {
        console.error('Exception in startConversation:', error);
        return { success: false, error: 'Failed to start conversation' };
    }
}

export async function getUnreadMessageCount() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        // We need to count messages where:
        // 1. User is a participant in the conversation
        // 2. Sender is NOT the user
        // 3. is_read is false

        // First get user's conversations
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        const myConvoIds = myConvos?.map(c => c.conversation_id) || [];

        if (myConvoIds.length === 0) return { success: true, count: 0 };

        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', myConvoIds)
            .neq('sender_id', user.id)
            .eq('is_read', false);

        if (error) return { success: false, error: error.message };

        return { success: true, count: count || 0 };
    } catch (error) {
        return { success: false, error: 'Failed to get unread count' };
    }
}

export async function markConversationAsRead(conversationId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { error } = await supabase
            .from('messages')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('conversation_id', conversationId)
            .neq('sender_id', user.id)
            .eq('is_read', false);

        if (error) return { success: false, error: error.message };

        revalidatePath('/messages');
        revalidatePath(`/messages/${conversationId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to mark messages as read' };
    }
}

export async function deleteMessage(messageId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId)
            .eq('sender_id', user.id); // Ensure user owns the message

        if (error) return { success: false, error: error.message };

        revalidatePath('/messages');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete message' };
    }
}
