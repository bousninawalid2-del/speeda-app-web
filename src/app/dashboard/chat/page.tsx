'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AIChatScreen } from '@/screens/AIChatScreen';
import { resolveScreen } from '@/lib/navigation';

function ChatContent() {
  const router = useRouter();

  return (
    <AIChatScreen
      onNavigate={(s) => router.push(resolveScreen(s))}
    />
  );
}

export default function Page() {
  return <Suspense><ChatContent /></Suspense>;
}
