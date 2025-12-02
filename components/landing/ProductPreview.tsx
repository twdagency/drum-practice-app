'use client';

import { useEffect, useRef, useState } from 'react';
import { Music } from 'lucide-react';

export function ProductPreview() {
  const mockupRef = useRef<HTMLDivElement>(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);

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

  // Animate note highlighting like playback
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNoteIndex((prev) => (prev + 1) % 4);
    }, 600); // Change note every 600ms (like 100 BPM)

    return () => clearInterval(interval);
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

            {/* Notation Preview Area - Real stave with animated highlighting */}
            <div className="p-6 sm:p-8 md:p-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center relative overflow-hidden">
              {/* Time Signature - Top Left */}
              <div className="absolute top-6 left-6 text-slate-300 font-semibold text-base z-10">
                4/4
              </div>

              {/* Main Notation Area */}
              <div className="relative z-10 w-full max-w-4xl">
                {/* 5-Line Stave - Proper musical staff */}
                <div className="relative flex flex-col justify-center items-center py-8">
                  {/* Staff Lines - 5 horizontal lines like real musical notation */}
                  <div className="relative w-full">
                    {[0, 1, 2, 3, 4].map((lineIndex) => (
                      <div
                        key={lineIndex}
                        className="absolute left-0 right-0 h-px bg-slate-400/30"
                        style={{
                          top: `${20 + lineIndex * 20}px`,
                        }}
                      />
                    ))}
                    
                    {/* Drum Notes on Stave - Positioned like VexFlow */}
                    <div className="relative flex items-center justify-center gap-16 sm:gap-20 mt-10">
                      {[
                        { drum: 'K', position: 'bottom', color: '#8b5cf6' }, // Kick - bottom space
                        { drum: 'S', position: 'middle', color: '#3b82f6' }, // Snare - middle space
                        { drum: 'T', position: 'top', color: '#a855f7' }, // Tom - top space
                        { drum: 'H', position: 'top', color: '#6366f1' }, // Hi-hat - top line
                      ].map((note, index) => {
                        // Calculate vertical position on stave (5 lines = 4 spaces)
                        const positions = {
                          bottom: 80, // Below bottom line
                          middle: 60, // Middle space (3rd space)
                          top: 20,    // Top space
                        };
                        const yPosition = positions[note.position as keyof typeof positions] || 60;
                        const isActive = index === activeNoteIndex;
                        
                        return (
                          <div
                            key={note.drum}
                            className="relative flex flex-col items-center"
                            style={{
                              top: `${yPosition}px`,
                            }}
                          >
                            {/* Note Head - Circular, animated highlight */}
                            <div
                              className={`note-head w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200 ${
                                isActive
                                  ? 'bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50 scale-110'
                                  : 'bg-slate-700/50 border-slate-600/50 scale-100'
                              }`}
                              style={{
                                animation: isActive 
                                  ? 'notePulse 0.5s ease-in-out infinite' 
                                  : 'none',
                                filter: isActive 
                                  ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.8))' 
                                  : 'none',
                              }}
                            />
                            
                            {/* Note Stem - Vertical line */}
                            <div 
                              className={`w-0.5 h-12 sm:h-16 transition-all duration-200 ${
                                isActive
                                  ? 'bg-purple-400'
                                  : 'bg-slate-500/30'
                              }`}
                              style={{
                                marginTop: '-2px',
                              }}
                            />
                            
                            {/* Drum Label */}
                            <div 
                              className={`text-xs sm:text-sm font-medium mt-1 transition-colors duration-200 ${
                                isActive
                                  ? 'text-purple-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {note.drum}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Playback Indicator - Shows which note is currently playing */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        step === activeNoteIndex
                          ? 'bg-purple-400 shadow-md shadow-purple-500/50 scale-125'
                          : 'bg-slate-600/50 scale-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* CSS Animation for note highlighting */}
              <style jsx>{`
                @keyframes notePulse {
                  0%, 100% {
                    transform: scale(1.1);
                    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
                  }
                  50% {
                    transform: scale(1.2);
                    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0);
                  }
                }
              `}</style>
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
