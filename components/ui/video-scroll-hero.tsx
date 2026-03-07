"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";

interface VideoScrollHeroProps {
  videoSrc?: string;
  enableAnimations?: boolean;
  className?: string;
  startScale?: number;
}

export function VideoScrollHero({
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-particles-background-27453-large.mp4",
  enableAnimations = true,
  className = "",
  startScale = 0.25,
}: VideoScrollHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Use framer-motion's useScroll for the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Map progress to scale
  // We want it to reach 1.0 at 60% (0.6) of the scroll progress
  const scale = useTransform(
    scrollYProgress,
    [0, 0.6, 1],
    [startScale, 1, 1]
  );

  // Add a spring for extra smoothness
  const smoothScale = useSpring(scale, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const finalScale = enableAnimations && !shouldReduceMotion ? smoothScale : 1;

  return (
    <div className={`relative ${className}`}>
      {/* Hero Section with Video */}
      <div
        ref={containerRef}
        className="relative h-[250vh] bg-nexus-cream"
      >
        {/* Fixed Video Container */}
        <div className="sticky top-0 w-full h-screen flex items-center justify-center z-10 overflow-hidden">
          <motion.div
            className="relative flex items-center justify-center will-change-transform"
            style={{
              scale: finalScale,
              transformOrigin: "center center",
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-[90vw] max-w-7xl h-[70vh] object-cover shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] border-8 border-white/10 backdrop-blur-3xl"
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video Overlay Content */}
            <motion.div
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center rounded-[2.5rem]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="text-center px-6 pointer-events-none">
                <motion.h2
                  className="text-4xl md:text-7xl lg:text-9xl font-impact text-white uppercase tracking-tight mb-6 drop-shadow-2xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.8,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  Intelligence at Scale
                </motion.h2>
                <motion.p
                  className="text-lg md:text-2xl font-accent italic text-white/95 max-w-3xl mx-auto drop-shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.0,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  Watch as Nexus AI transforms raw datasets into a universe of deterministic insights.
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
