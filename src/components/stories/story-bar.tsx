'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { StoryCard } from './story-card';
import { StoryViewer } from './story-viewer';
import { StoryCreator } from './story-creator';
import { getStoriesForFeed, type UserWithStories } from '@/lib/actions/stories';

import Image from 'next/image';

interface StoryBarProps {
    currentUserId: string;
    currentUserAvatar?: string | null;
    currentUsername: string;
}

export function StoryBar({ currentUserId, currentUserAvatar, currentUsername }: StoryBarProps) {
    const [usersWithStories, setUsersWithStories] = useState<UserWithStories[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [creatorOpen, setCreatorOpen] = useState(false);
    const [selectedUserIndex, setSelectedUserIndex] = useState(0);

    const currentUserIndex = usersWithStories.findIndex(u => u.user.id === currentUserId);
    const hasOwnStories = currentUserIndex !== -1 && usersWithStories[currentUserIndex]?.stories.length > 0;

    const fetchStories = async () => {
        const result = await getStoriesForFeed();
        if (result.success && result.data) {
            setUsersWithStories(result.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStories();
        const interval = setInterval(fetchStories, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleOwnStoryClick = () => {
        if (hasOwnStories) {
            setSelectedUserIndex(currentUserIndex);
            setViewerOpen(true);
        } else {
            setCreatorOpen(true);
        }
    };

    const handleAddNewStory = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCreatorOpen(true);
    };

    const handleStoryClick = (userIndex: number) => {
        setSelectedUserIndex(userIndex);
        setViewerOpen(true);
    };

    const handleViewerClose = () => {
        setViewerOpen(false);
        fetchStories();
    };

    if (isLoading) {
        return (
            <div className="py-4">
                <div className="flex gap-4 overflow-x-auto scrollbar-hidden px-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="py-3 px-4">
                <div className="flex gap-4 overflow-x-auto scrollbar-hidden">
                    {/* Your Story Button */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <button
                            onClick={handleOwnStoryClick}
                            className="relative group focus:outline-none"
                        >
                            <div className={`
                                w-16 h-16 rounded-full overflow-hidden
                                transition-all duration-300
                                group-hover:scale-110 group-active:scale-95
                                ${hasOwnStories
                                    ? 'ring-[3px] ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950'
                                    : 'ring-2 ring-dashed ring-gray-300 dark:ring-gray-600'
                                }
                            `}
                                style={hasOwnStories ? {
                                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1)',
                                    padding: '3px'
                                } : undefined}
                            >
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                                    {currentUserAvatar ? (
                                        <Image
                                            src={currentUserAvatar}
                                            alt="You"
                                            fill
                                            className={`object-cover ${hasOwnStories ? '' : 'opacity-70'}`}
                                            sizes="64px"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">
                                                {currentUsername.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add button */}
                            <div
                                onClick={handleAddNewStory}
                                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900 group-hover:scale-110 transition-transform cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                        </button>

                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-500">
                            Your story
                        </span>
                    </div>

                    {/* Other users' stories */}
                    {usersWithStories.map((userStories, index) => {
                        if (userStories.user.id === currentUserId) return null;
                        return (
                            <StoryCard
                                key={userStories.user.id}
                                userStories={userStories}
                                onClick={() => handleStoryClick(index)}
                            />
                        );
                    })}

                    {usersWithStories.filter(u => u.user.id !== currentUserId).length === 0 && !hasOwnStories && (
                        <div className="flex items-center px-4 text-sm text-gray-400 dark:text-gray-500">
                            No stories yet
                        </div>
                    )}
                </div>
            </div>

            {viewerOpen && usersWithStories.length > 0 && (
                <StoryViewer
                    usersWithStories={usersWithStories}
                    initialUserIndex={selectedUserIndex}
                    currentUserId={currentUserId}
                    onClose={handleViewerClose}
                    onStoryDeleted={fetchStories}
                />
            )}

            {creatorOpen && (
                <StoryCreator
                    onClose={() => setCreatorOpen(false)}
                    onSuccess={() => { fetchStories(); setCreatorOpen(false); }}
                />
            )}
        </>
    );
}
