'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ScrollRevealTextProps {
  line1: string;
  line2: string;
  className?: string;
}

export function ScrollRevealText({ line1, line2, className }: ScrollRevealTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Transformations for Line 1 (Left to Right)
  const x1 = useTransform(smoothProgress, [0, 0.5, 1], ["-100%", "0%", "100%"]);
  const opacity1 = useTransform(smoothProgress, [0, 0.2, 0.4, 0.6, 0.8], [0, 0.5, 1, 0.5, 0]);

  // Transformations for Line 2 (Right to Left)
  const x2 = useTransform(smoothProgress, [0, 0.5, 1], ["100%", "0%", "-100%"]);
  const opacity2 = useTransform(smoothProgress, [0, 0.2, 0.4, 0.6, 0.8], [0, 0.5, 1, 0.5, 0]);

  return (
    <section 
      ref={containerRef} 
      className={cn("relative min-h-[40vh] flex flex-col justify-center items-center py-12 overflow-hidden bg-nexus-cream", className)}
    >
      <div className="w-full space-y-0 px-4">
        {/* Line 1: Slips in from Left */}
        <div className="flex justify-start w-full whitespace-nowrap overflow-hidden">
          <motion.h2 
            style={{ x: x1, opacity: opacity1 }}
            className="text-[clamp(2.5rem,10vw,14rem)] font-accent italic text-slate-900 leading-[0.9] tracking-tighter"
          >
            {line1}
          </motion.h2>
        </div>

        {/* Line 2: Slips in from Right */}
        <div className="flex justify-end w-full whitespace-nowrap overflow-hidden">
          <motion.h2 
            style={{ x: x2, opacity: opacity2 }}
            className="text-[clamp(2.5rem,10vw,14rem)] font-accent italic text-slate-900 leading-[0.9] tracking-tighter"
          >
            {line2}
          </motion.h2>
        </div>
      </div>

      {/* Subtle Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-nexus-lavender/5 rounded-full blur-[120px] pointer-events-none -z-10" />
    </section>
  );
}
