'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useToast } from '@/ui/components/toast/ToastProvider';

export function SessionGuard() {
  const toast = useToast();
  const handlingRef = useRef(false);

  useEffect(() => {
    const handle = () => {
      if (handlingRef.current) return;
      handlingRef.current = true;

      toast.warning({
        title: 'Session expirée',
        description: 'Veuillez vous reconnecter.',
        duration: 3000,
      });

      setTimeout(() => signOut({ callbackUrl: '/' }), 1500);
    };

    window.addEventListener('auth:session-expired', handle);
    return () => window.removeEventListener('auth:session-expired', handle);
  }, [toast]);

  return null;
}
