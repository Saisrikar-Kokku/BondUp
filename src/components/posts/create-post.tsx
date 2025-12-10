'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UploadProgress, SuccessToast } from '@/components/ui/upload-progress';
import { createPost } from '@/lib/actions/posts';
import { validateFileSize, validateFileType } from '@/lib/utils/storage';

export function CreatePost() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Check total images
        if (images.length + files.length > 4) {
            setError('Maximum 4 images allowed per post');
            return;
        }

        // Validate each file
        for (const file of files) {
            // 6MB limit with clear error message
            const maxSizeMB = 6;
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`Image "${file.name}" is ${fileSizeMB}MB. Maximum allowed is ${maxSizeMB}MB. Please compress or resize the image.`);
                return;
            }

            const typeError = validateFileType(file, ['image/jpeg', 'image/png', 'image/webp']);
            if (typeError) {
                setError(`"${file.name}" is not a valid image format. Please use JPG, PNG, or WebP.`);
                return;
            }
        }

        // Add files and create previews
        setImages((prev) => [...prev, ...files]);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews((prev) => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        setError(null);
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // Simulate upload progress for better UX
    const simulateProgress = useCallback(() => {
        return new Promise<void>((resolve) => {
            const totalDuration = 2500; // Total time for upload simulation
            const steps = 100;
            const interval = totalDuration / steps;
            let currentStep = 0;

            const progressInterval = setInterval(() => {
                currentStep++;
                // Create a more realistic progress curve (faster at start, slower at end)
                const progress = Math.min(
                    95,
                    Math.round(
                        100 * (1 - Math.pow(1 - currentStep / steps, 2))
                    )
                );
                setUploadProgress(progress);

                if (currentStep >= steps * 0.95) {
                    clearInterval(progressInterval);
                    resolve();
                }
            }, interval);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!content.trim() && images.length === 0) {
            setError('Please add some content or images');
            return;
        }

        setLoading(true);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Start progress simulation
            const progressPromise = images.length > 0 ? simulateProgress() : Promise.resolve();

            // Actual upload
            const uploadPromise = createPost(content, images.length > 0 ? images : undefined, isPublic);

            // Wait for both
            const [, result] = await Promise.all([progressPromise, uploadPromise]);

            if (!result.success) {
                setError(result.error || 'Failed to create post');
                setLoading(false);
                setIsUploading(false);
                return;
            }

            // Complete the progress
            setUploadProgress(100);

            // Short delay to show 100%
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reset form
            setContent('');
            setImages([]);
            setPreviews([]);
            setIsPublic(true);
            setIsUploading(false);
            setUploadProgress(0);
            setLoading(false);

            // Show success message
            setShowSuccess(true);

            // Refresh the page to show the new post
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="rounded-2xl glass-light p-6 shadow-lg">
                <form onSubmit={handleSubmit}>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        rows={3}
                        className="mb-4"
                        disabled={loading}
                    />

                    {/* Upload Progress */}
                    <UploadProgress
                        progress={uploadProgress}
                        isUploading={isUploading}
                        fileName={images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''}` : undefined}
                    />

                    {/* Image Previews */}
                    {previews.length > 0 && !isUploading && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="h-32 w-full rounded-lg object-cover transition-transform group-hover:scale-[1.02]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                        disabled={loading}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                    {/* Image number badge */}
                                    <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                                        {index + 1}/{previews.length}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Message */}
                    {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

                    {/* Actions */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleImageSelect}
                                className="hidden"
                                disabled={loading || images.length >= 4}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading || images.length >= 4}
                            >
                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Add Images ({images.length}/4)
                            </Button>
                            <span className="text-sm text-gray-500">{content.length}/2000</span>
                        </div>

                        {/* Privacy Toggle */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    disabled={loading}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="flex items-center gap-1">
                                    {isPublic ? (
                                        <>
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Public
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                            Followers only
                                        </>
                                    )}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading || (!content.trim() && images.length === 0)}
                            className="relative overflow-hidden"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Posting...
                                </span>
                            ) : (
                                'Post'
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Success Toast */}
            <SuccessToast
                message="Your post was shared successfully! 🎉"
                isVisible={showSuccess}
                onClose={() => setShowSuccess(false)}
            />
        </>
    );
}
