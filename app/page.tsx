'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SignInModal } from '@/components/auth/SignInModal';
import { SignUpModal } from '@/components/auth/SignUpModal';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { SocialProof } from '@/components/landing/SocialProof';
import { InteractiveDemo } from '@/components/landing/InteractiveDemo';
// GSAP will be loaded dynamically in useEffect

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

      // Hero animations
      const ctx = gsap.context(() => {
      // Animate hero elements on load
      const tl = gsap.timeline();
      
      tl.from(titleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
      })
      .from(subtitleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      }, '-=0.5')
      .from(ctaRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.15,
      }, '-=0.3');

      // Parallax layers for background
      const parallaxLayers = [
        { selector: '.parallax-layer-1', speed: 0.5 },
        { selector: '.parallax-layer-2', speed: 0.3 },
        { selector: '.parallax-layer-3', speed: 0.7 },
      ];

      parallaxLayers.forEach((layer) => {
        const elements = document.querySelectorAll(layer.selector);
        elements.forEach((element: Element) => {
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
        });
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

      // Features scroll animations
      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach((card: Element, index: number) => {
        gsap.from(card as HTMLElement, {
          scrollTrigger: {
            trigger: card as HTMLElement,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.1,
        });
      });

      // Pricing cards animation
      const pricingCards = document.querySelectorAll('.pricing-card');
      pricingCards.forEach((card: Element, index: number) => {
        gsap.from(card as HTMLElement, {
          scrollTrigger: {
            trigger: card as HTMLElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
          scale: 0.8,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
          delay: index * 0.1,
        });
      });

      // Floating animation for particles
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

      // Animated gradient background
      gsap.to('.gradient-bg', {
        backgroundPosition: '200% 200%',
        duration: 10,
        ease: 'none',
        repeat: -1,
      });

      // Magnetic button effect (desktop only)
      if (window.innerWidth >= 768) {
        const magneticButtons = document.querySelectorAll('.magnetic-button');
        magneticButtons.forEach((button: Element) => {
          const btn = button as HTMLElement;
          btn.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
              x: x * 0.3,
              y: y * 0.3,
              duration: 0.3,
              ease: 'power2.out',
            });
          });
          
          btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.5,
              ease: 'elastic.out(1, 0.5)',
            });
          });
        });
      }

      });

      return () => {
        if (ctx) ctx.revert();
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Gradient with Parallax Layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-900/20 to-blue-900/20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] parallax-layer-1"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)] parallax-layer-2"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.08),transparent_50%)] parallax-layer-3"></div>
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 gradient-bg opacity-30" style={{
          background: 'linear-gradient(45deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1), rgba(236,72,153,0.1))',
          backgroundSize: '200% 200%',
        }}></div>
      </div>

      {/* Navigation */}
      <nav 
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                <span className="hidden sm:inline">🥁 </span>
                <span className="hidden sm:inline">Drum Practice Generator</span>
                <span className="sm:hidden">🥁 DPG</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {status === 'loading' ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-500"></div>
              ) : session?.user ? (
                <>
                  <Link
                    href="/app"
                    className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors"
                  >
                    Go to App
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
                  >
                    View Pricing
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split Screen */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-20 overflow-hidden"
      >
        {/* Animated particles/dots background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full floating-element hidden md:block"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
          {/* Fewer particles on mobile */}
          {[...Array(25)].map((_, i) => (
            <div
              key={`mobile-${i}`}
              className="absolute w-1 h-1 bg-white/20 rounded-full floating-element md:hidden"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Split Layout Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-5rem)]">
            {/* Left Side - Content */}
            <div className="text-left space-y-8">
              <div>
                <h1 
                  ref={titleRef}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Master Drum
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Patterns
                  </span>
                </h1>
                <p 
                  ref={subtitleRef}
                  className="text-lg md:text-xl lg:text-2xl text-white/70 max-w-xl leading-relaxed"
                >
                  Create custom drum patterns, practice with <span className="text-blue-400 font-semibold">MIDI</span> or <span className="text-purple-400 font-semibold">microphone</span>, and improve your skills with real-time feedback
                </p>
              </div>

              <div 
                ref={ctaRef}
                className="flex flex-col sm:flex-row gap-4"
              >
                {session?.user ? (
                  <>
                  <Link
                    href="/app"
                    className="magnetic-button group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm sm:text-base transition-all shadow-2xl shadow-purple-500/50 overflow-hidden active:scale-95"
                  >
                    <span className="relative z-10">Open App</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                    <Link
                      href="/pricing"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white rounded-xl font-bold text-sm sm:text-base transition-all hover:bg-white/20 hover:border-white/40 active:scale-95"
                    >
                      View Pricing
                    </Link>
                  </>
                ) : (
                  <>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="magnetic-button group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm sm:text-base transition-all shadow-2xl shadow-purple-500/50 overflow-hidden active:scale-95"
                  >
                    <span className="relative z-10">Start Free Trial</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                    <Link
                      href="/pricing"
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white rounded-xl font-bold text-sm sm:text-base transition-all hover:bg-white/20 hover:border-white/40 active:scale-95"
                    >
                      View Pricing
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 items-center pt-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Side - Product Preview */}
            <div className="hidden lg:block relative">
              <ProductPreview />
            </div>

            {/* Mobile Product Preview - Shown below content */}
            <div className="lg:hidden relative mt-12">
              <ProductPreview />
            </div>
          </div>

          {/* Scroll indicator - Mobile only */}
          <div className="lg:hidden mt-12 flex flex-col items-center">
            <p className="text-white/50 text-sm mb-4">Scroll to explore</p>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
            </div>
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
        className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 md:mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
              Powerful Features
            </h2>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Everything you need to create, practice, and master drum patterns
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: '🎵',
                title: 'Professional Notation',
                description: 'Create and view drum patterns with professional VexFlow notation. Export to MIDI, SVG, PNG, or PDF.',
                gradient: 'from-blue-500 to-cyan-500',
                details: 'Industry-standard rendering with precise note placement and timing.',
              },
              {
                icon: '🎹',
                title: 'MIDI & Microphone Practice',
                description: 'Practice with MIDI drum pads or use your microphone for real-time feedback and accuracy analysis.',
                gradient: 'from-purple-500 to-pink-500',
                details: 'Real-time accuracy tracking with detailed performance metrics.',
              },
              {
                icon: '🎯',
                title: 'Custom Pattern Creation',
                description: 'Build custom patterns with voicing, sticking, accents, ghost notes, and ornaments.',
                gradient: 'from-pink-500 to-red-500',
                details: 'Advanced editing tools for complete creative control.',
              },
              {
                icon: '📊',
                title: 'Progress Tracking',
                description: 'Track your practice sessions with detailed statistics, accuracy metrics, and progress goals.',
                gradient: 'from-cyan-500 to-blue-500',
                details: 'Visual progress charts and session history tracking.',
              },
              {
                icon: '🔄',
                title: 'Advanced Polyrhythms',
                description: 'Create and practice complex polyrhythmic patterns with multiple time signatures.',
                gradient: 'from-indigo-500 to-purple-500',
                details: 'Master complex rhythm patterns with visual guides.',
              },
              {
                icon: '📚',
                title: '175+ Preset Patterns',
                description: 'Browse a library of preset patterns covering various styles and difficulty levels.',
                gradient: 'from-violet-500 to-purple-500',
                details: 'Carefully curated patterns from beginner to advanced.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="feature-card group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:border-white/20 overflow-hidden"
              >
                <div className={`text-4xl md:text-5xl mb-4 md:mb-6 inline-block p-3 md:p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-80 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed text-sm md:text-base mb-3">
                  {feature.description}
                </p>
                {/* Hover reveal details */}
                <div className="max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-500">
                  <p className="text-white/50 text-xs md:text-sm mt-2">
                    {feature.details}
                  </p>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}></div>
                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section 
        ref={pricingRef}
        className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-purple-900/10 to-black"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 md:mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
              Simple Pricing
            </h2>
            <p className="text-lg md:text-xl text-white/60">
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
                gradient: 'from-gray-700 to-gray-800',
                popular: false,
              },
              {
                name: 'Monthly',
                price: '£9.99',
                period: 'per month',
                features: ['Unlimited patterns', 'All practice modes', 'Export options', 'Advanced features'],
                cta: 'Subscribe',
                href: '/pricing',
                gradient: 'from-blue-700 to-blue-800',
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
                gradient: 'from-purple-600 via-pink-600 to-purple-600',
                popular: true,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`pricing-card relative ${plan.popular ? 'lg:-mt-8 lg:mb-8 sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`relative bg-gradient-to-br ${plan.gradient} rounded-3xl p-8 border-2 ${plan.popular ? 'border-purple-400 shadow-2xl shadow-purple-500/50' : 'border-white/20'} hover:scale-105 transition-transform duration-300`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <h3 className="text-3xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-5xl font-black text-white mb-2">{plan.price}</div>
                  {plan.savings && (
                    <p className="text-green-400 font-semibold mb-4">{plan.savings}</p>
                  )}
                  <p className="text-white/60 mb-8">{plan.period}</p>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-white/80">
                        <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`block w-full text-center py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                      plan.popular
                        ? 'bg-white text-purple-600 hover:bg-gray-100 shadow-lg'
                        : 'bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="text-white/60 hover:text-white transition-colors font-medium inline-flex items-center gap-2"
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
      <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 text-white leading-tight">
                Ready to Improve Your Drumming?
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl mb-8 md:mb-10 text-white/90 leading-relaxed">
                Join drummers who are already using Drum Practice Generator to master their craft
              </p>
              {session?.user ? (
                <Link
                  href="/app"
                  className="inline-block px-12 py-5 bg-white text-purple-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
                >
                  Open App
                </Link>
              ) : (
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-12 py-5 bg-white text-purple-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
                >
                  Start Free Trial
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            <div>
              <h3 className="text-white font-bold text-xl mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Drum Practice Generator
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Professional drum pattern creation and practice tool with MIDI support and real-time feedback.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/app" className="text-white/60 hover:text-white transition-colors">App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:support@example.com" className="text-white/60 hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/" className="text-white/60 hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                {session?.user ? (
                  <>
                    <li><Link href="/app" className="text-white/60 hover:text-white transition-colors">Dashboard</Link></li>
                    <li><Link href="/pricing" className="text-white/60 hover:text-white transition-colors">Manage Subscription</Link></li>
                  </>
                ) : (
                  <>
                    <li><button onClick={() => setShowSignIn(true)} className="text-white/60 hover:text-white transition-colors">Sign In</button></li>
                    <li><button onClick={() => setShowSignUp(true)} className="text-white/60 hover:text-white transition-colors">Sign Up</button></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/60">
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
