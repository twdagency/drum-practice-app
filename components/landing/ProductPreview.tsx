'use client';

import { useEffect, useRef } from 'react';
import { Music } from 'lucide-react';
import { LandingStave } from './LandingStave';

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

            {/* Notation Preview Area - Real VexFlow stave with animated highlighting */}
            <div className="p-6 sm:p-8 md:p-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center relative overflow-hidden">
              <div className="relative z-10 w-full max-w-4xl">
                <LandingStave className="w-full" />
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
