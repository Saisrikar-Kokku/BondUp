'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
    images: { id: string; file_url: string }[];
    className?: string;
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showArrows, setShowArrows] = useState(false);

    const totalImages = images.length;

    const goToSlide = useCallback((index: number) => {
        if (index < 0) index = 0;
        if (index >= totalImages) index = totalImages - 1;
        setCurrentIndex(index);
        setDragOffset(0);
    }, [totalImages]);

    const nextSlide = () => goToSlide(currentIndex + 1);
    const prevSlide = () => goToSlide(currentIndex - 1);

    // Touch/Mouse handlers
    const handleDragStart = (clientX: number) => {
        setIsDragging(true);
        setDragStart(clientX);
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        const offset = clientX - dragStart;
        setDragOffset(offset);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50;
        if (dragOffset < -threshold && currentIndex < totalImages - 1) {
            nextSlide();
        } else if (dragOffset > threshold && currentIndex > 0) {
            prevSlide();
        } else {
            setDragOffset(0);
        }
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX);
    const handleTouchEnd = () => handleDragEnd();

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX);
    const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX);
    const handleMouseUp = () => handleDragEnd();
    const handleMouseLeave = () => isDragging && handleDragEnd();

    // Single image - no carousel needed
    if (totalImages === 1) {
        return (
            <div className={cn("relative rounded-xl overflow-hidden", className)}>
                <img
                    src={images[0].file_url}
                    alt="Post image"
                    className="w-full h-80 object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn("relative rounded-xl overflow-hidden group", className)}
            onMouseEnter={() => setShowArrows(true)}
            onMouseLeave={() => setShowArrows(false)}
        >
            {/* Image Counter Badge */}
            <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                {currentIndex + 1} / {totalImages}
            </div>

            {/* Images Container */}
            <div
                ref={containerRef}
                className="relative h-80 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className={cn(
                        "flex h-full transition-transform duration-300 ease-out",
                        isDragging && "transition-none"
                    )}
                    style={{
                        transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                    }}
                >
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className="relative w-full h-full flex-shrink-0"
                        >
                            <img
                                src={image.file_url}
                                alt={`Image ${index + 1}`}
                                className={cn(
                                    "w-full h-full object-cover transition-all duration-300",
                                    index === currentIndex
                                        ? "scale-100 brightness-100"
                                        : "scale-95 brightness-75"
                                )}
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows - Desktop */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                        "h-9 w-9 rounded-full flex items-center justify-center",
                        "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg",
                        "text-gray-800 dark:text-white",
                        "hover:bg-white hover:scale-110 active:scale-95",
                        "transition-all duration-200",
                        showArrows ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                    )}
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
            )}
            {currentIndex < totalImages - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                        "h-9 w-9 rounded-full flex items-center justify-center",
                        "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg",
                        "text-gray-800 dark:text-white",
                        "hover:bg-white hover:scale-110 active:scale-95",
                        "transition-all duration-200",
                        showArrows ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"
                    )}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            )}

            {/* Dot Indicators - Glassmorphism */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={cn(
                            "transition-all duration-300 rounded-full",
                            index === currentIndex
                                ? "w-6 h-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                : "w-2 h-2 bg-white/50 hover:bg-white/70"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
