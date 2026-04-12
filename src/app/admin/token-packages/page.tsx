'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface TokenPackage {
  id: string;
  name: string;
  tokenCount: number;
  price: number;
  active: boolean;
  sortOrder: number;
}

export default function AdminTokenPackages() {
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TokenPackage>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', tokenCount: 0, price: 0, active: true, sortOrder: 0 });

  const fetchPackages = () => {
    apiFetch<{ packages: TokenPackage[] }>('/admin/token-packages')
      .then(r => setPackages(r.packages))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPackages(); }, []);

  const startEdit = (pkg: TokenPackage) => {
    setEditingId(pkg.id);
    setEditForm({ name: pkg.name, tokenCount: pkg.tokenCount, price: pkg.price, active: pkg.active, sortOrder: pkg.sortOrder });
  };

  const handleSave = async (id: string) => {
    try {
      await apiFetch(`/admin/token-packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      toast.success('Package updated');
      setEditingId(null);
      fetchPackages();
    } catch {
      toast.error('Failed to update package');
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) { toast.error('Name is required'); return; }
    try {
      await apiFetch('/admin/token-packages', {
        method: 'POST',
        body: JSON.stringify(createForm),
      });
      toast.success('Package created');
      setShowCreate(false);
      setCreateForm({ name: '', tokenCount: 0, price: 0, active: true, sortOrder: 0 });
      fetchPackages();
    } catch {
      toast.error('Failed to create package');
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-extrabold text-foreground">Token Packages</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-10 px-4 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold">
          <Plus size={16} /> New Package
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-card rounded-2xl border border-brand-blue/30 p-5 mb-4">
          <h3 className="text-[16px] font-bold text-foreground mb-4">Create New Package</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Name</label>
              <input className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Starter Pack" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Token Count</label>
              <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={createForm.tokenCount} onChange={e => setCreateForm(f => ({ ...f, tokenCount: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Price (SAR)</label>
              <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={createForm.price} onChange={e => setCreateForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Sort Order</label>
              <input type="number" className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[13px]" value={createForm.sortOrder} onChange={e => setCreateForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleCreate} className="h-9 px-4 rounded-xl gradient-btn text-primary-foreground text-[13px] font-bold">Create</button>
              <button onClick={() => setShowCreate(false)} className="h-9 px-4 rounded-xl border border-border text-[13px] text-muted-foreground">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Package List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Name</th>
              <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Tokens</th>
              <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Price</th>
              <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Status</th>
              <th className="text-start px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Order</th>
              <th className="text-end px-5 py-3 text-[12px] font-bold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map(pkg => (
              <tr key={pkg.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                {editingId === pkg.id ? (
                  <>
                    <td className="px-5 py-3"><input className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[13px]" value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                    <td className="px-5 py-3"><input type="number" className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-[13px]" value={editForm.tokenCount ?? ''} onChange={e => setEditForm(f => ({ ...f, tokenCount: parseInt(e.target.value) || 0 }))} /></td>
                    <td className="px-5 py-3"><input type="number" className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-[13px]" value={editForm.price ?? ''} onChange={e => setEditForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} /></td>
                    <td className="px-5 py-3">
                      <button onClick={() => setEditForm(f => ({ ...f, active: !f.active }))} className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${editForm.active ? 'bg-green-soft text-green-accent' : 'bg-muted text-muted-foreground'}`}>
                        {editForm.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3"><input type="number" className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-[13px]" value={editForm.sortOrder ?? ''} onChange={e => setEditForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} /></td>
                    <td className="px-5 py-3 text-end">
                      <button onClick={() => handleSave(pkg.id)} className="text-[13px] font-bold text-brand-blue me-2">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[13px] text-muted-foreground">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 text-[13px] font-medium text-foreground">{pkg.name}</td>
                    <td className="px-5 py-3 text-[13px] text-foreground">{pkg.tokenCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-[13px] text-foreground">{pkg.price} {'\uFDFC'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${pkg.active ? 'bg-green-soft text-green-accent' : 'bg-muted text-muted-foreground'}`}>
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">{pkg.sortOrder}</td>
                    <td className="px-5 py-3 text-end">
                      <button onClick={() => startEdit(pkg)} className="text-[13px] font-bold text-brand-blue">Edit</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
