// app/debug/page.tsx
import { getServerSession } from "next-auth";
import authConfig from "@/lib/auth/config";
import Link from "next/link";
export default async function DebugPage() {
  // Récupérer la session côté serveur
  const session = await getServerSession(authConfig);
  
  // Variables d'environnement (ne pas exposer en prod)
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
    NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
  };

  // Tester la connexion à Keycloak
  let keycloakStatus = "Non testé";
  try {
    const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`);
    keycloakStatus = response.ok ? "✅ Accessible" : "❌ Inaccessible";
  } catch (error) {
    keycloakStatus = "❌ Erreur de connexion" + error;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>🔍 Page de Debug</h1>
      
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", borderRadius: "5px" }}>
        <h2>📡 Session</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", borderRadius: "5px" }}>
        <h2>⚙️ Environnement</h2>
        <pre>{JSON.stringify(envVars, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", borderRadius: "5px" }}>
        <h2>🔗 Keycloak</h2>
        <p>Statut: {keycloakStatus}</p>
        <p>Issuer: {process.env.KEYCLOAK_ISSUER}</p>
      </div>
      
      <div style={{ marginTop: "20px" }}>
        <h3>Actions:</h3>
        <ul>
          <li>
            <Link href="/api/auth/signin/keycloak" style={{ color: "blue" }}>
              🔐 Se connecter avec Keycloak
            </Link>
          </li>
          <li>
            <Link href="/" style={{ color: "blue" }}>
              🏠 Retour à l&apos;accueil
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}