'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CitemasLoader from '@/components/CitemasLoader';

export default function ExperienceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return <CitemasLoader label="Loading CITEMAS 3D Experience..." />;
}
