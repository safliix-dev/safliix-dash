'use client';

import Header from "@/ui/components/header";
import DataTable from "@/ui/components/dataTable";
import { Person,columns } from "./mapper";
import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api/users";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { useDeleteWithConfirmation } from "@/lib/hooks/useDeletionWithConfirmation";

const placeholderAvatar = "/gildas.png";

export default function Page() {
  const [personnes, setPersonnes] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();
  const router = useRouter();

  const deletePerson = useDeleteWithConfirmation<Person>({
      entityName: "le compte administrateur",
      getLabel: (p) => p.nom,
      deleteFn: (id:string) => usersApi.delete(id, accessToken),
      onDeleted: (id:string) => setPersonnes((prev) => prev.filter((a) => a.id !== id)),
        
    });
    
      const isConfirmDisabled =
      deletePerson.confirmText !== "SUPPRIMER" ||
      deletePerson.status === "loading";
    
  
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await usersApi.list({ page: 1, pageSize: 20 }, accessToken);
        if (cancelled) return;
        console.dir(res, {depth:2});
        const mapped: Person[] = res.items.map((u, idx) => ({
          id:u.id,
          nom: `${u.firstName} ${u.lastName}`,
          numero: idx + 1,
          tel: u.phone || "",
          mail: u.email || "",
          status: (u.status || "").toLowerCase(),
          genre: "-",
          date: u.createdAt || "",
          imgProfileUrl: u.avatar || placeholderAvatar,
        }));
        setPersonnes(mapped);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Utilisateurs", description: friendly.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [accessToken, toast]);

  return (
    <div className="">
      <Header title="Utilisateurs">
        <Link href={"/dashboard/users/edit/new"} className="btn btn-primary">Ajouter un utilisateur</Link>
      </Header>
      {loading && <div className="alert alert-info text-sm mt-3">Chargement des utilisateurs...</div>}
      {error && <div className="alert alert-error text-sm mt-3">{error}</div>}
      <div className="mt-4">
       <DataTable data={personnes} columns={columns} actions={
          [{
              label: "Voir",
              className: "btn-info",
              onClick: (row) =>
                router.push(`/dashboard/users/${row.id}`),
            },
            {
              label: "Modifier",
              className: "btn-warning",
              onClick: (row) =>
                router.push(`/dashboard/users/edit/${row.id}`),
            },
            {
              label: "Supprimer",
              className: "btn-error",
              onClick: deletePerson.openDialog,
            },
       ]} />
       {!loading && !error && personnes.length === 0 && (
        <p className="text-sm text-white/70 mt-3">Aucun utilisateur.</p>
       )}
      </div>
      <ConfirmationDialog
                open={deletePerson.open}
                title="Suppression définitive"
                message={deletePerson.dialogMessage}
                status={deletePerson.status}
                resultMessage={deletePerson.resultMessage}
                confirmDisabled={isConfirmDisabled}
                onConfirm={deletePerson.confirmDelete}
                onCancel={deletePerson.closeDialog}
              >
                <div className="space-y-2">
                  <p className="text-sm text-white/80">
                    Tapez <strong className="text-red-400">SUPPRIMER</strong> pour confirmer :
                  </p>
        
                  <input
                    type="text"
                    value={deletePerson.confirmText}
                    onChange={(e) => deletePerson.setConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="input input-bordered w-full bg-base-200 border-red-500"
                    disabled={deletePerson.status === "loading"}
                  />
                </div>
              </ConfirmationDialog>
  </div>
);
} 
