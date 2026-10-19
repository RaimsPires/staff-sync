import { Suspense } from 'react';
import { OnboardingHost } from '@/components/screen-host';

export default function Page() {
  return (
    <Suspense>
      <OnboardingHost />
    </Suspense>
  );
}
