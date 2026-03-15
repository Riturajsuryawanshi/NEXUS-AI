'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SpotlightSectionProps {
  className?: string;
}

export function SpotlightSection({ className }: SpotlightSectionProps) {
  return (
    <section className={cn("relative py-32 bg-slate-50 py-48 overflow-hidden", className)}>
      <div className="max-w-[95vw] mx-auto px-6">
        
        {/* Image Collage container */}
        <div className="relative flex justify-center items-center mb-24 min-h-[50vh] md:min-h-[70vh]">
          
          {/* Left Tilted Image */}
          <motion.div 
            initial={{ opacity: 0, x: -100, rotate: -5 }}
            whileInView={{ opacity: 1, x: 0, rotate: -12 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            className="absolute left-0 md:left-[5%] z-10 w-[35vw] md:w-[25vw] aspect-[4/5] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" 
              alt="Data Analysis" 
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Center Main Image */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative z-20 w-[60vw] md:w-[40vw] aspect-square md:aspect-[4/5] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.2)]"
          >
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbdaef866d01?auto=format&fit=crop&q=80&w=1200" 
              alt="Nexus Intelligence" 
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Right Tilted Image */}
          <motion.div 
            initial={{ opacity: 0, x: 100, rotate: 5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 12 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            className="absolute right-0 md:right-[5%] z-10 w-[35vw] md:w-[25vw] aspect-[4/5] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1518186239747-d08efaa5739c?auto=format&fit=crop&q=80&w=800" 
              alt="Data Pipeline" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Typographic Content */}
        <div className="text-center max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="text-sm md:text-base font-bold tracking-[0.5em] uppercase text-nexus-600 border-b border-nexus-100 pb-2">
              Data Architecture / Core Intelligence / Scale
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-[clamp(2rem,5vw,6rem)] font-accent italic text-slate-900 leading-[1.1] tracking-tight"
          >
            Building the deterministic foundations for the world's most ambitious data teams.
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
            className="pt-12"
          >
            <button className="px-12 py-5 bg-slate-900 text-white rounded-full text-base font-bold tracking-widest uppercase hover:bg-blue-50 hover:text-slate-900 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl">
              Partner With Us
            </button>
          </motion.div>
        </div>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] bg-gradient-to-t from-[#D4E8E4]/30 to-transparent -z-10 pointer-events-none" />
    </section>
  );
}
