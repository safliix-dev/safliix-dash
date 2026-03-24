import Link from "next/link";
export default function Unauthorized() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Accès Refusé 🛑</h1>
      <p>Désolé, seul un <strong>super_admin</strong> peut accéder à cette section de SaFliix.</p>
      <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}