'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadStoryMedia, createStory } from '@/lib/actions/stories';

interface StoryCreatorProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function StoryCreator({ onClose, onSuccess }: StoryCreatorProps) {
    const [mounted, setMounted] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setError(null);

        const isImage = selectedFile.type.startsWith('image/');
        const isVideo = selectedFile.type.startsWith('video/');

        if (!isImage && !isVideo) {
            setError('Please select an image or video');
            return;
        }

        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setError(`Max size: ${isImage ? '10MB' : '50MB'}`);
            return;
        }

        setFile(selectedFile);
        setMediaType(isImage ? 'image' : 'video');
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!file || !mediaType) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadResult = await uploadStoryMedia(formData);

            if (!uploadResult.success || !uploadResult.url) {
                setError(uploadResult.error || 'Upload failed');
                setIsUploading(false);
                return;
            }

            const storyResult = await createStory(uploadResult.url, mediaType, caption || undefined);

            if (!storyResult.success) {
                setError(storyResult.error || 'Failed to create story');
                setIsUploading(false);
                return;
            }

            onSuccess();
        } catch {
            setError('Something went wrong');
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setMediaType(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        New Story
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {!preview ? (
                        <label className="block cursor-pointer">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-colors">
                                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                                    <ImagePlus className="w-7 h-7 text-primary-500" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tap to add photo or video
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Disappears after 24 hours
                                </p>
                            </div>
                        </label>
                    ) : (
                        <div className="space-y-4">
                            {/* Preview */}
                            <div className="relative aspect-[9/16] max-h-80 bg-gray-900 rounded-xl overflow-hidden">
                                {mediaType === 'image' ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <video src={preview} controls className="w-full h-full object-contain" />
                                )}
                                <button
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Caption */}
                            <Input
                                type="text"
                                placeholder="Add a caption..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                maxLength={100}
                                className="rounded-xl"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
                    )}
                </div>

                {/* Footer */}
                {preview && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-medium"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sharing...
                                </>
                            ) : (
                                'Share Story'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

