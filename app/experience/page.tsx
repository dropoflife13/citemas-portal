'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExperienceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070305] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/20 border-t-red-500" />
        <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Loading CITEMAS 3D Experience...</span>
      </div>
    </div>
  );
}
