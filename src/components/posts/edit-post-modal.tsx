'use client';

import { useState } from 'react';
import type { PostWithAll } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updatePost } from '@/lib/actions/posts';

interface EditPostModalProps {
    post: PostWithAll;
    onClose: () => void;
}

export function EditPostModal({ post, onClose }: EditPostModalProps) {
    const [content, setContent] = useState(post.content);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!content.trim()) {
            setError('Post content cannot be empty');
            return;
        }

        setSaving(true);

        const result = await updatePost(post.id, content);

        if (!result.success) {
            setError(result.error || 'Failed to update post');
            setSaving(false);
            return;
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Edit Post</h2>

                <form onSubmit={handleSubmit}>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        className="mb-4"
                        disabled={saving}
                    />

                    {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{content.length}/2000</span>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving || !content.trim()}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
