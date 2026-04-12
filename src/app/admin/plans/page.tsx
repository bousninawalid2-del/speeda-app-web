'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  tokenCount: number;
  platformLimit: number;
  features: string;
  locked: string;
  active: boolean;
  sortOrder: number;
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Plan>>({});

  const fetchPlans = () => {
    apiFetch<{ plans: Plan[] }>('/admin/plans')
      .then(r => setPlans(r.plans))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditForm({
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      tokenCount: plan.tokenCount,
      platformLimit: plan.platformLimit,
      features: plan.features,
      locked: plan.locked,
      active: plan.active,
    });
  };

  const handleSave = async (id: string) => {
    try {
      await apiFetch(`/admin/plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      toast.success('Plan updated');
      setEditingId(null);
      fetchPlans();
    } catch {
      toast.error('Failed to update plan');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[24px] font-extrabold text-foreground mb-6">Manage Plans</h1>

      <div className="space-y-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-[18px] font-bold text-foreground">{plan.name}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${plan.active ? 'bg-green-soft text-green-accent' : 'bg-muted text-muted-foreground'}`}>
                  {plan.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {editingId === plan.id ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={() => handleSave(plan.id)} className="text-[13px] font-bold text-brand-blue">Save</button>
                </div>
              ) : (
                <button onClick={() => startEdit(plan)} className="text-[13px] font-bold text-brand-blue">Edit</button>
              )}
            </div>

            {editingId === plan.id ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Monthly Price</label>
                  <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={editForm.monthlyPrice ?? ''} onChange={e => setEditForm(f => ({ ...f, monthlyPrice: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Yearly Price</label>
                  <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={editForm.yearlyPrice ?? ''} onChange={e => setEditForm(f => ({ ...f, yearlyPrice: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Token Count</label>
                  <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={editForm.tokenCount ?? ''} onChange={e => setEditForm(f => ({ ...f, tokenCount: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Platform Limit</label>
                  <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={editForm.platformLimit ?? ''} onChange={e => setEditForm(f => ({ ...f, platformLimit: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Features (JSON)</label>
                  <textarea className="w-full h-20 px-3 py-2 rounded-xl border border-border bg-background text-[12px] font-mono resize-none" value={editForm.features ?? ''} onChange={e => setEditForm(f => ({ ...f, features: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Locked Features (JSON)</label>
                  <textarea className="w-full h-20 px-3 py-2 rounded-xl border border-border bg-background text-[12px] font-mono resize-none" value={editForm.locked ?? ''} onChange={e => setEditForm(f => ({ ...f, locked: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-muted-foreground">Active</label>
                  <button
                    onClick={() => setEditForm(f => ({ ...f, active: !f.active }))}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors ${editForm.active ? 'bg-green-accent' : 'bg-border'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-card shadow transition-transform ${editForm.active ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                <div>
                  <span className="text-muted-foreground">Monthly:</span>
                  <span className="font-bold text-foreground ms-1">{plan.monthlyPrice} {'\uFDFC'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Yearly:</span>
                  <span className="font-bold text-foreground ms-1">{plan.yearlyPrice} {'\uFDFC'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tokens:</span>
                  <span className="font-bold text-foreground ms-1">{plan.tokenCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Platforms:</span>
                  <span className="font-bold text-foreground ms-1">{plan.platformLimit}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
