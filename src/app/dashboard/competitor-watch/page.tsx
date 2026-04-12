'use client';

import { useRouter } from 'next/navigation';
import { CompetitorWatchScreen } from '@/screens/CompetitorWatchScreen';
import { resolveScreen } from '@/lib/navigation';
import { useCompetitors } from '@/hooks/useCompetitors';
import { competitorsApi } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function Page() {
  const router = useRouter();
  const { data: apiCompetitors, isLoading } = useCompetitors();
  const qc = useQueryClient();

  const handleAdd = async (data: { name: string; platform: string; handle: string }) => {
    try {
      await competitorsApi.create(data);
      qc.invalidateQueries({ queryKey: ['competitors'] });
      toast.success('Competitor added');
    } catch {
      toast.error('Failed to add competitor');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await competitorsApi.delete(id);
      qc.invalidateQueries({ queryKey: ['competitors'] });
      toast.success('Competitor removed');
    } catch {
      toast.error('Failed to remove competitor');
    }
  };

  return (
    <CompetitorWatchScreen
      onBack={() => router.push('/dashboard')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      apiCompetitors={apiCompetitors}
      isLoadingCompetitors={isLoading}
      onAddCompetitor={handleAdd}
      onRemoveCompetitor={handleRemove}
    />
  );
}
