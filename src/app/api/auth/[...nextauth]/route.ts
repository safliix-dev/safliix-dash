import NextAuth from "next-auth";
import authOptions  from "@/lib/auth/config"; // Importe ta config v4

// On initialise NextAuth avec tes options (Keycloak, Callbacks, JWT, etc.)
const handler = NextAuth(authOptions);

// Next.js App Router exige d'exporter explicitement les méthodes HTTP
export { handler as GET, handler as POST };