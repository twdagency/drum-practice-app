'use client';

import { useState, useEffect, useRef } from 'react';
import { Music, Piano, Target, BarChart3, Drum } from 'lucide-react';
import { LandingStave } from './LandingStave';

interface DemoTab {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  highlights: string[];
}

const demoData: DemoTab[] = [
  {
    id: 'notation',
    label: 'Notation',
    Icon: Music,
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
    Icon: Piano,
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
    Icon: Target,
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
    Icon: BarChart3,
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
        // Keep visible - no opacity animation
        sectionRef.current.style.opacity = '1';
        sectionRef.current.style.visibility = 'visible';
        
        gsap.from(sectionRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          y: 60,
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

      if (contentRef.current) {
        // Keep visible - no opacity animation
        contentRef.current.style.opacity = '1';
        contentRef.current.style.visibility = 'visible';
        
        gsap.from(contentRef.current, {
          y: 20,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
    });
  }, [activeTab]);


  const activeDemo = demoData.find((tab) => tab.id === activeTab) || demoData[0];
  const ActiveIcon = activeDemo.Icon;

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

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6 overflow-x-auto">
            {demoData.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-slate-800/60 text-slate-200 border border-slate-700/50 shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <tab.Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-slate-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div ref={contentRef} className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Text Content */}
            <div>
              <div className="mb-3 md:mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <ActiveIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" strokeWidth={1.5} />
                </div>
              </div>
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
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/30 shadow-2xl">
                {/* Mockup Interface */}
                <div className="space-y-4">
                  {/* Feature-specific mockup */}
                  {activeTab === 'notation' && (
                    <div className="relative min-h-[250px] flex items-center justify-center py-8">
                      <LandingStave className="w-full" />
                    </div>
                  )}

                  {activeTab === 'practice' && (
                    <div className="min-h-[250px] flex items-center justify-center">
                      <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-md">
                        {['Kick', 'Snare', 'Hi-Hat', 'Tom'].map((pad, index) => (
                          <div
                            key={pad}
                            className="aspect-square bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center hover:bg-slate-800/70 hover:border-slate-600/50 transition-all"
                          >
                            <Drum className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 mb-2" strokeWidth={1.5} />
                            <div className="text-xs text-slate-300 font-medium">{pad}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'patterns' && (
                    <div className="min-h-[250px] space-y-2">
                      {[
                        { name: 'Single Stroke Roll', difficulty: 'Easy' },
                        { name: 'Paradiddle', difficulty: 'Medium' },
                        { name: 'Flam Accent', difficulty: 'Hard' },
                      ].map((pattern) => (
                        <div
                          key={pattern.name}
                          className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-slate-200 font-medium text-sm">{pattern.name}</span>
                            <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded border border-slate-600/50">
                              {pattern.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 text-center">
                        <div className="text-xs text-slate-400">+ 172 more patterns</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'progress' && (
                    <div className="min-h-[250px] space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex justify-between mb-3">
                          <span className="text-slate-400 text-sm font-medium">This Week</span>
                          <span className="text-slate-200 font-semibold">12h 30m</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: '75%' }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                          <div className="text-xl font-semibold text-slate-200 mb-1">98%</div>
                          <div className="text-xs text-slate-400">Accuracy</div>
                        </div>
                        <div className="text-center bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                          <div className="text-xl font-semibold text-slate-200 mb-1">7</div>
                          <div className="text-xs text-slate-400">Day Streak</div>
                        </div>
                        <div className="text-center bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                          <div className="text-xl font-semibold text-slate-200 mb-1">42</div>
                          <div className="text-xs text-slate-400">Sessions</div>
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
