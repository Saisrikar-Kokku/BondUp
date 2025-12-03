'use server';

import { createClient } from '@/lib/supabase/server';
import { Post } from '@/types/database.types';

export async function searchUsers(query: string, limit = 10, offset = 0) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('search_users', {
            search_term: query,
            limit_val: limit,
            offset_val: offset,
        });

        if (error) {
            console.error('Error searching users:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Unexpected error searching users:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

export async function searchPosts(query: string, limit = 10, offset = 0) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('search_posts', {
            search_term: query,
            limit_val: limit,
            offset_val: offset,
        });

        if (error) {
            console.error('Error searching posts:', error);
            return { success: false, error: error.message };
        }

        // Map the result to match Post type structure if needed
        // The RPC returns user_data as JSONB, which we might need to parse or use as is
        const mappedData = data?.map((post: any) => ({
            ...post,
            profiles: post.user_data, // Map user_data to profiles for consistency with other post queries
        }));

        return { success: true, data: mappedData };
    } catch (error) {
        console.error('Unexpected error searching posts:', error);
        return { success: false, error: 'An unexpected error occurred' };
    }
}
