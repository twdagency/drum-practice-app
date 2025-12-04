import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { VexFlowLoader } from '@/components/VexFlowLoader'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/shared/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ClarityLoader } from '@/components/ClarityLoader'

export const metadata: Metadata = {
  title: 'DrumPractice – Create Drum Patterns, Get Instant Feedback & Improve Fast',
  description: 'DrumPractice.co.uk is a modern drum practice platform for beginners and intermediates. Create custom drum patterns with professional notation, use your e-drum or acoustic kit for instant feedback via microphone, and track your progress. Start a free trial and level up your drumming!',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'DrumPractice – Create Drum Patterns, Get Instant Feedback & Improve Fast',
    description: 'DrumPractice.co.uk is a modern drum practice platform for beginners and intermediates. Create custom drum patterns with professional notation, use your e-drum or acoustic kit for instant feedback via microphone, and track your progress.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DrumPractice – Create Drum Patterns, Get Instant Feedback & Improve Fast',
    description: 'DrumPractice.co.uk is a modern drum practice platform for beginners and intermediates. Create custom drum patterns with professional notation.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
          integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force all elements visible immediately - runs before React
              (function() {
                function forceVisible() {
                  const selectors = [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'section', 'nav', 'header',
                    '[class*="ProductPreview"]',
                    '[class*="SocialProof"]',
                    '[class*="InteractiveDemo"]',
                    '.feature-card', '.pricing-card', '.stat-card', '.testimonial-card'
                  ];
                  selectors.forEach(sel => {
                    try {
                      document.querySelectorAll(sel).forEach(el => {
                        if (el) {
                          el.style.setProperty('opacity', '1', 'important');
                          el.style.setProperty('visibility', 'visible', 'important');
                        }
                      });
                    } catch(e) {}
                  });
                }
                // Run immediately and repeatedly
                forceVisible();
                document.addEventListener('DOMContentLoaded', forceVisible);
                setInterval(forceVisible, 100);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
          <SessionProvider>
            <ToastProvider>
              <VexFlowLoader />
              {children}
            </ToastProvider>
          </SessionProvider>
        </ErrorBoundary>
        <SpeedInsights />
        <ClarityLoader />
      </body>
    </html>
  )
}
