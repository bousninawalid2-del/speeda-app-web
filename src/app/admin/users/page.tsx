'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tokenBalance: number;
  tokenUsed: number;
  isVerified: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  subscription: {
    status: string;
    plan: { name: string };
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchUsers = (page: number) => {
    setLoading(true);
    apiFetch<{ users: AdminUser[]; pagination: Pagination }>(`/admin/users?page=${page}&limit=20`)
      .then(r => {
        setUsers(r.users);
        setPagination(r.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(1); }, []);

  const getStatusBadge = (user: AdminUser) => {
    if (user.subscription?.status === 'active') return { label: user.subscription.plan.name, bg: 'bg-green-soft', text: 'text-green-accent' };
    if (user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) return { label: 'Free Trial', bg: 'bg-brand-blue/10', text: 'text-brand-blue' };
    return { label: 'No Plan', bg: 'bg-muted', text: 'text-muted-foreground' };
  };

  return (
    <div>
      <h1 className="text-[24px] font-extrabold text-foreground mb-6">Users</h1>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Name</th>
                    <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Email</th>
                    <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Plan</th>
                    <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Tokens</th>
                    <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Verified</th>
                    <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const status = getStatusBadge(user);
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      >
                        <td className="px-5 py-3 text-[13px] font-medium text-foreground">{user.name ?? '-'}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{user.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${status.bg} ${status.text}`}>{status.label}</span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-foreground">{user.tokenBalance} / {user.tokenBalance + user.tokenUsed}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${user.isVerified ? 'bg-green-soft text-green-accent' : 'bg-red-soft text-red-accent'}`}>
                            {user.isVerified ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* User Detail Panel */}
            {selectedUser && (
              <div className="border-t border-border bg-muted/30 p-5">
                <h3 className="text-[16px] font-bold text-foreground mb-3">User Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                  <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-[11px] text-foreground">{selectedUser.id}</span></div>
                  <div><span className="text-muted-foreground">Role:</span> <span className="font-bold text-foreground">{selectedUser.role}</span></div>
                  <div><span className="text-muted-foreground">Token Balance:</span> <span className="font-bold text-foreground">{selectedUser.tokenBalance}</span></div>
                  <div><span className="text-muted-foreground">Tokens Used:</span> <span className="font-bold text-foreground">{selectedUser.tokenUsed}</span></div>
                  {selectedUser.trialEndsAt && (
                    <div><span className="text-muted-foreground">Trial Ends:</span> <span className="font-bold text-foreground">{new Date(selectedUser.trialEndsAt).toLocaleDateString()}</span></div>
                  )}
                  {selectedUser.subscription && (
                    <div><span className="text-muted-foreground">Subscription:</span> <span className="font-bold text-foreground">{selectedUser.subscription.plan.name} ({selectedUser.subscription.status})</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-[13px] text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[13px] font-bold text-foreground">{pagination.page} / {pagination.totalPages}</span>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
