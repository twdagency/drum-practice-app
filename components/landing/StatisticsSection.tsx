'use client';

import { useEffect, useRef } from 'react';

interface Statistic {
  value: string;
  label: string;
  icon: string;
  suffix?: string;
}

const statistics: Statistic[] = [
  { value: '1000', label: 'Active Users', icon: '👥', suffix: '+' },
  { value: '10000', label: 'Patterns Created', icon: '🎵', suffix: '+' },
  { value: '50000', label: 'Practice Sessions', icon: '🥁', suffix: '+' },
  { value: '4.9', label: 'Average Rating', icon: '⭐', suffix: '/5' },
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
          {statistics.map((stat, index) => (
            <div
              key={index}
              className="stat-item group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20"
            >
              <div className="text-4xl md:text-5xl mb-3">{stat.icon}</div>
              <div className="stat-number text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-white/60 text-sm md:text-base font-medium">{stat.label}</div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
