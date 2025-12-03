'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, FileText } from 'lucide-react';

export function SearchTabs() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const currentType = searchParams.get('type') || 'people';

    const handleTabChange = (type: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('type', type);
        replace(`/search?${params.toString()}`);
    };

    return (
        <div className="flex justify-center gap-2 mb-6">
            <Button
                variant={currentType === 'people' ? 'default' : 'outline'}
                onClick={() => handleTabChange('people')}
                className="gap-2 w-32"
            >
                <Users className="h-4 w-4" />
                People
            </Button>
            <Button
                variant={currentType === 'posts' ? 'default' : 'outline'}
                onClick={() => handleTabChange('posts')}
                className="gap-2 w-32"
            >
                <FileText className="h-4 w-4" />
                Posts
            </Button>
        </div>
    );
}
