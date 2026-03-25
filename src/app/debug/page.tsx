// app/debug/page.tsx
import { getServerSession } from "next-auth";
import authConfig  from "@/lib/auth/config";

export default async function DebugPage() {
  const session = await getServerSession(authConfig);
  
  return (
    <pre>
      {JSON.stringify({
        session,
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
          KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
        }
      }, null, 2)}
    </pre>
  );
}