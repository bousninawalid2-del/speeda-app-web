'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Users, CreditCard, DollarSign } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  recentUsers: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    tokenBalance: number;
    role: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminStats>('/admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[24px] font-extrabold text-foreground mb-6">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <Users size={20} className="text-brand-blue" />
            </div>
            <span className="text-[13px] font-medium text-muted-foreground">Total Users</span>
          </div>
          <p className="text-[28px] font-extrabold text-foreground">{stats?.totalUsers ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-accent/10 flex items-center justify-center">
              <CreditCard size={20} className="text-green-accent" />
            </div>
            <span className="text-[13px] font-medium text-muted-foreground">Active Subscriptions</span>
          </div>
          <p className="text-[28px] font-extrabold text-foreground">{stats?.activeSubscriptions ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-accent/10 flex items-center justify-center">
              <DollarSign size={20} className="text-orange-accent" />
            </div>
            <span className="text-[13px] font-medium text-muted-foreground">Revenue (This Month)</span>
          </div>
          <p className="text-[28px] font-extrabold text-foreground">{((stats?.monthlyRevenue ?? 0) / 100).toLocaleString()} {'\uFDFC'}</p>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[16px] font-bold text-foreground">Recent Registrations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Name</th>
                <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Email</th>
                <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Role</th>
                <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Tokens</th>
                <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentUsers.map(user => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 text-[13px] text-foreground font-medium">{user.name ?? '-'}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${user.role === 'admin' ? 'bg-purple-soft text-purple' : 'bg-muted text-muted-foreground'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-foreground">{user.tokenBalance}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
