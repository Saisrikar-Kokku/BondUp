'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <div className="h-5 w-5" />
            </Button>
        );
    }

    const isDark = resolvedTheme === 'dark';

    const handleToggle = () => {
        if (isAnimating) return;

        const newTheme = isDark ? 'light' : 'dark';

        // Create the overlay element
        const overlay = document.createElement('div');
        overlay.id = 'theme-transition-overlay';

        // Get button position for origin
        const rect = buttonRef.current?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
        const y = rect ? rect.top + rect.height / 2 : 0;

        // Calculate the radius needed to cover the entire screen
        const maxRadius = Math.sqrt(
            Math.pow(Math.max(x, window.innerWidth - x), 2) +
            Math.pow(Math.max(y, window.innerHeight - y), 2)
        );

        // Style the overlay
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 99999;
            background: ${newTheme === 'dark'
                ? 'radial-gradient(circle at center, #0a0a0f 0%, #1a1a2e 50%, #0f0f23 100%)'
                : 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)'
            };
            clip-path: circle(0px at ${x}px ${y}px);
            transition: clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        document.body.appendChild(overlay);
        setIsAnimating(true);

        // Trigger the animation
        requestAnimationFrame(() => {
            overlay.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;
        });

        // Change theme at the midpoint of animation
        setTimeout(() => {
            setTheme(newTheme);
        }, 300);

        // Remove overlay after animation
        setTimeout(() => {
            overlay.remove();
            setIsAnimating(false);
        }, 650);
    };

    return (
        <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            disabled={isAnimating}
            className="h-9 w-9 rounded-full relative overflow-hidden group transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Animated glow ring on hover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />

            {/* Sun icon - visible in dark mode */}
            <Sun
                className={`h-5 w-5 absolute transition-all duration-500 ${isDark
                        ? 'rotate-0 scale-100 text-yellow-400'
                        : 'rotate-180 scale-0 text-yellow-400'
                    }`}
            />
            {/* Moon icon - visible in light mode */}
            <Moon
                className={`h-5 w-5 absolute transition-all duration-500 ${isDark
                        ? '-rotate-180 scale-0 text-slate-700'
                        : 'rotate-0 scale-100 text-slate-600'
                    }`}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
