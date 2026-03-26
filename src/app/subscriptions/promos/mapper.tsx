import type { ColumnConfig } from "@/ui/components/dataTable";
import { PromotionItem} from "@/types/api/subscriptions";


export const columns: ColumnConfig <PromotionItem>[] = [
  {
    key: "name",
    header: "Promo",
    render: (promo) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">{promo.name}</span>
      </div>
    ),
  },
  {
    key: "startDate",
    header: "Date de début",
    render: (p) => p.startDate,
  },
  {
    key: "endDate",
    header: "Date de fin",
    render: (p) => p.endDate
  },
  
 {
  key: "isActive",
  header: "Status",
  render: (p) => (
    <div className="flex items-center justify-center p-2 rounded-full">
      {p.isActive ? (
        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
          Oui
        </span>
      ) : (
        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
          Non
        </span>
      )}
    </div>
  ),
}

  
  
];
