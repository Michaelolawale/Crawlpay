'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyAuditRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const target = searchParams.get('target');
    if (target) {
      router.replace(`/app/audit?target=${encodeURIComponent(target)}`);
    } else {
      router.replace('/app/audit');
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafb] text-ink">
      <div className="text-center">
        <p className="text-sm font-medium text-graphite-600 animate-pulse">Redirecting to Crawlpay App...</p>
      </div>
    </div>
  );
}

export default function LegacyAuditRedirect() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafafb] text-ink">
          <div className="text-center">
            <p className="text-sm font-medium text-graphite-600 animate-pulse">Loading Crawlpay...</p>
          </div>
        </div>
      }
    >
      <LegacyAuditRedirectContent />
    </Suspense>
  );
}