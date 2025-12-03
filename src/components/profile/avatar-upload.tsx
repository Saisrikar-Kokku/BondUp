'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadFile, validateFileSize, validateFileType } from '@/lib/utils/storage';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userId: string;
    onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userId, onUploadComplete }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Validate file size (5MB max)
        const sizeError = validateFileSize(file, 5);
        if (sizeError) {
            setError(sizeError);
            return;
        }

        // Validate file type
        const typeError = validateFileType(file, ['image/jpeg', 'image/png', 'image/webp']);
        if (typeError) {
            setError(typeError);
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        setUploading(true);
        const filePath = `${userId}/avatar.${file.name.split('.').pop()}`;
        const result = await uploadFile(file, 'avatars', filePath);

        setUploading(false);

        if (result.error) {
            setError(result.error);
            setPreview(currentAvatarUrl || null);
            return;
        }

        if (result.url) {
            onUploadComplete(result.url);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative">
                {preview ? (
                    <img
                        src={preview}
                        alt="Avatar preview"
                        className="h-32 w-32 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700"
                    />
                ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-5xl font-bold text-white ring-4 ring-gray-100 dark:ring-gray-700">
                        ?
                    </div>
                )}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                    </div>
                )}
            </div>

            {/* Upload Button */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
            >
                {uploading ? 'Uploading...' : 'Change Avatar'}
            </Button>

            {/* Error Message */}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            {/* Helper Text */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                JPG, PNG or WebP. Max 5MB.
            </p>
        </div>
    );
}
