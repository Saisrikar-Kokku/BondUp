'use client';

import { useEffect, useRef, useCallback } from 'react';
import createGlobe from 'cobe';

interface GlobeProps {
    className?: string;
    size?: number;
}

/**
 * Interactive 3D Globe animation inspired by 21st.dev
 * Built with Cobe for high-performance WebGL rendering
 * Improved drag interaction with smooth momentum
 */
export function Globe({ className = '', size = 600 }: GlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const phiRef = useRef(0);
    const thetaRef = useRef(0.3);
    const velocityRef = useRef(0);
    const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

    const updatePointerInteraction = useCallback((clientX: number) => {
        if (pointerInteracting.current !== null) {
            const delta = clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            // Apply velocity for smooth dragging
            velocityRef.current = delta * 0.01;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let animationFrameId: number;

        const globe = createGlobe(canvas, {
            devicePixelRatio: 2,
            width: size * 2,
            height: size * 2,
            phi: 0,
            theta: 0.3,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.3, 0.3, 0.3],
            markerColor: [0.6, 0.4, 1],
            glowColor: [0.4, 0.2, 0.8],
            markers: [
                // Major cities around the world
                { location: [37.7749, -122.4194], size: 0.05 }, // San Francisco
                { location: [40.7128, -74.006], size: 0.07 }, // New York
                { location: [51.5074, -0.1278], size: 0.06 }, // London
                { location: [35.6762, 139.6503], size: 0.06 }, // Tokyo
                { location: [48.8566, 2.3522], size: 0.05 }, // Paris
                { location: [55.7558, 37.6173], size: 0.05 }, // Moscow
                { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
                { location: [19.076, 72.8777], size: 0.07 }, // Mumbai
                { location: [1.3521, 103.8198], size: 0.04 }, // Singapore
                { location: [-23.5505, -46.6333], size: 0.05 }, // São Paulo
                { location: [28.6139, 77.209], size: 0.06 }, // Delhi
                { location: [31.2304, 121.4737], size: 0.06 }, // Shanghai
                { location: [52.52, 13.405], size: 0.04 }, // Berlin
                { location: [39.9042, 116.4074], size: 0.06 }, // Beijing
                { location: [25.2048, 55.2708], size: 0.05 }, // Dubai
            ],
            onRender: (state) => {
                // Apply velocity with friction when not dragging
                if (pointerInteracting.current === null) {
                    // Add auto-rotation
                    phiRef.current += 0.005;
                    // Apply momentum with friction
                    phiRef.current += velocityRef.current;
                    velocityRef.current *= 0.95; // Friction decay

                    // Stop very small velocities
                    if (Math.abs(velocityRef.current) < 0.0001) {
                        velocityRef.current = 0;
                    }
                } else {
                    // Direct control during dragging
                    phiRef.current += velocityRef.current;
                }

                state.phi = phiRef.current;
                state.theta = thetaRef.current;
                state.width = size * 2;
                state.height = size * 2;
            },
        });

        globeRef.current = globe;

        // Fade in animation
        setTimeout(() => {
            if (canvas) {
                canvas.style.opacity = '1';
            }
        }, 100);

        return () => {
            globe.destroy();
        };
    }, [size]);

    // Pointer/Touch event handlers
    const handlePointerDown = useCallback((clientX: number) => {
        pointerInteracting.current = clientX;
        velocityRef.current = 0; // Stop momentum when grabbing
    }, []);

    const handlePointerUp = useCallback(() => {
        pointerInteracting.current = null;
    }, []);

    const handlePointerMove = useCallback((clientX: number) => {
        if (pointerInteracting.current !== null) {
            const delta = (clientX - pointerInteracting.current) * 0.003;
            velocityRef.current = delta;
            pointerInteracting.current = clientX;
        }
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Animated glow effect behind globe */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
                    style={{
                        width: size * 1.2,
                        height: size * 1.2,
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.15) 40%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            {/* Orbiting ring */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-500/20 animate-spin pointer-events-none"
                style={{
                    width: size * 1.1,
                    height: size * 1.1,
                    animationDuration: '30s',
                }}
            />

            {/* Globe canvas */}
            <canvas
                ref={canvasRef}
                className="transition-opacity duration-1000 opacity-0 cursor-grab active:cursor-grabbing relative z-10"
                style={{
                    width: size,
                    height: size,
                    contain: 'layout paint size',
                    maxWidth: '100%',
                    touchAction: 'none', // Prevent browser touch gestures
                }}
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    handlePointerDown(e.clientX);
                }}
                onPointerUp={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    handlePointerUp();
                }}
                onPointerCancel={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    handlePointerUp();
                }}
                onPointerMove={(e) => {
                    handlePointerMove(e.clientX);
                }}
                onPointerLeave={() => {
                    handlePointerUp();
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-violet-400 rounded-full animate-float-slow"
                        style={{
                            top: `${20 + Math.random() * 60}%`,
                            left: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 0.5}s`,
                            opacity: 0.4 + Math.random() * 0.4,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Compact globe for smaller spaces
 */
export function GlobeDemo() {
    return (
        <div className="relative flex items-center justify-center">
            <Globe size={500} />
        </div>
    );
}
