'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Valid emoji reactions
const VALID_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥'] as const;
type EmojiType = typeof VALID_EMOJIS[number];

export async function addReaction(messageId: string, emoji: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        // Validate emoji
        if (!VALID_EMOJIS.includes(emoji as EmojiType)) {
            return { success: false, error: 'Invalid emoji' };
        }

        // Get the conversation ID for revalidation
        const { data: message } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('id', messageId)
            .single();

        if (!message) {
            return { success: false, error: 'Message not found' };
        }

        // Upsert reaction (update if exists, insert if not)
        const { error } = await supabase
            .from('message_reactions')
            .upsert({
                message_id: messageId,
                user_id: user.id,
                emoji: emoji
            }, {
                onConflict: 'message_id,user_id'
            });

        if (error) {
            console.error('[Reactions] Add error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/messages/${message.conversation_id}`);
        return { success: true };
    } catch (error) {
        console.error('[Reactions] Exception:', error);
        return { success: false, error: 'Failed to add reaction' };
    }
}

export async function removeReaction(messageId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        // Get the conversation ID for revalidation
        const { data: message } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('id', messageId)
            .single();

        const { error } = await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', user.id);

        if (error) {
            console.error('[Reactions] Remove error:', error);
            return { success: false, error: error.message };
        }

        if (message) {
            revalidatePath(`/messages/${message.conversation_id}`);
        }
        return { success: true };
    } catch (error) {
        console.error('[Reactions] Exception:', error);
        return { success: false, error: 'Failed to remove reaction' };
    }
}

export async function getReactionsForMessage(messageId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated', reactions: [] };

        const { data: reactions, error } = await supabase
            .from('message_reactions')
            .select(`
                id,
                emoji,
                user_id,
                created_at,
                profiles:user_id (username)
            `)
            .eq('message_id', messageId);

        if (error) {
            return { success: false, error: error.message, reactions: [] };
        }

        return {
            success: true,
            reactions: reactions || [],
            currentUserId: user.id
        };
    } catch (error) {
        return { success: false, error: 'Failed to get reactions', reactions: [] };
    }
}
