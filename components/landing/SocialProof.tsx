'use client';

import { useEffect, useRef, useState } from 'react';

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
  icon: string;
}

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

const statistics: Statistic[] = [
  { value: '1,000+', label: 'Active Users', icon: '👥' },
  { value: '10,000+', label: 'Patterns Created', icon: '🎵' },
  { value: '50,000+', label: 'Practice Sessions', icon: '🥁' },
  { value: '4.9/5', label: 'Average Rating', icon: '⭐' },
];

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

      // Count-up animation for statistics
      const statCards = document.querySelectorAll('.stat-card');
      if (statCards.length > 0) {
        statCards.forEach((card: Element) => {
          if (!card) return;
          
          const statValue = card.querySelector('.stat-value');
          if (!statValue) return;

          const originalValue = statValue.textContent || '0';
          const numValue = parseInt(originalValue.replace(/\D/g, '')) || 0;
          const hasPlus = originalValue.includes('+');
          const hasSlash = originalValue.includes('/');

          ScrollTrigger.create({
            trigger: card as HTMLElement,
            start: 'top 85%',
            onEnter: () => {
              gsap.to({ value: 0 }, {
                value: numValue,
                duration: 2,
                ease: 'power2.out',
                onUpdate: function() {
                  const current = Math.floor(this.targets()[0].value);
                  let display = current.toString();
                  if (hasPlus) display += '+';
                  if (hasSlash && originalValue.includes('/')) {
                    display = originalValue; // Keep original for ratings like "4.9/5"
                  }
                  if (statValue) {
                    statValue.textContent = display;
                  }
                },
              });
            },
          });
        });
      }
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-purple-900/10 to-black">
      <div className="max-w-7xl mx-auto">
        {/* Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16 md:mb-24">
          {statistics.map((stat, index) => (
            <div
              key={index}
              className="stat-card group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="stat-value text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-white/60 text-sm font-medium">{stat.label}</div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
            </div>
          ))}
        </div>

        {/* Testimonials Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
            Loved by Drummers Worldwide
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Join thousands of musicians improving their skills every day
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="testimonial-card group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20"
            >
              {/* Rating Stars */}
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}

              {/* Quote */}
              <p className="text-white/80 leading-relaxed mb-6 text-sm">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{testimonial.author}</div>
                  <div className="text-white/50 text-xs">{testimonial.role}</div>
                </div>
              </div>

              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
