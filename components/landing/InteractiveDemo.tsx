'use client';

import { useState, useEffect, useRef } from 'react';

interface DemoTab {
  id: string;
  label: string;
  icon: string;
  title: string;
  description: string;
  highlights: string[];
}

const demoData: DemoTab[] = [
  {
    id: 'notation',
    label: 'Notation',
    icon: '🎵',
    title: 'Professional Notation',
    description: 'Create and view drum patterns with professional VexFlow notation. Export to multiple formats.',
    highlights: [
      'Industry-standard VexFlow rendering',
      'Export to MIDI, SVG, PNG, PDF',
      'Real-time notation updates',
      'Print-ready output',
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: '🎹',
    title: 'MIDI & Microphone Practice',
    description: 'Practice with MIDI drum pads or use your microphone for real-time feedback and accuracy analysis.',
    highlights: [
      'Full MIDI support',
      'Microphone audio analysis',
      'Real-time accuracy feedback',
      'Practice statistics tracking',
    ],
  },
  {
    id: 'patterns',
    label: 'Patterns',
    icon: '🎯',
    title: 'Custom Pattern Creation',
    description: 'Build custom patterns with voicing, sticking, accents, ghost notes, and ornaments.',
    highlights: [
      '175+ preset patterns',
      'Advanced polyrhythms',
      'Custom time signatures',
      'Ghost notes & ornaments',
    ],
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: '📊',
    title: 'Track Your Improvement',
    description: 'Monitor your practice sessions with detailed statistics, accuracy metrics, and progress goals.',
    highlights: [
      'Session history',
      'Accuracy trends',
      'Practice streaks',
      'Goal tracking',
    ],
  },
];

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState('notation');
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    Promise.all([
      // @ts-ignore
      import('gsap'),
      // @ts-ignore
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      // Animate section on scroll
      if (sectionRef.current) {
        gsap.from(sectionRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        });
      }
    });
  }, []);

  // Animate content change
  useEffect(() => {
    if (typeof window === 'undefined' || !contentRef.current) return;

    Promise.all([
      // @ts-ignore
      import('gsap'),
    ]).then(([gsapModule]) => {
      const gsap = gsapModule.gsap;

      gsap.from(contentRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
  }, [activeTab]);

  const activeDemo = demoData.find((tab) => tab.id === activeTab) || demoData[0];

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
            See It In Action
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Explore our powerful features through interactive demonstrations
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6 overflow-x-auto">
            {demoData.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2 text-lg sm:text-xl">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div ref={contentRef} className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Text Content */}
            <div>
              <div className="text-4xl sm:text-5xl mb-3 md:mb-4">{activeDemo.icon}</div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 md:mb-4">{activeDemo.title}</h3>
              <p className="text-white/70 text-base md:text-lg mb-4 md:mb-6 leading-relaxed">
                {activeDemo.description}
              </p>
              <ul className="space-y-3">
                {activeDemo.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-white/80">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-8 border border-white/10 shadow-2xl">
                {/* Mockup Interface */}
                <div className="space-y-4">
                  {/* Feature-specific mockup */}
                  {activeTab === 'notation' && (
                    <div className="relative">
                      {/* Staff Lines */}
                      <div className="flex flex-col gap-6 py-8">
                        {[0, 1, 2, 3, 4].map((line) => (
                          <div
                            key={line}
                            className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          />
                        ))}
                      </div>
                      {/* Notes */}
                      <div className="absolute inset-0 flex items-center justify-around">
                        {['K', 'S', 'T', 'H'].map((note) => (
                          <div
                            key={note}
                            className="flex flex-col items-center gap-2"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white/50"></div>
                            <div className="w-1 h-12 bg-gradient-to-b from-blue-300 to-transparent"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'practice' && (
                    <div className="grid grid-cols-4 gap-4">
                      {['Kick', 'Snare', 'Hi-Hat', 'Tom'].map((pad, index) => (
                        <div
                          key={pad}
                          className="aspect-square bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-xl border border-white/20 flex flex-col items-center justify-center hover:scale-105 transition-transform"
                          style={{
                            animation: `pulse 2s ease-in-out ${index * 0.3}s infinite`,
                          }}
                        >
                          <div className="text-2xl mb-2">🥁</div>
                          <div className="text-xs text-white/60">{pad}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'patterns' && (
                    <div className="space-y-3">
                      {[
                        { name: 'Single Stroke Roll', difficulty: 'Easy' },
                        { name: 'Paradiddle', difficulty: 'Medium' },
                        { name: 'Flam Accent', difficulty: 'Hard' },
                      ].map((pattern) => (
                        <div
                          key={pattern.name}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{pattern.name}</span>
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                              {pattern.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'progress' && (
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-white/60 text-sm">This Week</span>
                          <span className="text-white font-bold">12h 30m</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: '75%' }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">98%</div>
                          <div className="text-xs text-white/60">Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">7</div>
                          <div className="text-xs text-white/60">Day Streak</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">42</div>
                          <div className="text-xs text-white/60">Sessions</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
