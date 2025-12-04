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

// Note: SEO metadata should be added via next/head or in a server component wrapper
// For now, we'll ensure proper heading hierarchy and ARIA labels in the component

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [isClient, setIsClient] = useState(false);
  
  // Prevent hydration mismatch - only render session-dependent content after client mount
  // This prevents button text flashing from "Start Trial" to "Open App"
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Continuous visibility check - ensures elements stay visible even if GSAP hides them
  useEffect(() => {
    const ensureVisible = () => {
      // Force navbar to always be visible
      if (navRef.current) {
        const computed = getComputedStyle(navRef.current);
        if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
          navRef.current.style.opacity = '1';
          navRef.current.style.visibility = 'visible';
          navRef.current.style.display = 'block';
        }
        // Reset any transforms that might move navbar off-screen (especially negative translateY)
        if (computed.transform && computed.transform !== 'none') {
          // Check if transform has negative translateY which would move navbar up
          const rect = navRef.current.getBoundingClientRect();
          if (rect.top < 0 || (computed.transform.includes('translateY') && computed.transform.includes('-'))) {
            navRef.current.style.transform = 'none';
          }
        }
      }
      // Force visibility on all hero elements
      if (badgeRef.current) {
        const computed = getComputedStyle(badgeRef.current);
        if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
          badgeRef.current.style.opacity = '1';
          badgeRef.current.style.visibility = 'visible';
        }
      }
      if (titleRef.current) {
        const computed = getComputedStyle(titleRef.current);
        if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
          titleRef.current.style.opacity = '1';
          titleRef.current.style.visibility = 'visible';
          titleRef.current.style.display = 'block';
        }
        // Ensure child spans are visible
        const spans = titleRef.current.querySelectorAll('span');
        spans.forEach(span => {
          const spanEl = span as HTMLElement;
          const spanComputed = getComputedStyle(spanEl);
          if (spanComputed.opacity === '0' || parseFloat(spanComputed.opacity) < 0.1) {
            spanEl.style.opacity = '1';
            spanEl.style.visibility = 'visible';
            spanEl.style.display = 'block';
          }
        });
      }
      if (subtitleRef.current) {
        const computed = getComputedStyle(subtitleRef.current);
        if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
          subtitleRef.current.style.opacity = '1';
          subtitleRef.current.style.visibility = 'visible';
        }
      }
      if (ctaRef.current) {
        Array.from(ctaRef.current.children).forEach((child: Element) => {
          const el = child as HTMLElement;
          const computed = getComputedStyle(el);
          if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
          }
        });
      }
    };
    
    // Run immediately and multiple times to catch any GSAP hiding
    ensureVisible();
    setTimeout(ensureVisible, 50);
    setTimeout(ensureVisible, 100);
    setTimeout(ensureVisible, 200);
    
    // Run periodically to catch any GSAP hiding
    const interval = setInterval(ensureVisible, 200);
    
    // AGGRESSIVE: Force ALL elements visible immediately and continuously
    const forceAllVisible = () => {
      // Force ALL elements visible - no exceptions
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl) {
          const computed = getComputedStyle(htmlEl);
          if (computed.opacity === '0' || parseFloat(computed.opacity) < 0.1) {
            htmlEl.style.setProperty('opacity', '1', 'important');
            htmlEl.style.setProperty('visibility', 'visible', 'important');
          }
          // Force visibility on critical elements regardless
          if (htmlEl.tagName === 'H1' || htmlEl.tagName === 'H2' || htmlEl.tagName === 'H3' || 
              htmlEl.tagName === 'P' || htmlEl.tagName === 'SECTION' || htmlEl.tagName === 'NAV' ||
              htmlEl.classList.contains('feature-card') || htmlEl.classList.contains('pricing-card') ||
              htmlEl.classList.contains('stat-card') || htmlEl.classList.contains('testimonial-card') ||
              htmlEl.classList.contains('ProductPreview') || htmlEl.classList.contains('SocialProof') ||
              htmlEl.classList.contains('InteractiveDemo')) {
            htmlEl.style.setProperty('opacity', '1', 'important');
            htmlEl.style.setProperty('visibility', 'visible', 'important');
            htmlEl.style.setProperty('display', 'block', 'important');
          }
        }
      });
      
      // Specifically target ProductPreview, header, testimonials, etc.
      const specificSelectors = [
        '[class*="ProductPreview"]',
        'nav',
        'header',
        '[class*="SocialProof"]',
        '[class*="testimonial"]',
        '[class*="InteractiveDemo"]',
        'section',
        'h1', 'h2', 'h3',
        '.feature-card',
        '.pricing-card',
        '.stat-card',
        '.testimonial-card'
      ];
      
      specificSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl) {
              htmlEl.style.setProperty('opacity', '1', 'important');
              htmlEl.style.setProperty('visibility', 'visible', 'important');
            }
          });
        } catch (e) {
          // Ignore selector errors
        }
      });
    };
    
    // Run immediately and aggressively
    forceAllVisible();
    setTimeout(forceAllVisible, 10);
    setTimeout(forceAllVisible, 50);
    setTimeout(forceAllVisible, 100);
    setTimeout(forceAllVisible, 200);
    setTimeout(forceAllVisible, 500);
    setTimeout(forceAllVisible, 1000);
    
    // Run continuously
    const forceInterval = setInterval(forceAllVisible, 100);
    
    return () => {
      clearInterval(interval);
      clearInterval(forceInterval);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ctx: any = null;
    let isInitialized = false;

    // Ensure elements are visible BEFORE attempting GSAP animations
    // This prevents the "flash of hidden content"
    const ensureElementsVisible = () => {
      if (navRef.current) {
        navRef.current.style.opacity = '1';
        navRef.current.style.visibility = 'visible';
        navRef.current.style.display = 'block';
        navRef.current.style.transform = 'none';
      }
      if (badgeRef.current) badgeRef.current.style.opacity = '1';
      if (titleRef.current) {
        titleRef.current.style.opacity = '1';
        titleRef.current.querySelectorAll('span').forEach((span: Element) => {
          (span as HTMLElement).style.opacity = '1';
        });
      }
      if (subtitleRef.current) subtitleRef.current.style.opacity = '1';
      if (ctaRef.current) {
        Array.from(ctaRef.current.children).forEach((child: Element) => {
          (child as HTMLElement).style.opacity = '1';
        });
      }
    };
    
    ensureElementsVisible();

    // GSAP animations are now enabled - elements are kept visible and only transforms are animated
    
    // Dynamically import GSAP - make it optional (elements stay visible if it fails)
    Promise.all([
      // @ts-ignore - GSAP will be installed
      import('gsap'),
      // @ts-ignore - GSAP will be installed
      import('gsap/ScrollTrigger'),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      if (isInitialized) {
        return;
      }
      
      try {
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        
        gsap.registerPlugin(ScrollTrigger);
        (window as any).__gsapInitialized = true;

        // Wait for DOM to be fully ready and ensure ScrollTrigger is ready
        requestAnimationFrame(() => {
          try {
            // Refresh ScrollTrigger to ensure it's ready
            ScrollTrigger.refresh();
            
            // Hero animations
            ctx = gsap.context(() => {
              isInitialized = true;
      // Animate hero elements on load
      const tl = gsap.timeline();
      
      // Hero animations - keep opacity at 1, only animate position/scale
      if (badgeRef.current) {
        badgeRef.current.style.opacity = '1';
        badgeRef.current.style.visibility = 'visible';
        gsap.fromTo(badgeRef.current, 
          { y: -20, scale: 0.8 },
          {
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(1.7)',
          }
        );
      }
      
      // Title animation - keep visible, just animate position
      if (titleRef.current) {
        titleRef.current.style.opacity = '1';
        titleRef.current.style.visibility = 'visible';
        // Ensure child spans are also visible
        const spans = titleRef.current.querySelectorAll('span');
        spans.forEach(span => {
          (span as HTMLElement).style.opacity = '1';
          (span as HTMLElement).style.visibility = 'visible';
          (span as HTMLElement).style.display = 'block';
        });
        gsap.fromTo(titleRef.current,
          { y: 50 },
          {
            y: 0,
            duration: 1.2,
            ease: 'power4.out',
            delay: 0.1,
          }
        );
      }
      
      // Subtitle animation - keep visible, just animate position
      if (subtitleRef.current) {
        subtitleRef.current.style.opacity = '1';
        subtitleRef.current.style.visibility = 'visible';
        gsap.fromTo(subtitleRef.current,
          { y: 30 },
          {
            y: 0,
            duration: 1,
            ease: 'power3.out',
            delay: 0.3,
          }
        );
      }
      
      // CTA buttons animation - keep visible, just animate position
      if (ctaRef.current && ctaRef.current.children.length > 0) {
        Array.from(ctaRef.current.children).forEach((child: Element) => {
          const el = child as HTMLElement;
          el.style.opacity = '1';
          el.style.visibility = 'visible';
        });
        gsap.fromTo(Array.from(ctaRef.current.children),
          { y: 20 },
          {
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.15,
            delay: 0.5,
          }
        );
      }

      // Parallax layers for background - don't change opacity
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
              const el = element as HTMLElement;
              el.style.opacity = '1'; // Keep visible
              gsap.to(el, {
                scrollTrigger: {
                  trigger: 'body',
                  start: 'top top',
                  end: 'bottom top',
                  scrub: 1,
                },
                y: 100 * layer.speed,
                // Removed opacity animation
              });
            }
          });
        }
      });

      // Parallax effect for hero section - don't change opacity
      if (heroRef.current) {
        heroRef.current.style.opacity = '1'; // Keep visible
        gsap.to(heroRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
          y: 100,
          // Removed opacity animation
        });
      }

      // Navbar - keep visible at all times, no animation that could hide it
      if (navRef.current) {
        // Ensure navbar is always visible and in correct position
        navRef.current.style.opacity = '1';
        navRef.current.style.visibility = 'visible';
        navRef.current.style.display = 'block';
        navRef.current.style.transform = 'none'; // Remove any transforms
        navRef.current.style.top = '0'; // Ensure it's at the top
        
        // Just ensure it stays visible - skip animation for navbar to prevent hiding
      }

      // Features scroll animations with sophisticated effects
      const featureCards = document.querySelectorAll('.feature-card');
      if (featureCards.length > 0) {
        featureCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            
            // Ensure element is visible initially (CSS fallback)
            const currentOpacity = getComputedStyle(cardEl).opacity;
            if (currentOpacity === '0' || parseFloat(currentOpacity) < 0.1) {
              cardEl.style.opacity = '1';
              cardEl.style.visibility = 'visible';
            }
            
            // Mark as GSAP-initialized
            cardEl.setAttribute('data-gsap-initialized', 'true');
            
            // Check if element is already in viewport - if so, make visible immediately
            const rect = cardEl.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            
            // Always keep visible - only animate position/scale, never opacity
            cardEl.style.opacity = '1';
            cardEl.style.visibility = 'visible';
            
            if (isInViewport) {
              // Element is already visible, just animate it in
              gsap.fromTo(cardEl, 
                { y: 60, scale: 0.95 },
                { 
                  y: 0, 
                  scale: 1,
                  duration: 0.8,
                  ease: 'power3.out',
                  delay: index * 0.1,
                }
              );
              cardEl.setAttribute('data-gsap-animated', 'true');
            } else {
              // Set initial position but keep visible
              gsap.set(cardEl, { y: 60, scale: 0.95 });
              
              const animation = gsap.to(cardEl, {
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
              
              // Fallback: ensure visible after 1 second
              setTimeout(() => {
                cardEl.style.opacity = '1';
                cardEl.style.visibility = 'visible';
                if (!cardEl.getAttribute('data-gsap-animated')) {
                  gsap.to(cardEl, {
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: 'power2.out',
                  });
                  cardEl.setAttribute('data-gsap-animated', 'true');
                }
              }, 1000);
            }
          }
        });
      }
      
      // Refresh ScrollTrigger after all animations are set up
      ScrollTrigger.refresh();

      // Pricing cards animation with morphing effects
      const pricingCards = document.querySelectorAll('.pricing-card');
      if (pricingCards.length > 0) {
        pricingCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            
            // Ensure element is visible initially
            const currentOpacity = getComputedStyle(cardEl).opacity;
            if (currentOpacity === '0' || parseFloat(currentOpacity) < 0.1) {
              cardEl.style.opacity = '1';
              cardEl.style.visibility = 'visible';
            }
            
            // Mark as GSAP-initialized
            cardEl.setAttribute('data-gsap-initialized', 'true');
            
            // Check if element is already in viewport
            const rect = cardEl.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            
            // Always keep visible - only animate position/scale
            cardEl.style.opacity = '1';
            cardEl.style.visibility = 'visible';
            
            if (isInViewport) {
              // Element is already visible, just animate it in
              gsap.fromTo(cardEl,
                { y: 80, scale: 0.9 },
                {
                  y: 0,
                  scale: 1,
                  duration: 1,
                  ease: 'power3.out',
                  delay: index * 0.12,
                }
              );
              cardEl.setAttribute('data-gsap-animated', 'true');
            } else {
              // Set initial position but keep visible
              gsap.set(cardEl, { y: 80, scale: 0.9 });
              
              const animation = gsap.to(cardEl, {
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
              
              // Fallback: ensure visible after 1 second
              setTimeout(() => {
                cardEl.style.opacity = '1';
                cardEl.style.visibility = 'visible';
                if (!cardEl.getAttribute('data-gsap-animated')) {
                  gsap.to(cardEl, {
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: 'power2.out',
                  });
                  cardEl.setAttribute('data-gsap-animated', 'true');
                }
              }, 1000);
            }
          }
        });
      }

      // Animate SocialProof section elements
      const statCards = document.querySelectorAll('.stat-card');
      if (statCards.length > 0) {
        statCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            const rect = cardEl.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            
            // Always keep visible
            cardEl.style.opacity = '1';
            cardEl.style.visibility = 'visible';
            
            if (isInViewport) {
              gsap.fromTo(cardEl,
                { y: 40, scale: 0.95 },
                {
                  y: 0,
                  scale: 1,
                  duration: 0.7,
                  ease: 'power3.out',
                  delay: index * 0.1,
                }
              );
            } else {
              gsap.set(cardEl, { y: 40, scale: 0.95 });
              
              gsap.to(cardEl, {
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
              
              // Fallback: ensure visible
              setTimeout(() => {
                cardEl.style.opacity = '1';
                cardEl.style.visibility = 'visible';
              }, 2000);
            }
          }
        });
      }

      // Animate testimonial cards
      const testimonialCards = document.querySelectorAll('.testimonial-card');
      if (testimonialCards.length > 0) {
        testimonialCards.forEach((card: Element, index: number) => {
          if (card) {
            const cardEl = card as HTMLElement;
            const rect = cardEl.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            
            // Always keep visible
            cardEl.style.opacity = '1';
            cardEl.style.visibility = 'visible';
            
            if (isInViewport) {
              gsap.fromTo(cardEl,
                { y: 50 },
                {
                  y: 0,
                  duration: 0.8,
                  ease: 'power3.out',
                  delay: index * 0.1,
                }
              );
            } else {
              gsap.set(cardEl, { y: 50 });
              
              gsap.to(cardEl, {
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
              
              // Fallback: ensure visible
              setTimeout(() => {
                cardEl.style.opacity = '1';
                cardEl.style.visibility = 'visible';
              }, 2000);
            }
          }
        });
      }

      // Animate section headings
      const sectionHeadings = document.querySelectorAll('section h2');
      if (sectionHeadings.length > 0) {
        sectionHeadings.forEach((heading: Element) => {
          if (heading) {
            const headingEl = heading as HTMLElement;
            headingEl.style.opacity = '1';
            headingEl.style.visibility = 'visible';
            gsap.set(headingEl, { y: 30 });
            
            gsap.to(headingEl, {
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
          descEl.style.opacity = '1';
          descEl.style.visibility = 'visible';
          gsap.set(descEl, { y: 20 });
          
          gsap.to(descEl, {
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
        
      // Global safety fallback: ensure all animated elements are visible after 3 seconds
        setTimeout(() => {
          const allAnimatedElements = document.querySelectorAll(
            '.feature-card[data-gsap-initialized="true"]:not([data-gsap-animated="true"]), ' +
            '.pricing-card[data-gsap-initialized="true"]:not([data-gsap-animated="true"]), ' +
            '.stat-card[data-gsap-initialized="true"], ' +
            '.testimonial-card[data-gsap-initialized="true"]'
          );
          
          allAnimatedElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            // Force visibility - never hide
            htmlEl.style.opacity = '1';
            htmlEl.style.visibility = 'visible';
            const computedOpacity = getComputedStyle(htmlEl).opacity;
            if (computedOpacity === '0' || parseFloat(computedOpacity) < 0.1) {
              htmlEl.style.opacity = '1';
              htmlEl.style.visibility = 'visible';
              gsap.to(htmlEl, {
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: 'power2.out',
              });
              htmlEl.setAttribute('data-gsap-animated', 'true');
            }
          });
        }, 3000);
            }); // closes gsap.context
          } catch (animationError) {
            console.warn('GSAP animation error (non-fatal):', animationError);
          }
        }); // closes requestAnimationFrame
      } catch (gsapInitError) {
        console.warn('GSAP initialization error:', gsapInitError);
      }
    }).catch((error: any) => {
      console.warn('GSAP failed to load (animations disabled):', error);
      // If GSAP fails to load, ensure all elements are visible
      const allCards = document.querySelectorAll('.feature-card, .pricing-card, .stat-card, .testimonial-card');
      allCards.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.opacity = '1';
        htmlEl.style.visibility = 'visible';
      });
    }); // closes Promise.all().then().catch()

    return () => {
      if (ctx) {
        ctx.revert();
      }
      isInitialized = false;
      (window as any).__gsapInitializing = false;
      // Clean up any ScrollTrigger instances
      if (typeof window !== 'undefined') {
        Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger'),
        ]).then(([gsapModule, scrollTriggerModule]) => {
          const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
          ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
          (window as any).__gsapInitialized = false;
          (window as any).__gsapInitializing = false;
        }).catch(() => {
          // Ignore errors during cleanup
          (window as any).__gsapInitialized = false;
          (window as any).__gsapInitializing = false;
        });
      }
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
              {!isClient || status === 'loading' ? (
                // Show loading skeleton to prevent layout shift
                <>
                  <div className="px-4 py-2 text-slate-300 text-sm font-medium rounded-lg bg-slate-800/30 animate-pulse w-20"></div>
                  <div className="px-5 py-2.5 bg-slate-700/30 rounded-lg animate-pulse w-32"></div>
                </>
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
                    Start Free Trial
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
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 md:pt-24 overflow-hidden"
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
            <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mt-8 md:mt-12">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-slate-300 font-medium">Join 5,000+ drummers improving their practice</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <h1 
                ref={titleRef}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight"
                style={{ opacity: 1, visibility: 'visible' }}
              >
                <span className="block text-white">
                  Master Every Beat
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300">
                  Create, Practice, Perfect
                </span>
              </h1>
              
              <p 
                ref={subtitleRef}
                className="text-xl sm:text-2xl md:text-3xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light"
                style={{ opacity: 1, visibility: 'visible' }}
              >
                Get instant feedback on your playing, create custom patterns with industry-standard notation, and track your progress — all in one powerful platform trusted by 5,000+ drummers
              </p>
            </div>

            {/* CTA Buttons */}
            <div 
              ref={ctaRef}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {!isClient || status === 'loading' ? (
                // Show loading skeleton with same dimensions to prevent layout shift
                <>
                  <div className="px-8 py-4 bg-white/20 rounded-xl font-semibold text-base animate-pulse w-64 h-14"></div>
                  <div className="px-8 py-4 bg-slate-800/30 rounded-xl font-semibold text-base animate-pulse w-56 h-14"></div>
                </>
              ) : session?.user ? (
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
                aria-label="Start your free 14-day trial - no credit card required"
              >
                <span className="relative z-10">Start Your Free 14-Day Trial</span>
              </button>
              <button
                onClick={() => {
                  // Scroll to demo section or open modal
                  const demoSection = document.querySelector('#interactive-demo');
                  if (demoSection) {
                    demoSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-8 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-white rounded-xl font-semibold text-base transition-all hover:bg-slate-800/70 hover:border-slate-600/50"
                aria-label="Watch 2-minute product demo"
              >
                Watch 2-Minute Demo
              </button>
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

      {/* Problem/Solution Section */}
      <section className="relative py-32 md:py-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 md:mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-white leading-tight tracking-tight">
              Stop Wasting Practice Time
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              See how DrumPractice transforms your practice routine
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-center">
            {/* Without DrumPractice */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-300 mb-2">Without DrumPractice</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">❌</span>
                  <p className="text-slate-300 leading-relaxed">"Is that right?" — No feedback on accuracy</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">❌</span>
                  <p className="text-slate-300 leading-relaxed">Repetitive practice without structure</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">❌</span>
                  <p className="text-slate-300 leading-relaxed">Can't share patterns with teachers or bandmates</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">❌</span>
                  <p className="text-slate-300 leading-relaxed">No way to track improvement</p>
                </div>
              </div>
            </div>

            {/* Visual Separator - Arrow on desktop, text on mobile */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full"></div>
                <div className="relative bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-full p-6">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="md:hidden flex items-center justify-center py-4">
              <div className="text-slate-500 text-sm font-medium">VS</div>
            </div>

            {/* With DrumPractice */}
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">With DrumPractice</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">✅</span>
                  <p className="text-slate-200 leading-relaxed">Instant accuracy feedback — know immediately when you're off-beat</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">✅</span>
                  <p className="text-slate-200 leading-relaxed">Structured progression with custom patterns and goals</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">✅</span>
                  <p className="text-slate-200 leading-relaxed">Export to any format (MIDI, PDF, PNG, SVG) for sharing</p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl">
                  <span className="text-2xl flex-shrink-0">✅</span>
                  <p className="text-slate-200 leading-relaxed">Detailed practice analytics and progress tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section (includes statistics) */}
      <SocialProof />

      {/* Interactive Demo Section */}
      <div id="interactive-demo">
        <InteractiveDemo />
      </div>

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
                title: 'See Exactly What You\'re Playing',
                description: 'Industry-standard notation renders every ghost note, accent, and sticking pattern with perfect clarity. Export to PDF for your teacher, or MIDI for your band.',
                details: 'Professional VexFlow rendering with precise note placement and timing.',
              },
              {
                Icon: Piano,
                title: 'Know the Moment You\'re Off-Beat',
                description: 'Play with your MIDI pads or just use your phone\'s microphone. See your accuracy in real-time with detailed metrics showing exactly where to improve.',
                details: 'Real-time accuracy tracking with detailed performance metrics and visual feedback.',
              },
              {
                Icon: Target,
                title: 'Custom Pattern Creation',
                description: 'Build custom patterns with voicing, sticking, accents, ghost notes, and ornaments. Create exactly what you need to practice.',
                details: 'Advanced editing tools for complete creative control over every aspect of your patterns.',
              },
              {
                Icon: BarChart3,
                title: 'Watch Yourself Improve Day by Day',
                description: 'Detailed session history, accuracy trends, and practice goals keep you motivated. See which patterns need work and celebrate your wins.',
                details: 'Visual progress charts, session history tracking, and goal-based practice recommendations.',
              },
              {
                Icon: Repeat,
                title: 'Tackle Complex Rhythms Easily',
                description: 'Create and practice complex polyrhythmic patterns with multiple time signatures. Master advanced rhythmic concepts with visual guides.',
                details: 'Support for odd time signatures, overlapping rhythms, and polyrhythmic patterns.',
              },
              {
                Icon: BookOpen,
                title: 'Never Run Out of Practice Material',
                description: 'Start with 200+ carefully curated patterns from beginner to advanced. Rock, jazz, Latin, funk — every style covered. Or create your own custom patterns in minutes.',
                details: 'Carefully curated patterns from beginner to advanced, covering all major genres and styles.',
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
              Choose Your Practice Plan
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 mb-4">
              Trusted by 5,000+ drummers
            </p>
            
            {/* Monthly/Annual Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm font-medium transition-colors ${pricingPeriod === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setPricingPeriod(pricingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="relative w-14 h-8 bg-slate-800 rounded-full border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950 touch-manipulation"
                aria-label="Toggle pricing period between monthly and annual"
              >
                <span
                  className="absolute w-6 h-6 bg-white rounded-full transition-all duration-300"
                  style={{ 
                    left: pricingPeriod === 'annual' ? '28px' : '4px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${pricingPeriod === 'annual' ? 'text-white' : 'text-slate-400'}`}>
                Annual
                <span className="ml-2 text-xs text-green-400">Save 23%</span>
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Free',
                subtitle: 'Starter',
                price: '£0',
                period: 'Forever',
                features: [
                  'Up to 5 custom drum patterns saved',
                  '10 practice sessions per month',
                  '3 exports per month (MIDI or PDF)',
                  'Access to basic library of 50 preset patterns',
                  'Practice mode: Microphone input only',
                ],
                cta: 'Get Started Free',
                href: '/app',
                popular: false,
              },
              {
                name: 'Pro',
                subtitle: 'Most Popular',
                price: pricingPeriod === 'monthly' ? '£12.99' : '£119',
                period: pricingPeriod === 'monthly' ? 'per month' : 'per year',
                monthlyEquivalent: pricingPeriod === 'annual' ? '£9.92/month' : undefined,
                savings: pricingPeriod === 'annual' ? 'Save £37/year' : undefined,
                features: [
                  'Everything in Free, plus:',
                  'Unlimited custom pattern creations and saves',
                  'Unlimited practice sessions',
                  'Unlimited exports in all formats (MIDI, PDF, PNG, SVG)',
                  'Full access to 200+ preset pattern library',
                  'Detailed progress analytics & history',
                  'Both practice modes: Microphone and MIDI support',
                  'Priority email support',
                ],
                cta: 'Start Free Trial',
                href: '/pricing',
                popular: true,
              },
              {
                name: 'Premium',
                subtitle: 'Professional',
                price: pricingPeriod === 'monthly' ? '£24.99' : '£229',
                period: pricingPeriod === 'monthly' ? 'per month' : 'per year',
                monthlyEquivalent: pricingPeriod === 'annual' ? '£19.08/month' : undefined,
                savings: pricingPeriod === 'annual' ? 'Save £70/year' : undefined,
                features: [
                  'Everything in Pro, plus:',
                  'Advanced polyrhythm and odd-time signature tools',
                  'Collaboration: share patterns with students or bandmates',
                  'Cloud storage for unlimited patterns across devices',
                  'Custom practice routines & schedules',
                  'Video practice recording and analysis tools',
                  'One-on-one onboarding session',
                ],
                cta: 'Start Free Trial',
                href: '/pricing',
                popular: false,
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
                        {plan.subtitle}
                      </span>
                    </div>
                  )}
                  
                  {/* Subtle gradient overlay */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${plan.popular ? 'bg-gradient-to-br from-slate-800/30 via-slate-900/20 to-slate-900/30' : 'bg-gradient-to-br from-slate-800/20 to-slate-900/20'}`}></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-semibold text-white mb-1">{plan.name}</h3>
                    {plan.subtitle && !plan.popular && (
                      <p className="text-sm text-slate-400 mb-4">{plan.subtitle}</p>
                    )}
                    <div className="text-5xl font-semibold text-white mb-2 tracking-tight">{plan.price}</div>
                    {plan.monthlyEquivalent && (
                      <p className="text-slate-400 text-sm font-medium mb-1">{plan.monthlyEquivalent}</p>
                    )}
                    {plan.savings && (
                      <p className="text-green-400 text-sm font-medium mb-4">{plan.savings}</p>
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
                    {plan.name !== 'Free' && (
                      <p className="text-xs text-slate-500 text-center mt-3">No credit card required</p>
                    )}
                  </div>
                  
                  {/* Sophisticated shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-[2000ms] ease-in-out"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Notes */}
          <div className="text-center mt-12 space-y-2">
            <p className="text-sm text-slate-400">
              All prices include VAT. Cancel anytime. No contracts.
            </p>
            <p className="text-sm text-slate-400">
              Free trial requires no credit card. 14-day free trial available for Pro and Premium.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-32 md:py-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 md:mb-24">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 text-white leading-tight tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about DrumPractice
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'How does the free trial work?',
                answer: 'When you sign up, you get full access to DrumPractice\'s Pro features for a 14-day trial period, absolutely free. No credit card is required to start the trial — we want you to experience everything first. If you love it, you can choose a plan (Pro or Premium) at the end of the trial. If not, you can continue with the Free plan or cancel — no obligations.',
              },
              {
                question: 'Do I need an electronic drum kit to use DrumPractice?',
                answer: 'No electronic kit needed! DrumPractice works great with a regular acoustic drum kit or even a practice pad. Our app uses your device\'s microphone to listen to your drumming and give you feedback. Of course, if you have an electronic (MIDI) drum kit, you can connect that too for even more accuracy, but it\'s not required.',
              },
              {
                question: 'Is DrumPractice suitable for beginners?',
                answer: 'Absolutely. DrumPractice is designed for beginners and intermediate drummers alike. You can start with basic patterns (we have a library of beginner-friendly beats) and use the real-time feedback to improve your fundamentals. As you grow, the app has more advanced features (like polyrhythms and custom patterns) ready for you. Think of it as a personal drum coach that adapts to your level.',
              },
              {
                question: 'Can I upgrade or cancel my subscription later?',
                answer: 'Yes, you\'re in control. You can upgrade, downgrade, or cancel your subscription at any time from your account settings — no hoops to jump through. If you cancel a paid plan, you\'ll still keep access to your account and drop down to the Free plan at the end of your billing cycle, so you won\'t lose your saved patterns or progress.',
              },
              {
                question: 'What devices does DrumPractice work on?',
                answer: 'DrumPractice is a web-based application, so it works on any device with an updated web browser — desktop, laptop, tablet, or smartphone. We strongly recommend using Chrome or Safari for the best experience. There\'s no app install required (though a dedicated mobile app may be in the works). Just log in on your preferred device and start drumming!',
              },
              {
                question: 'How does the microphone feedback work without an electronic kit?',
                answer: 'Using your device\'s microphone, DrumPractice can detect your drum hits and timing. For best results, practice in a quiet environment and position your device near your drums or practice pad. The app will guide you through a quick sound calibration. It\'s surprisingly accurate — almost like magic — turning your acoustic kit into a smart drum set!',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden hover:border-slate-700/50 transition-all duration-300"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none touch-manipulation min-h-[44px] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-inset rounded-t-2xl" aria-expanded="false">
                  <h3 className="text-lg md:text-xl font-semibold text-white pr-8">
                    {faq.question}
                  </h3>
                  <svg
                    className="w-6 h-6 text-slate-400 flex-shrink-0 transition-transform duration-300 group-open:rotate-180 min-w-[24px] min-h-[24px]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 pt-0">
                  <p className="text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
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
                Ready to Take Your Drumming to the Next Level?
              </h2>
              <p className="text-xl md:text-2xl mb-6 text-slate-300 leading-relaxed">
                Start your free trial with DrumPractice today. Join 5,000+ drummers improving their practice.
              </p>
              <p className="text-sm text-slate-400 mb-10">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
              {!isClient || status === 'loading' ? (
                <div className="inline-block px-12 py-5 bg-white/20 rounded-xl font-semibold text-lg animate-pulse w-64 h-14"></div>
              ) : session?.user ? (
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
                  Start Your Free 14-Day Trial
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
                {!isClient || status === 'loading' ? (
                  <>
                    <li><div className="text-slate-400 w-24 h-5 bg-slate-800/30 rounded animate-pulse"></div></li>
                    <li><div className="text-slate-400 w-32 h-5 bg-slate-800/30 rounded animate-pulse"></div></li>
                  </>
                ) : session?.user ? (
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