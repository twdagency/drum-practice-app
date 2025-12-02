'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin/analytics');
      return;
    }

    checkAdminStatus();
  }, [session, status, router]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check');
      const data = await response.json();
      if (data.isAdmin) {
        setIsAdmin(true);
      } else {
        router.push('/app');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/app');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-slate-400 hover:text-slate-200 mb-4 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-semibold text-white mb-2">Analytics</h1>
              <p className="text-slate-400">View usage and revenue analytics</p>
            </div>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-8">
          <div className="text-center py-12">
            <i className="fas fa-chart-line text-6xl text-slate-600 mb-4"></i>
            <h3 className="text-2xl font-semibold text-white mb-2">Analytics Coming Soon</h3>
            <p className="text-slate-400">
              Advanced analytics and reporting features will be available here.
            </p>
            <p className="text-slate-500 text-sm mt-4">
              This will include revenue charts, user growth metrics, feature usage statistics, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

