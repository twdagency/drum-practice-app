'use client';

import { useEffect, useRef } from 'react';

export function ProductPreview() {
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

      if (mockupRef.current) {
        // Entrance animation
        gsap.from(mockupRef.current, {
          x: 100,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
          delay: 0.5,
        });

        // Parallax effect on scroll
        if (mockupRef.current) {
          gsap.to(mockupRef.current, {
            scrollTrigger: {
              trigger: mockupRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
            y: -50,
            scale: 0.98,
          });
        }

        // Subtle floating animation
        gsap.to(mockupRef.current, {
          y: -10,
          duration: 3,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Browser Window Mockup */}
      <div
        ref={mockupRef}
        className="relative w-full max-w-xl lg:max-w-2xl mx-auto"
      >
        {/* Browser Chrome */}
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-t-2xl border border-white/10 p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <div className="flex-1 bg-gray-700/50 rounded-lg px-4 py-1.5 text-xs text-white/60">
              drum-practice-generator.com/app
            </div>
          </div>

          {/* App Preview Content */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg overflow-hidden border border-white/5">
            {/* Toolbar Mockup */}
            <div className="bg-gray-800/80 border-b border-white/5 px-4 py-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-sm">🎵</span>
              </div>
              <div className="flex-1 h-2 bg-gray-700/50 rounded"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            </div>

            {/* Notation Preview Area */}
            <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-gray-900 to-black min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center relative">
              {/* Animated Notation Lines */}
              <div className="absolute inset-0 flex flex-col justify-center gap-6 px-8">
                {[0, 1, 2, 3, 4].map((line) => (
                  <div
                    key={line}
                    className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  />
                ))}
              </div>

              {/* Drum Notes Animation */}
              <div className="relative z-10 w-full max-w-4xl">
                <div className="flex items-center justify-center gap-8">
                  {/* Animated Drum Notes */}
                  {['K', 'S', 'T', 'H'].map((drum, index) => (
                    <div
                      key={drum}
                      className="flex flex-col items-center gap-2"
                      style={{
                        animationDelay: `${index * 0.2}s`,
                      }}
                    >
                      {/* Note Head */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/80 to-purple-500/80 border-2 border-white/30 shadow-lg animate-pulse"></div>
                      {/* Note Stem */}
                      <div className="w-1 h-16 bg-gradient-to-b from-blue-400/60 to-transparent"></div>
                      {/* Label */}
                      <div className="text-xs text-white/40 font-mono mt-1">{drum}</div>
                    </div>
                  ))}
                </div>

                {/* Time Signature */}
                <div className="absolute top-4 left-8 text-white/60 font-bold text-lg">
                  4/4
                </div>

                {/* Beat Indicators */}
                <div className="flex gap-4 justify-center mt-12">
                  {[1, 2, 3, 4].map((beat) => (
                    <div
                      key={beat}
                      className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-60"
                      style={{
                        animation: `pulse 1.5s ease-in-out ${beat * 0.25}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Animated Cursor */}
              <div className="absolute bottom-8 right-8 w-6 h-6 border-2 border-white/40 rounded-sm animate-pulse">
                <div className="absolute top-0 left-0 w-3 h-3 bg-white/40"></div>
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
