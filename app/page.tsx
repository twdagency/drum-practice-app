'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { SignInModal } from '@/components/auth/SignInModal';
import { SignUpModal } from '@/components/auth/SignUpModal';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🥁 Drum Practice Generator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {status === 'loading' ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
              ) : session?.user ? (
                <>
                  <Link
                    href="/app"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                  >
                    Go to App
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    View Pricing
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Master Drum Patterns with
            <span className="text-blue-600 dark:text-blue-400"> Professional Notation</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Create custom drum patterns, practice with MIDI or microphone, and improve your skills with real-time feedback and detailed progress tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session?.user ? (
              <>
                <Link
                  href="/app"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg"
                >
                  Open App
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg transition-colors"
                >
                  View Pricing
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowSignUp(true)}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg"
                >
                  Start Free Trial
                </button>
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg transition-colors"
                >
                  View Pricing
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features for Serious Drummers
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Everything you need to create, practice, and master drum patterns
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Professional Notation
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and view drum patterns with professional VexFlow notation. Export to MIDI, SVG, PNG, or PDF for sharing and printing.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🎹</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              MIDI & Microphone Practice
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Practice with MIDI drum pads or use your microphone for real-time feedback. Get accuracy and timing analysis for every hit.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Custom Pattern Creation
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Build custom patterns with voicing, sticking, accents, ghost notes, and ornaments. Create exactly what you need to practice.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Progress Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Track your practice sessions with detailed statistics, accuracy metrics, and progress goals. See your improvement over time.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Advanced Polyrhythms
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and practice complex polyrhythmic patterns with multiple time signatures. Master advanced rhythmic concepts.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              175+ Preset Patterns
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Browse a library of preset patterns covering various styles and difficulty levels. Perfect for inspiration and quick practice.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">£0</div>
              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
                <li>✓ 5 patterns</li>
                <li>✓ Basic practice modes</li>
                <li>✓ Progress tracking</li>
              </ul>
              <Link
                href="/app"
                className="block w-full text-center py-3 px-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Monthly */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Monthly</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">£9.99</div>
              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
                <li>✓ Unlimited patterns</li>
                <li>✓ All practice modes</li>
                <li>✓ Export options</li>
                <li>✓ Advanced features</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center py-3 px-6 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Subscribe
              </Link>
            </div>

            {/* Yearly */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 border-2 border-blue-500 dark:border-blue-400 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Yearly</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">£99.99</div>
              <p className="text-sm text-green-600 dark:text-green-400 mb-4">Save 17% vs monthly</p>
              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
                <li>✓ Everything in Monthly</li>
                <li>✓ Priority support</li>
                <li>✓ Best value</li>
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Subscribe
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View detailed pricing and features →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Improve Your Drumming?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join drummers who are already using Drum Practice Generator to master their craft
          </p>
          {session?.user ? (
            <Link
              href="/app"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Open App
            </Link>
          ) : (
            <button
              onClick={() => setShowSignUp(true)}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Drum Practice Generator</h3>
              <p className="text-sm">
                Professional drum pattern creation and practice tool with MIDI support and real-time feedback.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/app" className="hover:text-white">App</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@example.com" className="hover:text-white">Contact</a></li>
                <li><Link href="/" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                {session?.user ? (
                  <>
                    <li><Link href="/app" className="hover:text-white">Dashboard</Link></li>
                    <li><Link href="/pricing" className="hover:text-white">Manage Subscription</Link></li>
                  </>
                ) : (
                  <>
                    <li><button onClick={() => setShowSignIn(true)} className="hover:text-white">Sign In</button></li>
                    <li><button onClick={() => setShowSignUp(true)} className="hover:text-white">Sign Up</button></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
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
