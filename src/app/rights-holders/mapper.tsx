import { ColumnConfig } from "@/ui/components/dataTable";
import Link from "next/link";
import { ImageRightsHolder } from "@/types/api/imageRights";



const statusTone: Record<ImageRightsHolder["status"], string> = {
  actif: "badge-success",
  "en attente": "badge-warning",
  expiré: "badge-error",
};

export const rightsHolderColumns: ColumnConfig<ImageRightsHolder>[] = [
  {
    key: "fullName",
  header: "AYANT DROIT",
  render: (holder) => (
      <Link href={`/dashboard/rights-holders/${holder.id}`} className="flex items-center gap-3 hover:text-primary">
        <div className="avatar placeholder">
          <div className="mask mask-squircle h-12 w-12 bg-primary/20 text-primary font-bold flex items-center justify-center uppercase text-xl text-center">
            {(holder.firstName || holder.lastName || "?").charAt(0)}
          </div>
        </div>
        <div>
          <div className="font-bold">{holder.firstName} {holder.lastName}</div>
          <p className="text-xs text-white/60">{holder.email}</p>
        </div>
      </Link>
    ),
  },
  {
    key: "sharePercentage",
    header: "PARTAGE",
    render: (holder) => (
      <span className="text-primary font-semibold">{holder.sharePercentage}% revenus</span>
    ),
  },
  { key: "films", header: "FILMS" },
  { key: "series", header: "SÉRIES" },
  {
    key: "status",
    header: "STATUT",
    render: (holder) => (
      <span className={`badge ${statusTone[holder.status] || "badge-ghost"}`}>{holder.status}</span>
    ),
  },
  
];
