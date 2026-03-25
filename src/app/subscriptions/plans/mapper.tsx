import type { ColumnConfig } from "@/ui/components/dataTable";
import { PlanItem } from "@/types/api/subscriptions";


export const columns: ColumnConfig <PlanItem>[] = [
  {
    key: "name",
    header: "Plan",
    render: (plan) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">{plan.name}</span>
        <span
          className={`badge ${
            plan.status === "Actif" ? "badge-success" : "badge-ghost"
          }`}
        >
          {plan.status || "—"}
        </span>
      </div>
    ),
  },
  {
    key: "price",
    header: "Tarif",
    render: (plan) => `${plan.price} ${plan.currency || "XOF"}`,
  },
  {
    header: "Rabais (%)",
    render: (plan) => `${plan.yearlyDiscount}`
  },
  {
    header: "Tarif Annuel",
    render: (plan) => `${plan.price * 12 - ( 1 - plan.yearlyDiscount/ 100)}`
  },
  {
    key: "maxSharedAccounts",
    header: "Appareils",
  },
  {
    header: "Qualité",
    render: (plan) => plan.videoQuality
  }
  
];
