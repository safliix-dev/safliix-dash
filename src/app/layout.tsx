// app/layout.tsx
import type { Metadata } from "next";
import { getServerSession, Session } from "next-auth";
import authConfig from "@/lib/auth/config";
import { Providers } from "./providers";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
  title: "safliixboard",
  description: "Le dashboard de la plateforme de VOD SaFliix",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server Component → récupération session côté serveur
  const session = await getServerSession(authConfig) as Session | null;

  return (
    <html lang="fr" data-theme="mytheme">
      <body className="antialiased">
        <Providers session={session}>
          {/* Pass session au composant client */}
          <DashboardLayoutClient>
            {children}
          </DashboardLayoutClient>
        </Providers>
      </body>
    </html>
  );
}