'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, Music2, Download, Piano, Mic } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
}

interface Statistic {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const statistics: Statistic[] = [
  { value: '175+', label: 'Preset Patterns', Icon: Music2 },
  { value: '5', label: 'Export Formats', Icon: Download },
  { value: '2', label: 'Practice Modes', Icon: Piano }, // MIDI + Microphone
  { value: 'Free', label: 'Tier Available', Icon: Star },
];

const testimonials: Testimonial[] = [
  {
    quote: 'This app transformed my practice routine. The notation feature is incredibly accurate and the MIDI support makes it feel like a real practice pad.',
    author: 'Alex Johnson',
    role: 'Professional Drummer',
    rating: 5,
  },
  {
    quote: 'As a music student, having access to professional notation and custom patterns has accelerated my learning. The progress tracking keeps me motivated.',
    author: 'Sarah Chen',
    role: 'Music Student',
    rating: 5,
  },
  {
    quote: 'Best drum practice tool I\'ve used. The ability to create complex polyrhythms and export patterns makes it perfect for my band\'s songwriting.',
    author: 'Mike Rodriguez',
    role: 'Band Member',
    rating: 5,
  },
  {
    quote: 'The microphone practice mode is a game-changer. Real-time feedback helps me identify areas for improvement immediately.',
    author: 'Emma Davis',
    role: 'Drum Teacher',
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
            gsap.from(card as HTMLElement, {
              scrollTrigger: {
                trigger: card as HTMLElement,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
              y: 50,
              opacity: 0,
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
            gsap.set(cardEl, { opacity: 0, y: 40, scale: 0.95 });
            
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
            What Musicians Are Saying
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
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-300 font-semibold text-sm group-hover:border-slate-600/50 transition-colors duration-500">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-medium text-sm group-hover:text-slate-100 transition-colors duration-500">{testimonial.author}</div>
                  <div className="text-slate-500 text-xs group-hover:text-slate-400 transition-colors duration-500">{testimonial.role}</div>
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
