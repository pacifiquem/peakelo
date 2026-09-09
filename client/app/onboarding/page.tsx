'use client';

import { Suspense } from 'react';

import { OnboardingFlow } from './onboarding-flow';

export default function OnboardingPage() {
  return (
    <Suspense fallback={<main className="px-6 py-16">Loading…</main>}>
      <OnboardingFlow />
    </Suspense>
  );
}
