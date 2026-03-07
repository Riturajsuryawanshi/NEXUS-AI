"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface ContentItem {
  title: string;
  description: string;
  image: string;
  metric: string;
  cta?: string;
}

export const StickyScroll = ({
  content,
  title,
  description,
  className,
  id,
}: {
  content: ContentItem[];
  title?: React.ReactNode;
  description?: string;
  className?: string;
  id?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full py-32 bg-nexus-cream", className)}
    >
      <div className="max-w-[95vw] mx-auto px-4 lg:flex lg:items-start lg:gap-12">
        
        {/* Left Side: Static & Sticky Heading */}
        <div className="lg:sticky lg:top-24 lg:w-[45%] mb-20 lg:mb-0 self-start">
          <h2 className="text-[clamp(4.5rem,11vw,13rem)] font-impact text-slate-900 leading-[0.8] uppercase tracking-tighter">
            {title || <>Our Work<br />Speaks<br />For Itself</>}
          </h2>
          {description && (
            <p className="mt-8 text-2xl font-accent italic text-slate-500 max-w-xl">
              {description}
            </p>
          )}
          <div className="mt-16">
            <button className="px-10 py-4 bg-[#D4E8E4] text-slate-700 rounded-full text-base font-bold tracking-widest uppercase hover:bg-slate-900 hover:text-white transition-all duration-300 transform hover:scale-105 active:scale-95">
              Get Started Now
            </button>
          </div>
        </div>

        {/* Right Side: Scrolling Content */}
        <div className="lg:w-[55%] space-y-48 py-10">
          {content.map((item, index) => (
            <div key={item.title + index} className="group cursor-pointer">
              {/* Image Container */}
              <div className="relative aspect-[16/10] overflow-hidden rounded-[3rem] mb-12 bg-slate-200 shadow-2xl ring-1 ring-black/5 transform transition-all duration-500 group-hover:shadow-nexus-lavender/20">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
              </div>

              {/* Text Content */}
              <div className="space-y-6 px-4">
                <h3 className="text-6xl md:text-8xl font-impact text-slate-900 uppercase tracking-tight">
                  {item.title}
                </h3>
                <p className="text-3xl md:text-4xl font-accent italic text-slate-700 leading-tight">
                  {item.description}
                </p>
                {item.metric && (
                  <div className="pt-6 text-nexus-600 font-bold tracking-[0.2em] uppercase text-lg">
                    {item.metric}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
