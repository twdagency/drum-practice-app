'use client';

import { useEffect, useRef } from 'react';
import { Music } from 'lucide-react';

export function ProductPreview() {
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ctx: gsap.Context | null = null;

    // Dynamically import GSAP for animations
    Promise.all([
      // @ts-ignore
      import('gsap'),
      // @ts-ignore
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      if (!mockupRef.current) return;

      ctx = gsap.context(() => {
        const mockup = mockupRef.current;
        if (!mockup) return;

        // Entrance animation
        gsap.from(mockup, {
          x: 100,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
          delay: 0.5,
        });
      });

      // Parallax effect on scroll
      if (mockupRef.current) {
        gsap.to(mockupRef.current, {
          scrollTrigger: {
            trigger: mockupRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
            invalidateOnRefresh: true,
          },
          y: -50,
          scale: 0.98,
        });
      }
    });

    return () => {
      if (ctx) {
        ctx.revert();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Browser Window Mockup */}
      <div
        ref={mockupRef}
        className="relative w-full max-w-xl lg:max-w-2xl mx-auto"
      >
        {/* Browser Chrome */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-t-2xl border border-slate-700/50 p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/40"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/40"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/40"></div>
            </div>
            <div className="flex-1 bg-slate-700/40 rounded-lg px-4 py-1.5 text-xs text-slate-300">
              drum-practice-generator.com/app
            </div>
            <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
          </div>

          {/* App Preview Content */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden border border-slate-700/30">
            {/* Toolbar Mockup */}
            <div className="bg-slate-800/60 border-b border-slate-700/30 px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/20">
                <Music className="w-4 h-4 text-purple-400" strokeWidth={2} />
              </div>
              <div className="flex-1 h-1.5 bg-slate-700/40 rounded"></div>
              <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
            </div>

            {/* Notation Preview Area - Matching actual app design */}
            <div className="p-6 sm:p-8 md:p-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center relative">
              {/* Time Signature - Top Left */}
              <div className="absolute top-6 left-6 text-slate-300 font-semibold text-base">
                4/4
              </div>

              {/* Main Notation Area */}
              <div className="relative z-10 w-full max-w-3xl">
                {/* Staff Lines - Horizontal */}
                <div className="absolute inset-0 flex flex-col justify-center">
                  {/* Main horizontal line connecting all notes */}
                  <div className="h-px bg-slate-400/40 mx-12"></div>
                  {/* Two fainter lines above */}
                  <div className="h-px bg-slate-500/20 mx-12 mb-8"></div>
                  <div className="h-px bg-slate-500/20 mx-12 mb-16"></div>
                </div>

                {/* Drum Notes - Matching actual app layout */}
                <div className="flex items-center justify-center gap-12 sm:gap-16">
                  {['K', 'S', 'T', 'H'].map((drum, index) => (
                    <div
                      key={drum}
                      className="flex flex-col items-center relative"
                      style={{
                        animationDelay: `${index * 0.15}s`,
                      }}
                    >
                      {/* Circular Note Head - Glowing purple/blue gradient */}
                      <div 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500/90 via-blue-500/90 to-purple-600/90 border-2 border-white/20 shadow-lg shadow-purple-500/30 animate-pulse"
                        style={{
                          animationDuration: '2s',
                          animationDelay: `${index * 0.2}s`,
                        }}
                      ></div>
                      
                      {/* Vertical Stem - Light blue line */}
                      <div className="w-0.5 h-20 sm:h-24 bg-gradient-to-b from-blue-400/70 via-blue-300/50 to-transparent mt-[-2px]"></div>
                      
                      {/* Horizontal connection line - connects to main staff */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-px bg-blue-400/40"></div>
                      
                      {/* Drum Label - K, S, T, H */}
                      <div className="text-sm sm:text-base text-slate-300 font-medium mt-2 tracking-wide">
                        {drum}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step/Pagination Indicators - Bottom Center */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
                  {[1, 2, 3, 4].map((step, index) => (
                    <div
                      key={step}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index >= 2 
                          ? 'bg-purple-400 shadow-lg shadow-purple-500/50' 
                          : 'bg-slate-600/50'
                      }`}
                      style={{
                        animation: index >= 2 ? `pulse 1.5s ease-in-out ${index * 0.2}s infinite` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-3xl -z-10"></div>

        {/* Floating Elements */}
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}
