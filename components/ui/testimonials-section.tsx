"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

const testimonials = [
  {
    quote: "Nexus AI incorporates great speed, reasonable price, strategic thinking, professionalism and fun all rolled into one.",
    author: "David Baker",
    role: "Chief Digital Officer",
    image: "https://images.unsplash.com/photo-1522071823991-b9977755598c?auto=format&fit=crop&q=80&w=1200",
  },
  {
    quote: "The deterministic nature of Nexus's pipelines has transformed our data reliability from 60% to 99.9%.",
    author: "Sarah Chen",
    role: "Director of Engineering",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200",
  },
  {
    quote: "Scaling our analytics was a nightmare until we integrated Nexus. Now, insights are available at the speed of thought.",
    author: "Marcus Thorne",
    role: "CEO, DataStream Inc.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200",
  }
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="relative bg-slate-50 pb-12 overflow-hidden">
      {/* Refined Wavy Image Container */}
      <div className="relative w-[95vw] mx-auto h-[60vh] md:h-[75vh] overflow-hidden rounded-[4rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonials[index].image}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <img
              src={testimonials[index].image}
              alt="Testimonial background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/5" />
          </motion.div>
        </AnimatePresence>

        {/* Smooth Single-Arc Bottom Transition */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-10 translate-y-[1px]">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-[calc(100%+1.3px)] h-[100px] md:h-[180px] fill-slate-50"
          >
            <path d="M0,120h1200V0C1050,90,750,120,600,120S150,90,0,0V120Z" />
          </svg>
        </div>
      </div>

      {/* Refined Content Section with Massive Spacing */}
      <div className="max-w-[95vw] mx-auto px-6 pt-32 md:pt-48 text-center flex flex-col items-center">
        <div className="mb-12">
            <span className="text-sm md:text-base font-bold tracking-[0.4em] uppercase text-nexus-600 border-b border-nexus-200 pb-2">
              Beekman 1802
            </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-16 max-w-[90rem]"
          >
            <h2 className="text-[clamp(2.5rem,6vw,8rem)] font-accent italic text-slate-900 leading-[1.05] tracking-tight">
              "{testimonials[index].quote}"
            </h2>
            
            <div className="space-y-2">
              <p className="text-2xl md:text-4xl font-impact uppercase tracking-tight text-slate-800">
                {testimonials[index].author}
              </p>
              <p className="text-xl md:text-2xl font-accent italic text-slate-400">
                {testimonials[index].role}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation & CTA */}
        <div className="mt-32 w-full flex flex-col items-center gap-16">
          <div className="flex items-center gap-10">
            <button
              onClick={prev}
              className="p-5 border border-slate-200 rounded-full text-slate-400 hover:border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-500 transform hover:scale-110 active:scale-90"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={next}
              className="p-5 border border-slate-200 rounded-full text-slate-400 hover:border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-500 transform hover:scale-110 active:scale-90"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          <button className="px-14 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-lg font-bold tracking-widest uppercase hover:shadow-[0_8px_30px_rgba(37,66,255,0.4)] transform hover:-translate-y-1 active:translate-y-0 transition-all duration-500 relative overflow-hidden group">
            <span className="relative z-10">Read All Testimonials</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
          </button>
        </div>
      </div>
    </section>
  );
}
