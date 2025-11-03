'use client';

import { authClient } from '@/auth/client';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function Page() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
        },
      },
    });
  }

  React.useEffect(() => {
    signOut();
  }, []);

  return null;
}
