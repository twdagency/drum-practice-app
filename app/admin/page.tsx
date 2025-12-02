'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  patternsCreated: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login?callbackUrl=/admin');
      return;
    }

    // Check if user is admin
    checkAdminStatus();
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white mb-2">Admin Dashboard</h1>
              <p className="text-slate-400">Manage users, subscriptions, and analytics</p>
            </div>
            <Link
              href="/app"
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 hover:bg-slate-800/70 transition-all"
            >
              Back to App
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
              <div className="text-slate-400 text-sm mb-2">Total Users</div>
              <div className="text-3xl font-semibold text-white">{stats.totalUsers}</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
              <div className="text-slate-400 text-sm mb-2">Active Subscriptions</div>
              <div className="text-3xl font-semibold text-white">{stats.activeSubscriptions}</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
              <div className="text-slate-400 text-sm mb-2">Total Revenue</div>
              <div className="text-3xl font-semibold text-white">£{stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50">
              <div className="text-slate-400 text-sm mb-2">Patterns Created</div>
              <div className="text-3xl font-semibold text-white">{stats.patternsCreated}</div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/70 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center group-hover:bg-slate-800/70 transition-all">
                <i className="fas fa-users text-2xl text-slate-300"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">User Management</h3>
                <p className="text-slate-400 text-sm">View and manage all users</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/subscriptions"
            className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/70 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center group-hover:bg-slate-800/70 transition-all">
                <i className="fas fa-credit-card text-2xl text-slate-300"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Subscriptions</h3>
                <p className="text-slate-400 text-sm">Manage subscriptions and billing</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/70 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800/50 rounded-xl flex items-center justify-center group-hover:bg-slate-800/70 transition-all">
                <i className="fas fa-chart-line text-2xl text-slate-300"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Analytics</h3>
                <p className="text-slate-400 text-sm">View usage and revenue analytics</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

