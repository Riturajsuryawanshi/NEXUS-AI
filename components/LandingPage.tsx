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
    quote: "Nexus AI delivers fast, data-driven business insights that help freelancers and agencies identify opportunities and pitch smarter.",
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
    title: "Paste Maps Link",
    description: "By simply pasting a business’s Google Maps link, Nexus AI automatically generates a detailed business intelligence report—covering online presence, customer sentiment from reviews, growth opportunities, marketing gaps, and actionable recommendations.",
    image: "/photo1.png", // Maps/Navigation related
    metric: "Step 01"
  },
  {
    title: "Instant Pitch Deck",
    description: "Instead of spending hours researching a potential client, users can produce a professional data-backed report in seconds and use it to pitch services like marketing, automation, SEO, reputation management, or analytics.",
    image: "/photo2.png", // Dashboard/Analytics related
    metric: "Step 02"
  },
  {
    title: "Close More Clients",
    description: "This makes Nexus AI a powerful prospecting and sales-enablement tool for freelancers and agencies who want to find high-quality leads, demonstrate expertise with real data, and close clients faster with insights that businesses actually care about.",
    image: "/photo3.png", // Results related
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

      {/* Navbar - Enhanced Glassmorphism */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-4' : 'bg-transparent py-8'}`}>
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
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-black tracking-widest uppercase hover:shadow-[0_0_20px_rgba(37,66,255,0.4)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Enter App</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={onLogin} className="hidden sm:block text-xs font-bold tracking-widest uppercase text-slate-600 hover:text-blue-600 transition-colors">Sign In</button>
                <button onClick={onGetStarted} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-black tracking-widest uppercase hover:shadow-[0_0_20px_rgba(37,66,255,0.4)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
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
              className="fixed inset-0 z-[60] bg-white/70 backdrop-blur-3xl p-6 overflow-y-auto"
            >
              <div className="max-w-[1800px] mx-auto">
                {/* Menu Header (Mirroring Navbar) */}
                <div className="grid grid-cols-3 items-center mb-24 py-8">
                  <div className="flex justify-start">
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center gap-3 px-8 py-3 rounded-full bg-slate-900 border border-slate-700 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-[0_0_20px_rgba(37,66,255,0.4)]"
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
                      <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
                        N
                      </div>
                      <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">Nexus<span className="text-nexus-600">Analyst</span></span>
                    </div>
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  {[
                    { title: "FEATURES", desc: "Capabilities & Tools", img: "/photo1.png", link: "#how-it-works" },
                    { title: "PRICING", desc: "Plans & Packages", img: "/photo2.png", link: "#pricing" },
                    { title: "ABOUT", desc: "Our Mission & Story", img: "/photo3.png", link: "#about" }, 
                    { title: "CONTACT", desc: "Get In Touch", img: "/photo5.png", link: "#contact" }
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
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
                      </div>
                      <h4 className="text-5xl font-impact text-slate-900 tracking-tighter uppercase mb-2 group-hover:text-blue-600 transition-colors">
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
                  <button onClick={() => scrollToSection('pricing')} className="text-xs font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors">Pricing</button>
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

      {/* Hero Section - Elegant Gradient Background */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
          
          <h1 className="text-7xl md:text-[180px] font-impact leading-[0.85] tracking-tight uppercase mb-8">
            <span className="block mb-2 whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-950 to-slate-800">
              Turn Business Data Into
            </span>
            <span className="inline-flex items-center gap-4 text-slate-900">
              <WordRotate 
                words={["Client", "Growth", "Sales", "Pitch"]} 
                className="text-7xl md:text-[180px] font-impact bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
              />
              <span className="elegant-ampersand text-[0.8em] lowercase transform -translate-y-4 text-blue-300">&amp;</span>
              Opportunities
            </span>
          </h1>

          <div className="max-w-3xl mx-auto text-2xl md:text-4xl font-accent italic text-slate-600 leading-tight mb-16 px-4">
            Nexus AI is an AI-powered SaaS platform that helps freelancers, agencies, and consultants instantly analyze businesses and turn that insight into client acquisition opportunities.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            <button
              onClick={profile && onEnterApp ? onEnterApp : onGetStarted}
              className="px-14 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-base font-bold tracking-[0.2em] uppercase shadow-[0_8px_30px_rgba(37,66,255,0.3)] hover:shadow-[0_8px_40px_rgba(37,66,255,0.5)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
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



    {/* Image Scroll Section */}
    <VideoScrollHero 
      imageSrc="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2000"
      className="bg-slate-50"
    />

    {/* How It Works Sticky Scroll Section */}
    <StickyScroll 
      id="how-it-works"
      content={howItWorks} 
      title={<>How it<br />works</>}
      description="From an instant map link to a winning client proposal in seconds."
    />

    {/* Testimonials Section */}
    <TestimonialsSection />

    {/* Scroll Reveal Typography Section */}
    <ScrollRevealText 
      line1="AI-Powered Business Intelligence" 
      line2="For Smarter Client Acquisition."
      className="bg-white"
    />

    {/* Animated Testimonials Section */}
    <section id="about" className="py-12 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-nexus-600 mb-4 px-2">Voice of the Experts</h2>
          <p className="text-slate-400 font-accent italic text-lg">Swipe to hear from our global network</p>
        </div>
        <AnimatedTestimonials testimonials={nexusTestimonials} />
      </div>
    </section>

      {/* Features Grid (Bento) */}
      <section id="pricing" className="py-48 bg-slate-50 relative overflow-hidden flex flex-col items-center text-center">
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
              This makes Nexus AI a powerful prospecting and sales-enablement tool for freelancers and agencies who want to find high-quality leads, demonstrate expertise with real data, and close clients faster with insights that businesses actually care about.
            </p>
          </div>

          <div className="mt-24 relative inline-block">
            <button className="px-20 py-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xl font-bold tracking-[0.2em] uppercase shadow-[0_8px_30px_rgba(37,66,255,0.4)] hover:shadow-[0_8px_40px_rgba(37,66,255,0.6)] hover:-translate-y-2 transition-all duration-700 relative overflow-hidden group">
              <span className="relative z-10">Initiate Partnership</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out"></div>
            </button>
          </div>
        </div>

        {/* Decorative Background Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-blue-50/5 rounded-full blur-[150px] pointer-events-none -z-10" />
      </section>

      {/* Footer */}
      {/* Antigravity Style Footer */}
      <footer id="contact" className="py-16 bg-slate-50 border-t border-nexus-100 overflow-hidden">
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs shadow-lg">
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
