'use client';

import { useEffect, useRef, useState, ReactNode, memo, useMemo } from 'react';

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    duration?: number;
    distance?: number;
    once?: boolean;
}

/**
 * Optimized scroll reveal animation component using Intersection Observer
 * Memoized for better performance
 */
function ScrollRevealInner({
    children,
    className = '',
    delay = 0,
    direction = 'up',
    duration = 0.5,
    distance = 30,
    once = true,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        if (once) {
                            observer.unobserve(entry.target);
                        }
                    } else if (!once) {
                        setIsVisible(false);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -30px 0px',
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [once]);

    const style = useMemo(() => {
        const getTransform = () => {
            if (!isVisible) {
                switch (direction) {
                    case 'up': return `translateY(${distance}px)`;
                    case 'down': return `translateY(-${distance}px)`;
                    case 'left': return `translateX(${distance}px)`;
                    case 'right': return `translateX(-${distance}px)`;
                    case 'none': return 'none';
                    default: return `translateY(${distance}px)`;
                }
            }
            return 'translate(0, 0)';
        };

        return {
            opacity: isVisible ? 1 : 0,
            transform: getTransform(),
            transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
            willChange: isVisible ? 'auto' : 'opacity, transform',
        };
    }, [isVisible, direction, distance, duration, delay]);

    return (
        <div ref={ref} className={className} style={style}>
            {children}
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
export const ScrollReveal = memo(ScrollRevealInner);

/**
 * Staggered scroll reveal - simplified for better performance
 */
interface StaggeredScrollRevealProps {
    children: ReactNode[];
    className?: string;
    baseDelay?: number;
    staggerDelay?: number;
}

export const StaggeredScrollReveal = memo(function StaggeredScrollReveal({
    children,
    className = '',
    baseDelay = 0,
    staggerDelay = 0.05,
}: StaggeredScrollRevealProps) {
    return (
        <div className={className}>
            {children.map((child, index) => (
                <ScrollReveal
                    key={index}
                    delay={baseDelay + index * staggerDelay}
                    duration={0.4}
                    distance={20}
                >
                    {child}
                </ScrollReveal>
            ))}
        </div>
    );
});
