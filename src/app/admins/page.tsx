'use client';

import Header from "@/ui/components/header";
import DataTable from "@/ui/components/dataTable";
import { Admin, columns } from "./mapper";
import { useEffect, useState } from "react";
import { adminsApi } from "@/lib/api/admin";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmationDialog from "@/ui/components/confirmationDialog";
import { useDeleteWithConfirmation } from "@/lib/hooks/useDeletionWithConfirmation";

const placeholderAvatar = "/gildas.png";

export default function Page() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAccessToken();
  const toast = useToast();
  const router = useRouter();

  /** 🧨 Hook suppression */
  const deleteAdmin = useDeleteWithConfirmation<Admin>({
    entityName: "le compte administrateur",
    getLabel: (a) => a.nom,
    deleteFn: (id:string) => adminsApi.delete(id, accessToken),
    onDeleted: (id:string) =>
      setAdmins((prev) => prev.filter((a) => a.id !== id)),
  });

  const isConfirmDisabled =
  deleteAdmin.confirmText !== "SUPPRIMER" ||
  deleteAdmin.status === "loading";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminsApi.list({ page: 1, pageSize: 20 }, accessToken);

        const mapped: Admin[] = res.items.map((u, idx) => ({
          id: u.id,
          nom: `${u.firstName} ${u.lastName}`,
          numero: idx + 1,
          tel: u.phoneNumber || "",
          mail: u.email || "",
          role: u.role ?? "ADMIN",
          status: (u.status || "").toLowerCase() as "actif" | "inactif",
          genre: "-",
          date: u.createdAt || "",
          imgProfileUrl: u.avatar || placeholderAvatar,
        }));

        setAdmins(mapped);
      } catch (err) {
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Admins", description: friendly.message });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accessToken, toast]);

  return (
    <div>
      <Header title="Utilisateurs">
        <Link href="/dashboard/admins/add/new" className="btn btn-sm btn-primary">
          Ajouter un admin
        </Link>
      </Header>

      {loading && (
        <div className="alert alert-info text-sm mt-3">
          Chargement des admins…
        </div>
      )}

      {error && (
        <div className="alert alert-error text-sm mt-3">{error}</div>
      )}

      <div className="mt-4">
        <DataTable
          data={admins}
          columns={columns}
          actions={[
            {
              label: "Voir",
              className: "btn-info",
              onClick: (row) =>
                router.push(`/dashboard/admins/${row.id}`),
            },
            {
              label: "Modifier",
              className: "btn-warning",
              onClick: (row) =>
                router.push(`/dashboard/admins/add/${row.id}`),
            },
            {
              label: "Supprimer",
              className: "btn-error",
              onClick: deleteAdmin.openDialog,
            },
          ]}
        />
      </div>

      <ConfirmationDialog
        open={deleteAdmin.open}
        title="Suppression définitive"
        message={deleteAdmin.dialogMessage}
        status={deleteAdmin.status}
        resultMessage={deleteAdmin.resultMessage}
        confirmDisabled={isConfirmDisabled}
        onConfirm={deleteAdmin.confirmDelete}
        onCancel={deleteAdmin.closeDialog}
      >
        <div className="space-y-2">
          <p className="text-sm text-white/80">
            Tapez <strong className="text-red-400">SUPPRIMER</strong> pour confirmer :
          </p>

          <input
            type="text"
            value={deleteAdmin.confirmText}
            onChange={(e) => deleteAdmin.setConfirmText(e.target.value)}
            placeholder="SUPPRIMER"
            className="input input-bordered w-full bg-base-200 border-red-500"
            disabled={deleteAdmin.status === "loading"}
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
}
