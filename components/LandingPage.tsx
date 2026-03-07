import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';
import { WordRotate } from './ui/word-rotate';
import { InfiniteTextMarquee } from './ui/infinite-text-marquee';
import { VideoScrollHero } from './ui/video-scroll-hero';
import { StickyScroll } from './ui/sticky-scroll-reveal';
import { TestimonialsSection } from './ui/testimonials-section';
import { AnimatedTestimonials } from './ui/testimonial';
import { ScrollRevealText } from './ui/scroll-reveal-text';
import { SpotlightSection } from './ui/spotlight-section';
import { MagneticText } from './ui/morphing-cursor';

const nexusTestimonials = [
  {
    src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop',
    quote: "Nexus AI has completely transformed our data pipeline. We can now generate deterministic reports at scale without any manual intervention.",
    name: 'James Wilson',
    designation: 'Lead Data Scientist at QuantumLeap',
  },
  {
    src: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop',
    quote: "The strategic thinking behind their intelligence datasets is unparalleled. Our growth has been exponential since the integration.",
    name: 'Sarah Drasner',
    designation: 'VP of Product at NexusLink',
  },
  {
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop',
    quote: "Scaling engineering teams is hard, but scaling insights is harder. Nexus AI does both with remarkable efficiency.",
    name: 'Marcus Thorne',
    designation: 'CEO at DataStream Inc.',
  },
  {
    src: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop',
    quote: "I was skeptical about AI-driven analytics, but Nexus proved that precision and speed can indeed go hand in hand.",
    name: 'Kenji Tanaka',
    designation: 'Software Engineer at CodeCrafters',
  },
  {
    src: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?q=80&w=1887&auto=format&fit=crop',
    quote: "The visualization engine in Nexus is a game-changer. Our board meetings are now powered by real-time, interactive insights.",
    name: 'David Lee',
    designation: 'Data Architect at Global Analytics',
  },
];

const howItWorks = [
  {
    title: "Upload Data",
    description: "Drag & drop your CSV or Excel files. We handle messy headers and formatting instantly.",
    image: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=1200",
    metric: "Step 01"
  },
  {
    title: "AI Processing",
    description: "Our dual-brain engine cleans data and detects patterns using deterministic logic.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=1200",
    metric: "Step 02"
  },
  {
    title: "Get Insights",
    description: "Receive a comprehensive report with charts, trends, and business recommendations.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    metric: "Step 03"
  }
];

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  profile?: UserProfile | null;
  onEnterApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, profile, onEnterApp }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = () => {
    setScrolled(window.scrollY > 20);
  };

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 selection:bg-purple-500 selection:text-white font-sans">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-5' : 'bg-transparent py-8'}`}>
        <div className="max-w-[1800px] mx-auto px-6 grid grid-cols-3 items-center">
          
          {/* Left: Menu Button */}
          <div className="flex justify-start">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="group flex items-center gap-3 px-6 py-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-all duration-300"
            >
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-900">
                {mobileMenuOpen ? 'Close' : 'Menu'}
              </span>
              <div className="flex flex-col gap-1 w-4">
                <span className={`h-0.5 bg-purple-900 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                <span className={`h-0.5 bg-purple-900 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 bg-purple-900 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Center: Nexus Logo */}
          <div className="flex justify-center flex-col items-center gap-1 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-nexus-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-nexus-500/20 group-hover:scale-110 transition-transform duration-500">
                N
              </div>
              <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">Nexus<span className="text-nexus-600">Analyst</span></span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex justify-end items-center gap-4">
            {profile ? (
              <button
                onClick={onEnterApp}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase hover:bg-nexus-600 transition-all duration-300 shadow-xl shadow-slate-900/10"
              >
                Enter App
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={onLogin} className="hidden sm:block text-xs font-black tracking-widest uppercase text-slate-900 hover:text-nexus-600 transition-colors">Sign In</button>
                <button onClick={onGetStarted} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase hover:bg-nexus-600 transition-all duration-300 shadow-xl shadow-900/10">
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Cinematic Visual Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[60] bg-nexus-cream p-6 overflow-y-auto"
            >
              <div className="max-w-[1800px] mx-auto">
                {/* Menu Header (Mirroring Navbar) */}
                <div className="grid grid-cols-3 items-center mb-24 py-8">
                  <div className="flex justify-start">
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center gap-3 px-8 py-3 rounded-full bg-slate-900 text-white hover:bg-nexus-600 transition-all duration-300 shadow-xl shadow-slate-900/10"
                    >
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase">Close</span>
                      <div className="flex flex-col gap-1 w-4">
                        <span className="h-0.5 bg-white rotate-45 translate-y-1 transition-all"></span>
                        <span className="h-0.5 bg-white -rotate-45 -translate-y-1 transition-all"></span>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-center flex-col items-center gap-1 cursor-pointer" onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-tr from-nexus-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-nexus-500/20">
                        N
                      </div>
                      <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">Nexus<span className="text-nexus-600">Analyst</span></span>
                    </div>
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  {[
                    { title: "WORK", desc: "Capabilities & Portfolio", img: "https://images.unsplash.com/photo-1639322537231-2f206e06af84?auto=format&fit=crop&q=80&w=800", link: "#how-it-works" },
                    { title: "ENGINE", desc: "The Deterministic Logic", img: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800", link: "#how-it-works" },
                    { title: "PHILOSOPHY", desc: "Intelligence Policy", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800", link: "#testimonials" },
                    { title: "PARTNERSHIP", desc: "Start a Collaboration", img: "https://images.unsplash.com/photo-1557426272-fc759fbbad47?auto=format&fit=crop&q=80&w=800", link: "#" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.8 }}
                      className="group cursor-pointer"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (item.link.startsWith('#')) scrollToSection(item.link.substring(1));
                      }}
                    >
                      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-8 shadow-xl shadow-slate-200/50">
                        <img 
                          src={item.img} 
                          alt={item.title} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
                      </div>
                      <h4 className="text-5xl font-impact text-slate-900 tracking-tighter uppercase mb-2 group-hover:text-nexus-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xl font-accent italic text-slate-500 flex items-center gap-2">
                        {item.desc}
                        <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] transform group-hover:rotate-45 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                          <i className="fas fa-arrow-up rotate-45"></i>
                        </span>
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-wrap justify-center md:justify-end gap-x-12 gap-y-6 pt-12 border-t border-slate-200">
                  <button onClick={() => scrollToSection('features')} className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">Pricing</button>
                  <button onClick={() => scrollToSection('how-it-works')} className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">Platform</button>
                  <button onClick={() => scrollToSection('features')} className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">Careers</button>
                  <button onClick={() => scrollToSection('testimonials')} className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">Testimonials</button>
                  <button onClick={() => scrollToSection('features')} className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">Press</button>
                  <button onClick={onLogin} className="text-xs font-black tracking-widest uppercase text-purple-600 hover:text-purple-900 transition-colors">Customer Portal</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-nexus-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          
          <h1 className="text-7xl md:text-[180px] font-impact text-slate-900 leading-[0.85] tracking-tight uppercase mb-8">
            <span className="block mb-2 whitespace-nowrap">Transforming Data into</span>
            <span className="inline-flex items-center gap-4">
              <WordRotate 
                words={["Insights", "Strategy", "Intelligence", "Growth"]} 
                className="text-7xl md:text-[180px] font-impact"
              />
              <span className="elegant-ampersand text-[0.8em] lowercase transform -translate-y-4">&amp;</span>
              Action
            </span>
          </h1>

          <div className="max-w-3xl mx-auto text-3xl md:text-5xl font-accent italic text-slate-800 leading-tight mb-12 px-4">
            At Nexus AI, we go beyond simple metrics. <br />
            We form strategic intelligence across datasets to position your business for exponential growth.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={profile && onEnterApp ? onEnterApp : onGetStarted}
              className="px-12 py-5 bg-nexus-lavender text-slate-900 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-slate-900 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Spacer to show more of the cream background */}
          <div className="h-24 md:h-32"></div>
        </div>
    </section>

    {/* Marquee Section */}
    <section className="bg-white border-y border-slate-100 overflow-hidden relative z-20">
      <InfiniteTextMarquee
        text="NEXUS AI • DATA ANALYSIS PURIFIED • DETERMINISTIC INTELLIGENCE • SCALE FASTER • NEXUS AI"
        speed={25}
        fontSize="6rem"
        tooltipText="The Future of Insight 🚀"
        hoverColor="#2542ff"
        showTooltip={true}
      />
    </section>

    {/* Video Scroll Section */}
    <VideoScrollHero 
      videoSrc="https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-particles-background-27453-large.mp4"
      className="bg-nexus-cream"
    />

    {/* How It Works Sticky Scroll Section */}
    <StickyScroll 
      id="how-it-works"
      content={howItWorks} 
      title={<>How it<br />works</>}
      description="Go from raw data to actionable insights in three simple steps."
    />

    {/* Testimonials Section */}
    <TestimonialsSection />

    {/* Scroll Reveal Typography Section */}
    <ScrollRevealText 
      line1="Unparalleled Intelligence" 
      line2="Redefining the Future of Data."
      className="bg-white"
    />

    {/* Animated Testimonials Section */}
    <section className="py-12 bg-nexus-cream relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-nexus-600 mb-4 px-2">Voice of the Experts</h2>
          <p className="text-slate-400 font-accent italic text-lg">Swipe to hear from our global network</p>
        </div>
        <AnimatedTestimonials testimonials={nexusTestimonials} />
      </div>
    </section>

      {/* Features Grid (Bento) */}
      <section className="py-48 bg-nexus-cream relative overflow-hidden flex flex-col items-center text-center">
        <div className="max-w-[95vw] mx-auto px-6 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center mb-12">
             <h2 className="text-[clamp(3rem,8vw,12rem)] font-impact text-slate-900 leading-[0.85] tracking-tighter uppercase w-full max-w-7xl">
                Your Success Deserves A
             </h2>
             <div className="mt-4">
               <MagneticText 
                 text="DEDICATED PARTNER." 
                 hoverText="DETERMINISTIC RESULTS." 
                 textClassName="text-[clamp(3rem,8vw,12rem)] leading-[0.85] uppercase"
               />
             </div>
          </div>

          <div className="max-w-3xl space-y-8 mt-12">
            <p className="text-2xl md:text-3xl font-accent italic text-slate-600 leading-snug">
              Your challenges are as unique as your data—so why settle for one-size-fits-all solutions? 
              We customize our approach to ensure long-term, scalable success.
            </p>
            <p className="text-lg md:text-xl text-slate-400 font-accent italic">
              Move beyond traditional analytics and embrace a partnership built for the future of intelligence.
            </p>
          </div>

          <div className="mt-24">
            <button className="px-20 py-8 bg-slate-900 text-white rounded-full text-xl font-bold tracking-[0.2em] uppercase hover:bg-nexus-lavender hover:text-slate-900 transition-all duration-700 shadow-2xl hover:scale-105 active:scale-95">
              Initiate Partnership
            </button>
          </div>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-nexus-lavender/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      </section>

      {/* Footer */}
      {/* Antigravity Style Footer */}
      <footer className="py-16 bg-nexus-cream border-t border-nexus-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-20">
            <h3 className="text-4xl md:text-5xl font-accent italic text-slate-900 mb-12 md:mb-0">
              Experience intelligence
            </h3>
            
            <div className="flex gap-24 md:gap-48">
              <div className="space-y-4">
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Download</a>
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Product</a>
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Docs</a>
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Changelog</a>
              </div>
              <div className="space-y-4">
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Blog</a>
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Pricing</a>
                <a href="#" className="block text-slate-900 hover:text-nexus-600 font-medium transition-colors">Use Cases</a>
              </div>
            </div>
          </div>

          <div className="relative mb-16 select-none pointer-events-none text-left">
            <h2 className="text-[17vw] font-impact text-slate-900 leading-[0.8] tracking-tighter uppercase whitespace-nowrap opacity-90 -ml-2">
              Nexus AI
            </h2>
          </div>

          <div className="flex justify-start gap-6 mb-12">
            {[
              { icon: 'fab fa-twitter', label: 'Twitter' },
              { icon: 'fab fa-linkedin', label: 'LinkedIn' },
              { icon: 'fab fa-github', label: 'GitHub' },
              { icon: 'fab fa-youtube', label: 'YouTube' }
            ].map((social, idx) => (
              <a 
                key={idx} 
                href="#" 
                className="w-10 h-10 rounded-full bg-white border border-nexus-100 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shadow-sm"
                aria-label={social.label}
              >
                <i className={social.icon + " text-sm"}></i>
              </a>
            ))}
          </div>

          <div className="pt-8 border-t border-nexus-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs">
                <i className="fas fa-bolt"></i>
              </div>
              <span className="text-lg font-display font-black text-slate-900">Nexus<span className="text-nexus-600">Analyst</span></span>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-slate-900 transition-colors">About Nexus</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
