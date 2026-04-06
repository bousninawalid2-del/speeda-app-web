'use client';
import { useRouter } from 'next/navigation';
import { ContactSupportScreen } from '@/screens/ContactSupportScreen';
export default function Page() {
  const router = useRouter();
  return <ContactSupportScreen onBack={() => router.push('/dashboard/settings')} />;
}
