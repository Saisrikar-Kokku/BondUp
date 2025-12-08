'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendPushNotification } from './push-notifications';

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

export async function sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string,
    imageFile?: File,
    audioFile?: File,
    audioDuration?: number
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'Not authenticated' };

        let imageUrl: string | undefined;
        let audioUrl: string | undefined;

        // Upload image if provided
        if (imageFile) {
            // Validate file size (6MB max)
            const maxSizeMB = 6;
            if (imageFile.size > maxSizeMB * 1024 * 1024) {
                return {
                    success: false,
                    error: `Image is too large. Maximum allowed is ${maxSizeMB}MB.`
                };
            }

            // Generate unique filename
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('message-images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Image upload error:', uploadError);
                return { success: false, error: 'Failed to upload image' };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('message-images')
                .getPublicUrl(uploadData.path);

            imageUrl = publicUrl;
        }

        // Upload audio if provided
        if (audioFile) {
            // Validate file size (10MB max for audio)
            const maxAudioSizeMB = 10;
            if (audioFile.size > maxAudioSizeMB * 1024 * 1024) {
                return {
                    success: false,
                    error: `Audio is too large. Maximum allowed is ${maxAudioSizeMB}MB.`
                };
            }

            // Generate unique filename
            const fileName = `${user.id}/${conversationId}/${Date.now()}.webm`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('message-audio')
                .upload(fileName, audioFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'audio/webm'
                });

            if (uploadError) {
                console.error('Audio upload error:', uploadError);
                return { success: false, error: 'Failed to upload audio' };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('message-audio')
                .getPublicUrl(uploadData.path);

            audioUrl = publicUrl;
        }

        const insertData: {
            conversation_id: string;
            sender_id: string;
            content: string;
            reply_to_id?: string;
            image_url?: string;
            audio_url?: string;
            audio_duration?: number;
        } = {
            conversation_id: conversationId,
            sender_id: user.id,
            content: content || '' // Allow empty content if image/audio is present
        };

        // Add reply_to_id if provided
        if (replyToId) {
            insertData.reply_to_id = replyToId;
        }

        // Add image_url if uploaded
        if (imageUrl) {
            insertData.image_url = imageUrl;
        }

        // Add audio_url if uploaded
        if (audioUrl) {
            insertData.audio_url = audioUrl;
            if (audioDuration) {
                insertData.audio_duration = audioDuration;
            }
        }

        const { data, error } = await supabase
            .from('messages')
            .insert(insertData)
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        // Get the recipient's user ID from conversation participants
        const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', user.id)
            .single();

        // Send push notification to the recipient
        if (participants?.user_id) {
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            const messagePreview = content.length > 50
                ? content.substring(0, 50) + '...'
                : content || (audioUrl ? '🎤 Voice message' : (imageUrl ? '📷 Photo' : 'New message'));

            // Send push notification (non-blocking)
            sendPushNotification(participants.user_id, {
                title: `Message from ${senderProfile?.username || 'Someone'}`,
                body: messagePreview,
                url: `/messages/${conversationId}`,
                tag: `message-${conversationId}`
            }).catch(console.error);
        }

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

        // First, get the message to check for attached files
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('image_url, audio_url, sender_id')
            .eq('id', messageId)
            .eq('sender_id', user.id) // Ensure user owns the message
            .single();

        if (fetchError || !message) {
            return { success: false, error: 'Message not found or not authorized' };
        }

        // Delete image from storage if present
        if (message.image_url) {
            try {
                // Extract file path from URL
                // URL format: https://xxx.supabase.co/storage/v1/object/public/message-images/userId/conversationId/filename
                const urlParts = message.image_url.split('/message-images/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    await supabase.storage.from('message-images').remove([filePath]);
                }
            } catch (storageError) {
                console.error('Error deleting image from storage:', storageError);
                // Continue with message deletion even if storage deletion fails
            }
        }

        // Delete audio from storage if present
        if (message.audio_url) {
            try {
                // Extract file path from URL
                // URL format: https://xxx.supabase.co/storage/v1/object/public/message-audio/userId/conversationId/filename
                const urlParts = message.audio_url.split('/message-audio/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    await supabase.storage.from('message-audio').remove([filePath]);
                }
            } catch (storageError) {
                console.error('Error deleting audio from storage:', storageError);
                // Continue with message deletion even if storage deletion fails
            }
        }

        // Delete the message from database
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId)
            .eq('sender_id', user.id);

        if (error) return { success: false, error: error.message };

        revalidatePath('/messages');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete message' };
    }
}
