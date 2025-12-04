'use client';

import { useEffect, useState } from 'react';

interface LoginSuccessAnimationProps {
    username?: string;
    onComplete: () => void;
}

/**
 * Fancy shader-like login success animation inspired by 21st.dev
 * Shows an animated welcome screen before transitioning to the main app
 */
export function LoginSuccessAnimation({ username, onComplete }: LoginSuccessAnimationProps) {
    const [phase, setPhase] = useState<'intro' | 'pulse' | 'reveal' | 'complete'>('intro');

    useEffect(() => {
        // Phase 1: Intro animation (0-800ms)
        const introTimer = setTimeout(() => setPhase('pulse'), 800);

        // Phase 2: Pulse animation (800-2000ms)
        const pulseTimer = setTimeout(() => setPhase('reveal'), 2000);

        // Phase 3: Reveal animation (2000-3200ms)
        const revealTimer = setTimeout(() => setPhase('complete'), 3200);

        // Phase 4: Complete and callback (3200-3500ms)
        const completeTimer = setTimeout(() => onComplete(), 3500);

        return () => {
            clearTimeout(introTimer);
            clearTimeout(pulseTimer);
            clearTimeout(revealTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
            {/* Animated shader background */}
            <div className="absolute inset-0 shader-background" />

            {/* Gradient orbs floating */}
            <div className={`absolute w-96 h-96 rounded-full bg-gradient-to-r from-primary-500/40 to-secondary-500/40 blur-3xl transition-all duration-1000 ${phase === 'intro' ? 'scale-0 opacity-0' :
                    phase === 'pulse' ? 'scale-150 opacity-100 animate-float-slow' :
                        'scale-200 opacity-50'
                }`} />

            <div className={`absolute w-64 h-64 -top-32 -left-32 rounded-full bg-gradient-to-r from-secondary-400/30 to-pink-500/30 blur-2xl transition-all duration-1000 delay-200 ${phase === 'intro' ? 'scale-0' : 'scale-100 animate-float-reverse'
                }`} />

            <div className={`absolute w-72 h-72 -bottom-32 -right-32 rounded-full bg-gradient-to-r from-blue-400/30 to-primary-500/30 blur-2xl transition-all duration-1000 delay-300 ${phase === 'intro' ? 'scale-0' : 'scale-100 animate-float-slow'
                }`} />

            {/* Rotating gradient ring */}
            <div className={`absolute w-[500px] h-[500px] transition-all duration-1000 ${phase === 'intro' ? 'scale-0 rotate-0 opacity-0' :
                    phase === 'pulse' ? 'scale-100 rotate-180 opacity-100' :
                        'scale-150 rotate-360 opacity-0'
                }`}>
                <div className="absolute inset-0 rounded-full animate-spin-slow" style={{
                    background: 'conic-gradient(from 0deg, transparent, #6366f1, #8b5cf6, #ec4899, #f43f5e, #6366f1, transparent)',
                    animationDuration: '3s',
                }} />
                <div className="absolute inset-4 rounded-full bg-gray-900/90 dark:bg-gray-900" />
            </div>

            {/* Center content */}
            <div className={`relative z-10 text-center transition-all duration-700 ${phase === 'intro' ? 'scale-50 opacity-0' :
                    phase === 'pulse' ? 'scale-100 opacity-100' :
                        phase === 'reveal' ? 'scale-110 opacity-100' :
                            'scale-100 opacity-0 translate-y-10'
                }`}>
                {/* Logo with glow */}
                <div className={`relative mb-6 ${phase === 'pulse' ? 'animate-pulse-glow' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 blur-xl opacity-50 animate-pulse" />
                    <h1 className="relative text-5xl font-bold bg-gradient-to-r from-primary-400 via-secondary-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                        BondUp
                    </h1>
                </div>

                {/* Welcome message */}
                <div className={`transition-all duration-500 delay-300 ${phase === 'pulse' || phase === 'reveal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                    <p className="text-xl text-white/90 mb-2">
                        Welcome back{username ? `, ${username}` : ''}!
                    </p>
                    <p className="text-sm text-white/60">
                        Preparing your feed...
                    </p>
                </div>

                {/* Loading dots animation */}
                <div className={`flex justify-center gap-2 mt-8 transition-opacity duration-500 ${phase === 'pulse' || phase === 'reveal' ? 'opacity-100' : 'opacity-0'
                    }`}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400"
                            style={{
                                animation: 'bounce 1s infinite',
                                animationDelay: `${i * 0.15}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Particle effects */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full bg-white/40 transition-opacity duration-500 ${phase === 'pulse' || phase === 'reveal' ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float-particle ${2 + Math.random() * 3}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
