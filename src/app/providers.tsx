'use client';

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/ui/components/toast/ToastProvider";
import { SessionGuard } from "@/ui/components/SessionGuard";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>
        <SessionGuard />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
