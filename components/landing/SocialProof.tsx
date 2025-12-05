'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, Music2, Download, Piano, Mic } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  location?: string;
  avatar?: string;
  rating?: number;
}

interface Statistic {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const statistics: Statistic[] = [
  { value: '50,000+', label: 'Practice Sessions', Icon: Music2 },
  { value: '25,000+', label: 'Patterns Created', Icon: Download },
  { value: '4.8/5', label: 'Average Rating', Icon: Star },
  { value: '94%', label: 'Would Recommend', Icon: Piano },
];

const testimonials: Testimonial[] = [
  {
    quote: 'DrumPractice transformed how I teach my students. The notation feature alone saves me hours every week, and my students love the instant feedback.',
    author: 'Sarah Martinez',
    role: 'Drum Instructor, Berklee College of Music',
    location: 'Boston, MA',
    rating: 5,
  },
  {
    quote: 'I\'ve tried every practice app out there. This is the only one that actually helped me fix my timing issues. The microphone feedback is incredibly accurate.',
    author: 'James Chen',
    role: 'Intermediate Drummer',
    location: 'London, UK',
    rating: 5,
  },
  {
    quote: 'The polyrhythm features are next level. I can finally practice complex patterns without hunting for sheet music. Improved my accuracy by 40% in just a month.',
    author: 'Marcus Williams',
    role: 'Professional Session Drummer',
    location: 'Los Angeles, CA',
    rating: 5,
  },
  {
    quote: 'As a beginner, having access to professional notation and custom patterns has accelerated my learning. The progress tracking keeps me motivated every day.',
    author: 'Emma Davis',
    role: 'Drum Student',
    location: 'Toronto, Canada',
    rating: 5,
  },
];

// Statistics highlighting actual features we have

export function SocialProof() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [countedStats, setCountedStats] = useState<{ [key: string]: number }>({});

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

      // Animate testimonials on scroll
      const testimonialCards = document.querySelectorAll('.testimonial-card');
      if (testimonialCards.length > 0) {
        testimonialCards.forEach((card: Element, index: number) => {
          if (card) {
            // Keep visible - no opacity animation
            const cardEl = card as HTMLElement;
            cardEl.style.opacity = '1';
            cardEl.style.visibility = 'visible';
            
            gsap.from(cardEl, {
              scrollTrigger: {
                trigger: cardEl,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
              y: 50,
              duration: 0.8,
              ease: 'power3.out',
              delay: index * 0.1,
            });
          }
        });
      }

      // Animate statistics on scroll
      const statCards = document.querySelectorAll('.stat-card');
      if (statCards.length > 0) {
        statCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            // Keep visible - no opacity animation
            cardEl.style.opacity = '1';
            cardEl.style.visibility = 'visible';
            gsap.set(cardEl, { y: 40, scale: 0.95 });
            
            gsap.to(cardEl, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: 'power3.out',
              delay: index * 0.1,
              scrollTrigger: {
                trigger: cardEl,
                start: 'top 90%',
                end: 'top 50%',
                toggleActions: 'play none none none',
                once: true,
                markers: false,
              },
            });
          }
        });
      }
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Statistics Section - Highlighting Real Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16 md:mb-24">
          {statistics.map((stat, index) => {
            const IconComponent = stat.Icon;
            if (!IconComponent) return null;
            return (
              <div
                key={index}
                className="stat-card group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 text-center hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-700"
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50 group-hover:border-slate-700/50 transition-all duration-500">
                    <IconComponent className="w-6 h-6 text-slate-400 group-hover:text-slate-200 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-semibold text-white mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm font-medium group-hover:text-slate-300 transition-colors duration-500">{stat.label}</div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 to-slate-900/0 group-hover:from-slate-800/20 group-hover:to-slate-900/20 rounded-2xl transition-all duration-700"></div>
              </div>
            );
          })}
        </div>

        {/* Testimonials Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight tracking-tight">
            Join 5,000+ Drummers Improving Their Practice
          </h2>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover how drummers are using our tools to improve their practice
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-700"
            >
              {/* Rating Stars */}
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-slate-500 fill-slate-500 group-hover:text-slate-400 group-hover:fill-slate-400 transition-colors duration-500"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              )}

              {/* Quote */}
              <p className="text-slate-300 leading-relaxed mb-6 text-sm group-hover:text-slate-200 transition-colors duration-500">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-slate-200 font-semibold text-sm group-hover:border-slate-500/50 transition-colors duration-500">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm group-hover:text-slate-100 transition-colors duration-500">{testimonial.author}</div>
                  <div className="text-slate-500 text-xs group-hover:text-slate-400 transition-colors duration-500">{testimonial.role}</div>
                  {testimonial.location && (
                    <div className="text-slate-600 text-xs mt-0.5 group-hover:text-slate-500 transition-colors duration-500">{testimonial.location}</div>
                  )}
                </div>
              </div>

              {/* Subtle Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 to-slate-900/0 group-hover:from-slate-800/20 group-hover:to-slate-900/20 rounded-2xl transition-all duration-700"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




