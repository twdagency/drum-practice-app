'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SubscriptionPlan } from '@/lib/stripe/types';
import Link from 'next/link';

function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoApplied, setPromoApplied] = useState<boolean>(false);

  // Fetch plans from API (so we get server-side environment variables)
  useEffect(() => {
    fetch('/api/stripe/plans')
      .then(res => res.json())
      .then(data => {
        if (data.plans) {
          setPlans(data.plans);
        }
      })
      .catch(err => {
        console.error('Failed to load plans:', err);
        setMessage('Failed to load pricing plans. Please refresh the page.');
      });
  }, []);

  // Check for stored promo code (from exit intent popup)
  useEffect(() => {
    const storedPromo = localStorage.getItem('dpgen_promo_code');
    if (storedPromo) {
      setPromoCode(storedPromo);
      setPromoApplied(true);
      setMessage(`🎉 Promo code ${storedPromo} applied! 20% off your first year.`);
    }
  }, []);

  useEffect(() => {
    // Check for canceled parameter
    if (searchParams.get('canceled')) {
      setMessage('Order canceled -- continue to shop around and checkout when you\'re ready.');
    }
  }, [searchParams]);

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      localStorage.setItem('dpgen_promo_code', promoCode.trim().toUpperCase());
      setPromoApplied(true);
      setMessage(`🎉 Promo code ${promoCode.toUpperCase()} will be applied at checkout.`);
    }
  };

  const handleRemovePromo = () => {
    localStorage.removeItem('dpgen_promo_code');
    setPromoCode('');
    setPromoApplied(false);
    setMessage('');
  };

  const handleCheckout = async (plan: SubscriptionPlan) => {
    setLoading(plan.id);
    setMessage('');

    try {
      // Get promo code from state or localStorage
      const appliedPromo = promoCode || localStorage.getItem('dpgen_promo_code');
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          customerEmail: session?.user?.email,
          promoCode: appliedPromo || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to create checkout session';
        console.error('Checkout API error:', data);
        throw new Error(errorMsg);
      }

      // Clear the stored promo code after successful checkout creation
      localStorage.removeItem('dpgen_promo_code');

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setMessage(error.message || 'Failed to start checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-white mb-4 tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400">
            Unlock unlimited patterns, advanced features, and professional tools
          </p>
        </div>

        {/* Promo Code Section */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-slate-800/50">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Have a promo code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                disabled={promoApplied}
                className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all disabled:opacity-50 font-mono"
              />
              {promoApplied ? (
                <button
                  onClick={handleRemovePromo}
                  className="px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-700/70 transition-all text-sm font-medium"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim()}
                  className="px-4 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              )}
            </div>
            {promoApplied && (
              <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Code applied! Discount will be shown at checkout.
              </p>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className={`p-4 rounded-xl border ${
              message.includes('🎉') 
                ? 'bg-green-950/30 border-green-800/50 text-green-300'
                : 'bg-slate-900/60 border-slate-800/50 text-slate-300'
            }`}>
              {message}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        {plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading plans...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-800/50">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold text-white mb-2">
                Free
              </h3>
              <div className="text-4xl font-semibold text-white mb-1 tracking-tight">
                £0
              </div>
              <p className="text-slate-400 text-sm">Forever</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-slate-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-300 text-sm">5 patterns</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-slate-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-300 text-sm">Basic practice modes</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-slate-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-300 text-sm">Progress tracking</span>
              </li>
            </ul>
            <Link
              href="/app"
              className="block w-full text-center py-3.5 px-6 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 font-medium hover:bg-slate-800/70 hover:border-slate-600/50 transition-all"
            >
              Get Started Free
            </Link>
          </div>

          {/* Paid Plans */}
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border ${
                plan.popular
                  ? 'border-slate-700/50 shadow-2xl shadow-slate-900/50 relative'
                  : 'border-slate-800/50'
              } hover:border-slate-700/70 transition-all duration-500 group`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-slate-800 text-slate-200 px-5 py-1.5 rounded-full text-xs font-medium border border-slate-700/50 shadow-lg backdrop-blur-sm">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-semibold text-white mb-1 tracking-tight">
                  £{plan.price.toFixed(2)}
                </div>
                <p className="text-slate-400 text-sm">
                  per {plan.interval === 'month' ? 'month' : 'year'}
                  {plan.interval === 'year' && (
                    <span className="block text-sm text-slate-400 mt-1">
                      Save 17% vs monthly
                    </span>
                  )}
                </p>
                {promoApplied && plan.interval === 'year' && (
                  <p className="text-sm text-green-400 mt-2">
                    + Additional 20% off with {promoCode}!
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-slate-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.id}
                className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-slate-900/20'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-200 hover:bg-slate-800/70 hover:border-slate-600/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.id ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          ))}
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-slate-400">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                Do you offer a free trial?
              </h3>
              <p className="text-slate-400">
                We offer a free tier with limited features. Paid plans may include a free trial period - check during checkout.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400">
                We accept all major credit cards, debit cards, and other payment methods through Stripe.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                How do promo codes work?
              </h3>
              <p className="text-slate-400">
                Enter your promo code above before clicking Subscribe. The discount will be applied automatically at checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Back to App Link */}
        <div className="text-center mt-12">
          <Link
            href="/app"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
