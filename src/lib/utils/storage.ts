import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
    url: string | null;
    error: string | null;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param path - The path within the bucket
 * @param supabase - Optional Supabase client instance (required for server-side usage)
 * @returns Object with url or error
 */
export async function uploadFile(
    file: File,
    bucket: string,
    path: string,
    supabase?: SupabaseClient
): Promise<UploadResult> {
    try {
        const client = supabase || createClient();

        // Upload file
        const { data, error } = await client.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        });

        if (error) {
            console.error('Upload error:', error);
            return { url: null, error: error.message };
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = client.storage.from(bucket).getPublicUrl(data.path);

        return { url: publicUrl, error: null };
    } catch (error) {
        console.error('Upload exception:', error);
        return {
            url: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The path to the file
 * @returns Error message or null on success
 */
export async function deleteFile(bucket: string, path: string): Promise<string | null> {
    try {
        const supabase = createClient();

        const { error } = await supabase.storage.from(bucket).remove([path]);

        if (error) {
            return error.message;
        }

        return null;
    } catch (error) {
        return error instanceof Error ? error.message : 'Unknown error occurred';
    }
}

/**
 * Get public URL for a file
 * @param bucket - The storage bucket name
 * @param path - The path to the file
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
    const supabase = createClient();
    const {
        data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
}

/**
 * Validate file size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns Error message or null if valid
 */
export function validateFileSize(file: File, maxSizeMB: number): string | null {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
}

/**
 * Validate file type
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Error message or null if valid
 */
export function validateFileType(file: File, allowedTypes: string[]): string | null {
    if (!allowedTypes.includes(file.type)) {
        return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
}
