'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AIChatScreen } from '@/screens/AIChatScreen';
import { resolveScreen } from '@/lib/navigation';

function ChatContent() {
  const router = useRouter();
  const params = useSearchParams();

  const tab = params.get('tab');
  const filter = params.get('filter') ?? undefined;
  const prefill = params.get('prefill');

  const initialTab = tab === 'engagement' ? 'engagement' : 'chat';
  const initialInputValue =
    prefill === 'tokens'
      ? 'I need help choosing a token pack. What do you recommend?'
      : undefined;

  return (
    <AIChatScreen
      initialTab={initialTab}
      initialEngagementFilter={filter}
      initialInputValue={initialInputValue}
      onNavigate={(s) => router.push(resolveScreen(s))}
    />
  );
}

export default function Page() {
  return <Suspense><ChatContent /></Suspense>;
}
