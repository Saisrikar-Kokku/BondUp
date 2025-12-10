'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Story {
    id: string;
    user_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    caption: string | null;
    created_at: string;
    expires_at: string;
    view_count: number;
    profiles: {
        id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    has_viewed?: boolean;
}

export interface UserWithStories {
    user: {
        id: string;
        username: string;
        full_name: string | null;
        avatar_url: string | null;
    };
    stories: Story[];
    has_unseen: boolean;
}

// Get all active stories from users the current user follows (and their own)
export async function getStoriesForFeed(): Promise<{ success: boolean; data?: UserWithStories[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get users the current user follows
        const { data: following } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', user.id);

        const followingIds = following?.map(f => f.following_id) || [];
        followingIds.push(user.id); // Include own stories

        // Get active stories from followed users
        const { data: stories, error } = await supabase
            .from('stories')
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .in('user_id', followingIds)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get viewed stories for current user
        const storyIds = stories?.map(s => s.id) || [];
        const { data: views } = await supabase
            .from('story_views')
            .select('story_id')
            .eq('viewer_id', user.id)
            .in('story_id', storyIds);

        const viewedIds = new Set(views?.map(v => v.story_id) || []);

        // Group stories by user
        const userStoriesMap = new Map<string, UserWithStories>();

        stories?.forEach(story => {
            const userId = story.user_id;
            const hasViewed = viewedIds.has(story.id);

            if (!userStoriesMap.has(userId)) {
                userStoriesMap.set(userId, {
                    user: story.profiles,
                    stories: [],
                    has_unseen: false
                });
            }

            const userStories = userStoriesMap.get(userId)!;
            userStories.stories.push({ ...story, has_viewed: hasViewed });

            if (!hasViewed) {
                userStories.has_unseen = true;
            }
        });

        // Sort: Current user first, then users with unseen stories, then others
        const result = Array.from(userStoriesMap.values()).sort((a, b) => {
            if (a.user.id === user.id) return -1;
            if (b.user.id === user.id) return 1;
            if (a.has_unseen && !b.has_unseen) return -1;
            if (!a.has_unseen && b.has_unseen) return 1;
            return 0;
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error fetching stories:', error);
        return { success: false, error: 'Failed to fetch stories' };
    }
}

// Create a new story
export async function createStory(
    mediaUrl: string,
    mediaType: 'image' | 'video',
    caption?: string
): Promise<{ success: boolean; data?: Story; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('stories')
            .insert({
                user_id: user.id,
                media_url: mediaUrl,
                media_type: mediaType,
                caption: caption || null
            })
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .single();

        if (error) throw error;

        revalidatePath('/feed');
        return { success: true, data };
    } catch (error) {
        console.error('Error creating story:', error);
        return { success: false, error: 'Failed to create story' };
    }
}

// Mark a story as viewed
export async function viewStory(storyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Insert view (ignore if already exists due to UNIQUE constraint)
        await supabase
            .from('story_views')
            .upsert({
                story_id: storyId,
                viewer_id: user.id
            }, { onConflict: 'story_id,viewer_id' });

        // Increment view count
        await supabase.rpc('increment_story_views', { story_id: storyId });

        return { success: true };
    } catch {
        // Silently fail for view tracking
        return { success: true };
    }
}

// Delete a story (also deletes media from storage)
export async function deleteStory(storyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // First, get the story to find the media URL
        const { data: story, error: fetchError } = await supabase
            .from('stories')
            .select('media_url')
            .eq('id', storyId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !story) {
            return { success: false, error: 'Story not found' };
        }

        // Extract file path from URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/stories/user_id/filename.ext
        const urlParts = story.media_url.split('/stories/');
        if (urlParts.length > 1) {
            const filePath = urlParts[1]; // e.g., "user_id/1234567890.jpg"

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('stories')
                .remove([filePath]);

            if (storageError) {
                console.error('Error deleting story media:', storageError);
                // Continue with database deletion even if storage fails
            }
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .eq('id', storyId)
            .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        revalidatePath('/feed');
        return { success: true };
    } catch (error) {
        console.error('Error deleting story:', error);
        return { success: false, error: 'Failed to delete story' };
    }
}

// Get story viewers
export async function getStoryViewers(storyId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
            .from('story_views')
            .select(`
                viewed_at,
                profiles:viewer_id (
                    id,
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq('story_id', storyId)
            .order('viewed_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error fetching story viewers:', error);
        return { success: false, error: 'Failed to fetch viewers' };
    }
}

// Upload story media
export async function uploadStoryMedia(formData: FormData): Promise<{ success: boolean; url?: string; type?: 'image' | 'video'; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            return { success: false, error: 'Invalid file type. Only images and videos are allowed.' };
        }

        // Limit file size (10MB for images, 50MB for videos)
        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return { success: false, error: `File too large. Max size: ${isImage ? '10MB' : '50MB'}` };
        }

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('stories')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('stories')
            .getPublicUrl(fileName);

        return {
            success: true,
            url: publicUrl,
            type: isImage ? 'image' : 'video'
        };
    } catch (error) {
        console.error('Error uploading story media:', error);
        return { success: false, error: 'Failed to upload media' };
    }
}
