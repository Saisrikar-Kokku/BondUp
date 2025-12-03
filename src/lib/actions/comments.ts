'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CommentWithProfile } from '@/types/database.types';

export interface CommentResult {
    success: boolean;
    error?: string;
    data?: any;
}

/**
 * Create a new comment on a post
 */
export async function createComment(postId: string, content: string): Promise<CommentResult> {
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
                error: 'Comment cannot be empty',
            };
        }

        if (content.length > 500) {
            return {
                success: false,
                error: 'Comment must be 500 characters or less',
            };
        }

        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content,
            })
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
 * Update a comment
 */
export async function updateComment(commentId: string, content: string): Promise<CommentResult> {
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
                error: 'Comment cannot be empty',
            };
        }

        if (content.length > 500) {
            return {
                success: false,
                error: 'Comment must be 500 characters or less',
            };
        }

        const { data, error } = await supabase
            .from('post_comments')
            .update({ content })
            .eq('id', commentId)
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
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<CommentResult> {
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

        const { error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId)
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
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get comments for a post with pagination
 */
export async function getPostComments(
    postId: string,
    limit: number = 10,
    offset: number = 0
): Promise<CommentResult> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('post_comments')
            .select(
                `
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `
            )
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data: data as CommentWithProfile[],
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}

/**
 * Get comment count for a post
 */
export async function getCommentCount(postId: string): Promise<CommentResult> {
    try {
        const supabase = await createClient();

        const { count, error } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data: { count: count || 0 },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
        };
    }
}
