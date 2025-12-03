'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PostWithAll, PostWithInteractions, Post } from '@/types/database.types';
import { uploadFile } from '@/lib/utils/storage';

export interface PostResult<T = any> {
    success: boolean;
    error?: string;
    data?: T;
}

/**
 * Create a new post with optional images and privacy setting
 */
export async function createPost(
    content: string,
    imageFiles?: File[],
    isPublic: boolean = true
): Promise<PostResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Validate content
        if (!content.trim()) {
            return {
                success: false,
                error: 'Post content cannot be empty',
            };
        }

        if (content.length > 2000) {
            return {
                success: false,
                error: 'Post content must be 2000 characters or less',
            };
        }

        // Create post
        const { data: post, error: postError } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                content,
                is_public: isPublic,
            })
            .select()
            .single();

        if (postError || !post) {
            return {
                success: false,
                error: postError?.message || 'Failed to create post',
            };
        }

        // Upload images if provided
        if (imageFiles && imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(async (file, index) => {
                const filePath = `${user.id}/${post.id}/${index}-${Date.now()}.${file.name.split('.').pop()}`;
                const result = await uploadFile(file, 'post-images', filePath, supabase);

                if (result.url) {
                    return {
                        post_id: post.id,
                        file_url: result.url,
                        file_type: file.type,
                    };
                }
                if (result.error) {
                    console.error('Failed to upload image:', result.error);
                }
                return null;
            });

            const attachments = (await Promise.all(uploadPromises)).filter(Boolean);

            if (attachments.length > 0) {
                const { error: attachmentError } = await supabase.from('post_attachments').insert(attachments);

                if (attachmentError) {
                    console.error('Failed to save attachments:', attachmentError);
                }
            }
        }

        revalidatePath('/feed');
        revalidatePath('/profile/[username]', 'page');

        return {
            success: true,
            data: post,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Update a post
 */
export async function updatePost(postId: string, content: string): Promise<PostResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Validate content
        if (!content.trim()) {
            return {
                success: false,
                error: 'Post content cannot be empty',
            };
        }

        if (content.length > 2000) {
            return {
                success: false,
                error: 'Post content must be 2000 characters or less',
            };
        }

        const { data, error } = await supabase
            .from('posts')
            .update({ content })
            .eq('id', postId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/feed');
        revalidatePath('/profile/[username]', 'page');

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<PostResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // 1. Delete images from storage
        const folderPath = `${user.id}/${postId}`;
        const { data: files, error: listError } = await supabase.storage.from('post-images').list(folderPath);

        if (!listError && files && files.length > 0) {
            const filesToRemove = files.map((file) => `${folderPath}/${file.name}`);
            const { error: removeError } = await supabase.storage.from('post-images').remove(filesToRemove);

            if (removeError) {
                console.error('Failed to remove post images:', removeError);
                // Continue with post deletion even if image deletion fails, 
                // but log it. Ideally we might want to return early or warn.
            }
        }

        // 2. Delete post from database
        const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/feed');
        revalidatePath('/profile/[username]', 'page');

        return {
            success: true,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get posts from users you MUTUALLY follow (Instagram-like behavior)
 * Only shows posts when BOTH users follow each other
 */
export async function getFollowingPosts(limit: number = 10, offset: number = 0): Promise<PostResult<PostWithInteractions[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                error: 'Not authenticated',
            };
        }

        // Get list of user IDs that the current user is following
        const { data: following, error: followError } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', user.id);

        if (followError) {
            return {
                success: false,
                error: followError.message,
            };
        }

        const followingIds = following?.map((f) => f.following_id) || [];

        // If not following anyone, return empty array
        if (followingIds.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        // Get users who also follow the current user back (mutual follows)
        const { data: followers, error: followerError } = await supabase
            .from('followers')
            .select('follower_id')
            .eq('following_id', user.id)
            .in('follower_id', followingIds);

        if (followerError) {
            return {
                success: false,
                error: followerError.message,
            };
        }

        const mutualFollowIds = followers?.map((f) => f.follower_id) || [];

        // Get one-way follows (users you follow but don't follow you back)
        const oneWayFollowIds = followingIds.filter((id) => !mutualFollowIds.includes(id));

        // Build query conditions
        const conditions = [];
        if (mutualFollowIds.length > 0) {
            // All posts from mutual follows
            conditions.push(`user_id.in.(${mutualFollowIds.join(',')})`);
        }
        if (oneWayFollowIds.length > 0) {
            // Only public posts from one-way follows
            conditions.push(`and(user_id.in.(${oneWayFollowIds.join(',')}),is_public.eq.true)`);
        }

        // If no conditions, return empty
        if (conditions.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        // Get posts from mutual follows (all posts) AND public posts from one-way follows
        const { data, error } = await supabase
            .from('posts')
            .select(
                `
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        post_attachments (
          id,
          file_url,
          file_type
        )
      `
            )
            .or(conditions.join(','))
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        // Get interaction counts for each post
        const postsWithInteractions = await Promise.all(
            (data || []).map(async (post: any) => {
                // Get like count
                const { count: likeCount } = await supabase
                    .from('post_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Get comment count
                const { count: commentCount } = await supabase
                    .from('post_comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Check if user has liked this post
                const { data: userLike } = await supabase
                    .from('post_likes')
                    .select('id')
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)
                    .single();

                return {
                    ...post,
                    like_count: likeCount || 0,
                    comment_count: commentCount || 0,
                    user_has_liked: !!userLike,
                };
            })
        );

        return {
            success: true,
            data: postsWithInteractions,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get all public posts for Explore tab
 */
export async function getPublicPosts(limit: number = 10, offset: number = 0): Promise<PostResult<PostWithInteractions[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('posts')
            .select(
                `
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        post_attachments (
          id,
          file_url,
          file_type
        )
      `
            )
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        // Get interaction counts for each post
        const postsWithInteractions = await Promise.all(
            (data || []).map(async (post: any) => {
                // Get like count
                const { count: likeCount } = await supabase
                    .from('post_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Get comment count
                const { count: commentCount } = await supabase
                    .from('post_comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Check if user has liked this post
                const { data: userLike } = user
                    ? await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single()
                    : { data: null };

                return {
                    ...post,
                    like_count: likeCount || 0,
                    comment_count: commentCount || 0,
                    user_has_liked: !!userLike,
                };
            })
        );

        return {
            success: true,
            data: postsWithInteractions,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get user's posts with interaction counts
 */
export async function getUserPosts(
    userId: string,
    limit: number = 10,
    offset: number = 0
): Promise<PostResult<PostWithInteractions[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Check if viewing own profile
        const isOwnProfile = user?.id === userId;

        // Check follow relationship if not own profile
        let isMutualFollow = false;
        if (user && !isOwnProfile) {
            // Check if current user follows target user
            const { data: following } = await supabase
                .from('followers')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', userId)
                .single();

            // Check if target user follows current user back
            const { data: follower } = await supabase
                .from('followers')
                .select('id')
                .eq('follower_id', userId)
                .eq('following_id', user.id)
                .single();

            isMutualFollow = !!following && !!follower;
        }

        // Build query based on relationship
        let query = supabase
            .from('posts')
            .select(
                `
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        post_attachments (
          id,
          file_url,
          file_type
        )
      `
            )
            .eq('user_id', userId);

        // Apply privacy filter
        if (!isOwnProfile && !isMutualFollow) {
            // Not own profile and not mutual follow -> only public posts
            query = query.eq('is_public', true);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        // Get interaction counts for each post
        const postsWithInteractions = await Promise.all(
            (data || []).map(async (post: any) => {
                // Get like count
                const { count: likeCount } = await supabase
                    .from('post_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Get comment count
                const { count: commentCount } = await supabase
                    .from('post_comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Check if user has liked this post
                const { data: userLike } = user
                    ? await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single()
                    : { data: null };

                return {
                    ...post,
                    like_count: likeCount || 0,
                    comment_count: commentCount || 0,
                    user_has_liked: !!userLike,
                };
            })
        );

        return {
            success: true,
            data: postsWithInteractions,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
