'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { ProfileChapter } from '@/components/profile/profile-chapter';
import { useProfileDesk, useProfilePass } from '@/components/profile/profile-provider';
import { ProfileStatus } from '@/components/profile/profile-status';
import { WriteupStatus } from '@/components/profile/writeup-status';
import { profileChapter } from '@/lib/profile-chapters';

export default function ProfileSectionPage() {
  const params = useParams<{ section: string }>();
  const router = useRouter();
  const chapter = profileChapter(params.section);
  const { snapshot, busy, generate } = useProfileDesk();
  const { pass, active } = useProfilePass();

  useEffect(() => {
    if (!chapter) router.replace('/profile');
  }, [chapter, router]);

  if (!chapter) return null;

  return (
    <DashboardWell>
      <Breadcrumb items={[{ label: 'Profile', href: '/profile' }, { label: chapter.label }]} />
      <ProfileStatus
        pass={pass}
        snapshot={snapshot}
        active={active}
        ready={(coach) => {
          const writeup = coach.writeup;
          if (!writeup.document) {
            return <WriteupStatus writeup={writeup} busy={busy} onGenerate={generate} />;
          }
          return <ProfileChapter document={writeup.document} chapterId={chapter.id} />;
        }}
      />
    </DashboardWell>
  );
}
