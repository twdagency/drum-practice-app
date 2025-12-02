'use client';

import { useEffect, useRef } from 'react';
import { Users, Music2, Drum, Star } from 'lucide-react';

interface Statistic {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  suffix?: string;
}

const statistics: Statistic[] = [
  { value: '1000', label: 'Active Users', Icon: Users, suffix: '+' },
  { value: '10000', label: 'Patterns Created', Icon: Music2, suffix: '+' },
  { value: '50000', label: 'Practice Sessions', Icon: Drum, suffix: '+' },
  { value: '4.9', label: 'Average Rating', Icon: Star, suffix: '/5' },
];

export function StatisticsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

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

      // Animate statistics on scroll
      const statCards = document.querySelectorAll('.stat-item');
      statCards.forEach((card: Element, index: number) => {
        const valueElement = card.querySelector('.stat-number');
        if (!valueElement) return;

        const originalText = valueElement.textContent || '0';
        const numValue = parseFloat(originalText.replace(/[^0-9.]/g, '')) || 0;
        const suffix = statistics[index]?.suffix || '';

        ScrollTrigger.create({
          trigger: card as HTMLElement,
          start: 'top 85%',
          onEnter: () => {
            gsap.to({ value: 0 }, {
              value: numValue,
              duration: 2,
              ease: 'power2.out',
              onUpdate: function() {
                const current = this.targets()[0].value;
                let display: string;
                
                if (suffix.includes('/')) {
                  display = originalText; // Keep original for ratings like "4.9/5"
                } else if (numValue >= 1000) {
                  display = (Math.floor(current / 100) / 10).toFixed(1) + 'K' + suffix;
                } else {
                  display = Math.floor(current).toString() + suffix;
                }
                valueElement.textContent = display;
              },
            });
          },
        });

        // Card entrance animation
        gsap.from(card as HTMLElement, {
          scrollTrigger: {
            trigger: card as HTMLElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          delay: index * 0.1,
        });
      });
    });
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-purple-900/10 to-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {statistics.map((stat, index) => {
            const IconComponent = stat.Icon;
            return (
              <div
                key={index}
                className="stat-item group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 text-center hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-700"
              >
                <div className="flex justify-center mb-3">
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50 group-hover:border-slate-700/50 transition-all duration-500">
                    <IconComponent className="w-6 h-6 text-slate-400 group-hover:text-slate-200 transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="stat-number text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-2 tracking-tight">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-slate-400 text-sm md:text-base font-medium group-hover:text-slate-300 transition-colors duration-500">{stat.label}</div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 to-slate-900/0 group-hover:from-slate-800/20 group-hover:to-slate-900/20 rounded-2xl transition-all duration-700"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
