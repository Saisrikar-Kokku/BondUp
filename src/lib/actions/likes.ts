'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface LikeResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * Toggle like on a post (like if not liked, unlike if already liked)
 */
export async function toggleLike(postId: string): Promise<LikeResult> {
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

        // Check if user has already liked the post
        const { data: existingLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();

        if (existingLike) {
            // Unlike: delete the like
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

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
                data: { liked: false },
            };
        } else {
            // Like: insert a new like
            const { error } = await supabase.from('post_likes').insert({
                post_id: postId,
                user_id: user.id,
            });

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
                data: { liked: true },
            };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get like count and user's like status for a post
 */
export async function getPostLikes(postId: string): Promise<LikeResult> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Get like count
        const { count, error: countError } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        if (countError) {
            return {
                success: false,
                error: countError.message,
            };
        }

        let userHasLiked = false;

        // Check if current user has liked (only if authenticated)
        if (user) {
            const { data: userLike } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .single();

            userHasLiked = !!userLike;
        }

        return {
            success: true,
            data: {
                count: count || 0,
                userHasLiked,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
