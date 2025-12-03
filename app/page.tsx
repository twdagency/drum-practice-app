'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SignInModal } from '@/components/auth/SignInModal';
import { SignUpModal } from '@/components/auth/SignUpModal';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { SocialProof } from '@/components/landing/SocialProof';
import { InteractiveDemo } from '@/components/landing/InteractiveDemo';
import { 
  Music, 
  Piano, 
  Target, 
  BarChart3, 
  Repeat, 
  BookOpen,
  CheckCircle2
} from 'lucide-react';
// GSAP will be loaded dynamically in useEffect

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ctx: any = null;

    // Dynamically import GSAP (will be available after npm install)
    Promise.all([
      // @ts-ignore - GSAP will be installed
      import('gsap'),
      // @ts-ignore - GSAP will be installed
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      
      gsap.registerPlugin(ScrollTrigger);

      // Wait for DOM to be fully ready
      requestAnimationFrame(() => {
        // Hero animations
        ctx = gsap.context(() => {
      // Animate hero elements on load
      const tl = gsap.timeline();
      
      // Badge animation
      if (badgeRef.current) {
        tl.from(badgeRef.current, {
          y: -20,
          opacity: 0,
          scale: 0.8,
          duration: 0.8,
          ease: 'back.out(1.7)',
        });
      }
      
      // Title animation
      if (titleRef.current) {
        tl.from(titleRef.current, {
          y: 100,
          opacity: 0,
          duration: 1.2,
          ease: 'power4.out',
        }, '-=0.3');
      }
      
      // Subtitle animation
      if (subtitleRef.current) {
        tl.from(subtitleRef.current, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        }, '-=0.5');
      }
      
      // CTA buttons animation
      if (ctaRef.current && ctaRef.current.children.length > 0) {
        tl.from(Array.from(ctaRef.current.children), {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.15,
        }, '-=0.3');
      }

      // Parallax layers for background
      const parallaxLayers = [
        { selector: '.parallax-layer-1', speed: 0.5 },
        { selector: '.parallax-layer-2', speed: 0.3 },
        { selector: '.parallax-layer-3', speed: 0.7 },
      ];

      parallaxLayers.forEach((layer) => {
        const elements = document.querySelectorAll(layer.selector);
        if (elements.length > 0) {
          elements.forEach((element: Element) => {
            if (element) {
              gsap.to(element as HTMLElement, {
                scrollTrigger: {
                  trigger: 'body',
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 1,
                },
                y: 100 * layer.speed,
                opacity: 0.3,
              });
            }
          });
        }
      });

      // Parallax effect for hero section
      if (heroRef.current) {
        gsap.to(heroRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
          y: 100,
          opacity: 0.3,
        });
      }

      // Navbar fade in on load
      if (navRef.current) {
        gsap.from(navRef.current, {
          y: -100,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
        });
      }

      // Features scroll animations with sophisticated effects
      const featureCards = document.querySelectorAll('.feature-card');
      if (featureCards.length > 0) {
        featureCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            // Mark as GSAP-initialized
            cardEl.setAttribute('data-gsap-initialized', 'true');
            // Set initial state
            gsap.set(cardEl, { opacity: 0, y: 60, scale: 0.95 });
            
            const animation = gsap.to(cardEl, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
              delay: index * 0.1,
              scrollTrigger: {
                trigger: cardEl,
                start: 'top 90%',
                end: 'top 50%',
                toggleActions: 'play none none none',
                once: true,
                markers: false,
                onEnter: () => {
                  cardEl.setAttribute('data-gsap-animated', 'true');
                },
              },
            });
            
            // Fallback: if ScrollTrigger doesn't fire within 3 seconds, make visible
            setTimeout(() => {
              if (!cardEl.getAttribute('data-gsap-animated')) {
                gsap.to(cardEl, {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.5,
                  ease: 'power2.out',
                });
                cardEl.setAttribute('data-gsap-animated', 'true');
              }
            }, 3000);
          }
        });
      }

      // Pricing cards animation with morphing effects
      const pricingCards = document.querySelectorAll('.pricing-card');
      if (pricingCards.length > 0) {
        pricingCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            // Mark as GSAP-initialized
            cardEl.setAttribute('data-gsap-initialized', 'true');
            // Set initial state
            gsap.set(cardEl, { opacity: 0, y: 80, scale: 0.9 });
            
            const animation = gsap.to(cardEl, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1,
              ease: 'power3.out',
              delay: index * 0.12,
              scrollTrigger: {
                trigger: cardEl,
                start: 'top 90%',
                end: 'top 50%',
                toggleActions: 'play none none none',
                once: true,
                markers: false,
                onEnter: () => {
                  cardEl.setAttribute('data-gsap-animated', 'true');
                },
              },
            });
            
            // Fallback: if ScrollTrigger doesn't fire within 3 seconds, make visible
            setTimeout(() => {
              if (!cardEl.getAttribute('data-gsap-animated')) {
                gsap.to(cardEl, {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.5,
                  ease: 'power2.out',
                });
                cardEl.setAttribute('data-gsap-animated', 'true');
              }
            }, 3000);
          }
        });
      }

      // Animate SocialProof section elements
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

      // Animate testimonial cards
      const testimonialCards = document.querySelectorAll('.testimonial-card');
      if (testimonialCards.length > 0) {
        testimonialCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            gsap.set(cardEl, { opacity: 0, y: 50 });
            
            gsap.to(cardEl, {
              opacity: 1,
              y: 0,
              duration: 0.8,
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

      // Animate section headings
      const sectionHeadings = document.querySelectorAll('section h2');
      if (sectionHeadings.length > 0) {
        sectionHeadings.forEach((heading: Element) => {
          if (heading) {
            const headingEl = heading as HTMLElement;
            gsap.set(headingEl, { opacity: 0, y: 30 });
            
            gsap.to(headingEl, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: headingEl,
                start: 'top 90%',
                end: 'top 60%',
                toggleActions: 'play none none none',
                once: true,
                markers: false,
              },
            });
          }
        });
      }

      // Animate section descriptions
      const sectionDescriptions = document.querySelectorAll('section > div > p:first-of-type');
      if (sectionDescriptions.length > 0) {
        sectionDescriptions.forEach((desc: Element) => {
          const descEl = desc as HTMLElement;
          gsap.set(descEl, { opacity: 0, y: 20 });
          
          gsap.to(descEl, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            delay: 0.2,
            scrollTrigger: {
              trigger: descEl,
              start: 'top 90%',
              end: 'top 60%',
              toggleActions: 'play none none none',
              once: true,
              markers: false,
            },
          });
        });
      }

      // Floating animation for particles
      const floatingElements = document.querySelectorAll('.floating-element');
      if (floatingElements.length > 0) {
        gsap.to('.floating-element', {
          y: -30,
          duration: 3 + Math.random() * 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          stagger: {
            each: 0.1,
            from: 'random',
          },
        });
      }

      // Animated gradient background
      const gradientBg = document.querySelector('.gradient-bg');
      if (gradientBg) {
        gsap.to(gradientBg, {
          backgroundPosition: '200% 200%',
          duration: 10,
          ease: 'none',
          repeat: -1,
        });
      }

      // Magnetic button effect (desktop only)
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        const magneticButtons = document.querySelectorAll('.magnetic-button');
        if (magneticButtons.length > 0) {
          magneticButtons.forEach((button: Element) => {
            const btn = button as HTMLElement;
            if (!btn) return;
            
            const handleMouseMove = (e: MouseEvent) => {
              const rect = btn.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              
              gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out',
              });
            };
            
            const handleMouseLeave = () => {
              gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
              });
            };
            
            btn.addEventListener('mousemove', handleMouseMove);
            btn.addEventListener('mouseleave', handleMouseLeave);
            
            // Cleanup will be handled by gsap.context
          });
        }
      }

        });
      });
    });

    return () => {
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Sophisticated Background with Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950"></div>
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        ></div>
        
        {/* Subtle radial gradients for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_60%)] parallax-layer-1"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.06),transparent_60%)] parallax-layer-2"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,41,59,0.1),transparent_70%)] parallax-layer-3"></div>
        
        {/* Animated mesh gradient - very subtle */}
        <div className="absolute inset-0 gradient-bg opacity-10" style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.03), rgba(139,92,246,0.03), rgba(30,41,59,0.03))',
          backgroundSize: '200% 200%',
        }}></div>
      </div>

      {/* Premium Navigation */}
      <nav 
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-slate-900/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-18">
            <div className="flex items-center">
              <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold text-white hover:text-slate-200 transition-colors tracking-tight">
                Drum Practice Generator
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {status === 'loading' ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-slate-400"></div>
              ) : session?.user ? (
                <>
                  <Link
                    href="/app"
                    className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors rounded-lg hover:bg-slate-800/50"
                  >
                    Go to App
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl"
                  >
                    View Pricing
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="px-4 py-2 text-slate-300 hover:text-white text-sm font-medium transition-colors rounded-lg hover:bg-slate-800/50"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Modern Centered Layout */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 overflow-hidden"
      >
        {/* Subtle animated orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
          <div className="space-y-16 md:space-y-20">
            {/* Badge - with padding from top */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-slate-300 font-medium">Trusted by 1,000+ drummers</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 
                ref={titleRef}
                className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold leading-[1.1] tracking-tight"
              >
                <span className="block text-white">
                  Master Drum
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300">
                  Patterns
                </span>
              </h1>
              
              <p 
                ref={subtitleRef}
                className="text-xl sm:text-2xl md:text-3xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Professional drum pattern creation and practice tool with <span className="text-slate-200 font-normal">real-time feedback</span> and <span className="text-slate-200 font-normal">advanced notation</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {session?.user ? (
                <>
                  <Link
                    href="/app"
                    className="magnetic-button group relative px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-base transition-all shadow-2xl shadow-slate-900/30 hover:shadow-slate-900/50 hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10">Open App</span>
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-8 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-white rounded-xl font-semibold text-base transition-all hover:bg-slate-800/70 hover:border-slate-600/50"
                  >
                    View Pricing
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="magnetic-button group relative px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-base transition-all shadow-2xl shadow-slate-900/30 hover:shadow-slate-900/50 hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10">Start Free Trial</span>
                  </button>
                  <Link
                    href="/pricing"
                    className="px-8 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-white rounded-xl font-semibold text-base transition-all hover:bg-slate-800/70 hover:border-slate-600/50"
                  >
                    View Pricing
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 items-center justify-center pt-8">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>14-day free trial</span>
              </div>
            </div>
          </div>

          {/* Product Preview - Below hero content */}
          <div className="mt-20 lg:mt-32">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Social Proof Section (includes statistics) */}
      <SocialProof />

      {/* Interactive Demo Section */}
      <InteractiveDemo />

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="relative py-32 md:py-40 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 md:mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-white leading-tight tracking-tight">
              Powerful Features
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to create, practice, and master drum patterns
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                Icon: Music,
                title: 'Professional Notation',
                description: 'Create and view drum patterns with professional VexFlow notation. Export to MIDI, SVG, PNG, or PDF.',
                details: 'Industry-standard rendering with precise note placement and timing.',
              },
              {
                Icon: Piano,
                title: 'MIDI & Microphone Practice',
                description: 'Practice with MIDI drum pads or use your microphone for real-time feedback and accuracy analysis.',
                details: 'Real-time accuracy tracking with detailed performance metrics.',
              },
              {
                Icon: Target,
                title: 'Custom Pattern Creation',
                description: 'Build custom patterns with voicing, sticking, accents, ghost notes, and ornaments.',
                details: 'Advanced editing tools for complete creative control.',
              },
              {
                Icon: BarChart3,
                title: 'Progress Tracking',
                description: 'Track your practice sessions with detailed statistics, accuracy metrics, and progress goals.',
                details: 'Visual progress charts and session history tracking.',
              },
              {
                Icon: Repeat,
                title: 'Advanced Polyrhythms',
                description: 'Create and practice complex polyrhythmic patterns with multiple time signatures.',
                details: 'Master complex rhythm patterns with visual guides.',
              },
              {
                Icon: BookOpen,
                title: '175+ Preset Patterns',
                description: 'Browse a library of preset patterns covering various styles and difficulty levels.',
                details: 'Carefully curated patterns from beginner to advanced.',
              },
            ].map((feature, index) => {
              const IconComponent = feature.Icon;
              return (
                <div
                  key={index}
                  className="feature-card group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-700 overflow-hidden"
                >
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 via-slate-800/0 to-slate-900/0 group-hover:from-slate-800/20 group-hover:via-slate-800/10 group-hover:to-slate-900/20 transition-all duration-700 rounded-2xl"></div>
                  
                  {/* Icon container */}
                  <div className="relative mb-6 bg-slate-900/50 rounded-xl p-4 w-fit border border-slate-800/50 group-hover:border-slate-700/50 transition-all duration-500 group-hover:scale-105">
                    <IconComponent className="w-6 h-6 text-slate-400 group-hover:text-slate-200 transition-colors duration-500" strokeWidth={1.5} />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent rounded-xl transition-all duration-500"></div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3 relative z-10 group-hover:text-slate-100 transition-colors duration-500">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm mb-4 relative z-10 group-hover:text-slate-300 transition-colors duration-500">
                    {feature.description}
                  </p>
                  
                  {/* Hover reveal details */}
                  <div className="relative z-10 max-h-0 overflow-hidden group-hover:max-h-24 transition-all duration-700 ease-out">
                    <p className="text-slate-500 text-xs mt-2 group-hover:text-slate-400 transition-colors duration-500">
                      {feature.details}
                    </p>
                  </div>
                  
                  {/* Sophisticated shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[2000ms] ease-in-out"></div>
                  </div>
                  
                  {/* Subtle border glow */}
                  <div className="absolute inset-0 rounded-2xl border border-slate-800/0 group-hover:border-slate-700/30 transition-all duration-700 pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section 
        ref={pricingRef}
        className="relative py-32 md:py-40 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 md:mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-white leading-tight tracking-tight">
              Simple Pricing
            </h2>
            <p className="text-xl md:text-2xl text-slate-400">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Free',
                price: '£0',
                period: 'Forever',
                features: ['5 patterns', 'Basic practice modes', 'Progress tracking'],
                cta: 'Get Started Free',
                href: '/app',
                popular: false,
              },
              {
                name: 'Monthly',
                price: '£9.99',
                period: 'per month',
                features: ['Unlimited patterns', 'All practice modes', 'Export options', 'Advanced features'],
                cta: 'Subscribe',
                href: '/pricing',
                popular: false,
              },
              {
                name: 'Yearly',
                price: '£99.99',
                period: 'per year',
                badge: 'Most Popular',
                savings: 'Save 17%',
                features: ['Everything in Monthly', 'Priority support', 'Best value'],
                cta: 'Subscribe',
                href: '/pricing',
                popular: true,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`pricing-card relative group ${plan.popular ? 'lg:-mt-8 lg:mb-8 sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`relative bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border ${plan.popular ? 'border-slate-700/50 shadow-2xl shadow-slate-900/50' : 'border-slate-800/50'} hover:border-slate-700/70 transition-all duration-500`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-slate-800 text-slate-200 px-5 py-1.5 rounded-full text-xs font-medium border border-slate-700/50 shadow-lg backdrop-blur-sm">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  
                  {/* Subtle gradient overlay */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${plan.popular ? 'bg-gradient-to-br from-slate-800/30 via-slate-900/20 to-slate-900/30' : 'bg-gradient-to-br from-slate-800/20 to-slate-900/20'}`}></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                    <div className="text-5xl font-semibold text-white mb-2 tracking-tight">{plan.price}</div>
                    {plan.savings && (
                      <p className="text-slate-400 text-sm font-medium mb-4">{plan.savings}</p>
                    )}
                    <p className="text-slate-500 mb-8 text-sm">{plan.period}</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-slate-500 mr-3 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className={`block w-full text-center py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
                        plan.popular
                          ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-slate-900/20'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-slate-600/50'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                  
                  {/* Sophisticated shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[2000ms] ease-in-out"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              href="/pricing"
              className="text-slate-400 hover:text-slate-200 transition-colors font-medium inline-flex items-center gap-2"
            >
              View detailed pricing and features
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 md:py-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-900/20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight tracking-tight">
                Ready to Improve Your Drumming?
              </h2>
              <p className="text-xl md:text-2xl mb-10 text-slate-300 leading-relaxed">
                Join drummers who are already using Drum Practice Generator to master their craft
              </p>
              {session?.user ? (
                <Link
                  href="/app"
                  className="inline-block px-12 py-5 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all shadow-xl shadow-slate-900/20"
                >
                  Open App
                </Link>
              ) : (
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-12 py-5 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all shadow-xl shadow-slate-900/20"
                >
                  Start Free Trial
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">
                Drum Practice Generator
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Professional drum pattern creation and practice tool with MIDI support and real-time feedback.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-slate-200 transition-colors">Pricing</Link></li>
                <li><Link href="/app" className="text-slate-400 hover:text-slate-200 transition-colors">App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:support@example.com" className="text-slate-400 hover:text-slate-200 transition-colors">Contact</a></li>
                <li><Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                {session?.user ? (
                  <>
                    <li><Link href="/app" className="text-slate-400 hover:text-slate-200 transition-colors">Dashboard</Link></li>
                    <li><Link href="/pricing" className="text-slate-400 hover:text-slate-200 transition-colors">Manage Subscription</Link></li>
                  </>
                ) : (
                  <>
                    <li><button onClick={() => setShowSignIn(true)} className="text-slate-400 hover:text-slate-200 transition-colors">Sign In</button></li>
                    <li><button onClick={() => setShowSignUp(true)} className="text-slate-400 hover:text-slate-200 transition-colors">Sign Up</button></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/50 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Drum Practice Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSwitchToSignUp={() => {
            setShowSignIn(false);
            setShowSignUp(true);
          }}
        />
      )}

      {showSignUp && (
        <SignUpModal
          onClose={() => setShowSignUp(false)}
          onSwitchToSignIn={() => {
            setShowSignUp(false);
            setShowSignIn(true);
          }}
        />
      )}
    </div>
  );
}