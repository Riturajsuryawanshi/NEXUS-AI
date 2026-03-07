'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Testimonial = {
  image: string;
  audio: string;
  text: string;
  name: string;
  jobtitle: string;
};

type ComponentProps = {
  testimonials: Testimonial[];
};

export const TypewriterTestimonial: React.FC<ComponentProps> = ({ testimonials }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null); 
  const [hasBeenHovered, setHasBeenHovered] = useState<boolean[]>(new Array(testimonials.length).fill(false));
  const [typedText, setTypedText] = useState('');
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef('');

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause(); 
      audioPlayerRef.current.currentTime = 0; 
      audioPlayerRef.current.src = ''; 
      audioPlayerRef.current.load(); 
      audioPlayerRef.current = null; 
    }
  }, []); 

  const startTypewriter = useCallback((text: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setTypedText('');
    currentTextRef.current = text;
    
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setTypedText(text.slice(0, i));
        i++;
        typewriterTimeoutRef.current = setTimeout(type, 50);
      }
    };
    type();
  }, []);

  const stopTypewriter = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setTypedText('');
    currentTextRef.current = '';
  }, []); 

  const handleMouseEnter = useCallback((index: number) => {
    stopAudio(); 

    setHoveredIndex(index);
  
    // Note: Actual audio files would need to exist in /public/audio/
    // We handle errors gracefully.
    try {
        const newAudio = new Audio(`/audio/${testimonials[index].audio}`);
        audioPlayerRef.current = newAudio; 
        newAudio.play().catch(e => {
            // Silently fail if audio doesn't exist or is blocked
        });
    } catch (e) {
        // Silently fail
    }
    
    setHasBeenHovered(prev => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
    startTypewriter(testimonials[index].text);
  }, [testimonials, stopAudio, startTypewriter]); 

  const handleMouseLeave = useCallback(() => {
    stopAudio(); 
    setHoveredIndex(null);
    stopTypewriter();
  }, [stopAudio, stopTypewriter]);

  useEffect(() => {
    return () => {
      stopAudio(); 
      stopTypewriter(); 
    };
  }, [stopAudio, stopTypewriter]); 

  return (
    <div className="flex justify-center items-center gap-6 flex-wrap max-w-4xl mx-auto">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={index}
          className="relative flex flex-col items-center"
          onMouseEnter={() => handleMouseEnter(index)} 
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img
            src={testimonial.image}
            alt={`Testimonial ${index}`}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 hover:animate-pulse cursor-pointer shadow-lg"
            animate={{ 
              borderColor: (hoveredIndex === index || hasBeenHovered[index]) ? '#ACA0FB' : '#E5E7EB'
            }}
            transition={{ duration: 0.3 }}
          />
          <AnimatePresence>
            {hoveredIndex === index && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: -20 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-24 md:bottom-28 bg-white text-slate-800 text-sm px-6 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] w-64 md:w-72 border border-slate-100"
              >
                <div className="h-28 overflow-hidden whitespace-pre-wrap font-sans leading-relaxed text-slate-600">
                  {typedText}
                  <span className="inline-block w-[1px] h-[1em] bg-nexus-lavender ml-0.5 animate-pulse">|</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-right font-bold text-slate-900 uppercase tracking-tight">{testimonial.name}</p>
                    <p className="text-right text-slate-400 italic font-accent text-xs">{testimonial.jobtitle}</p>
                </div>
                
                {/* Connector Bubbles */}
                <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-6">
                  <div className="w-4 h-4 bg-white rounded-full shadow-md border border-slate-50"></div>
                  <div className="w-2 h-2 bg-white rounded-full shadow-md mt-1 mx-auto"></div>
                  <div className="w-1 h-1 bg-white rounded-full shadow-md mt-1 mx-auto"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};
