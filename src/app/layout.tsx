import type { Metadata } from "next";
import { getServerSession,Session } from "next-auth";
import authConfig from "@/lib/auth/config";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "safliixboard",
  description: "Le dashboard de la plateforme de VOD SaFliix",
  
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authConfig) as Session | null;

  return (
    <html lang="fr" data-theme="mytheme">
      <body
        className={`antialiased`}
      > 
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
