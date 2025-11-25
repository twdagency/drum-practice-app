import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { VexFlowLoader } from '@/components/VexFlowLoader'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/shared/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'Drum Practice Generator',
  description: 'Generate and practice drumming patterns with real-time feedback',
  icons: {
    icon: '/favicon.svg',
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
      </body>
    </html>
  )
}
