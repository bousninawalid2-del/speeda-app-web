'use client';

import { useRouter } from 'next/navigation';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { resolveScreen } from '@/lib/navigation';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

export default function Page() {
  const router  = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const handleSave = async (data: {
    name: string;
    phone: string;
    businessName: string;
    city: string;
    industry: string;
  }) => {
    await updateProfile(data);
  };

  return (
    <ProfileScreen
      onBack={() => router.push('/dashboard/settings')}
      onNavigate={(s) => router.push(resolveScreen(s))}
      initialData={profile ? {
        name:         profile.name,
        email:        profile.email,
        phone:        profile.phone,
        isVerified:   profile.isVerified,
        businessName: profile.activity?.business_name,
        country:      profile.activity?.location,
        city:         profile.activity?.location,
        industry:     profile.activity?.industry,
      } : undefined}
      isLoading={isLoading}
      onSave={handleSave}
    />
  );
}
