import { ColumnConfig } from "@/ui/components/dataTable";
import { Clock } from "lucide-react";

export type Subscription = {
  date: string;
  user: string;
  recipient: string;
  location: string;
  status: 'p' | 'e'; // p: pending, e: executed
  planType: 'B' | 'P'; // B: Basic, P: Premium
  currency: string;
  cost: number;
  tax: number;
  total: number;
};





export const columnsSub : ColumnConfig<Subscription>[] = [
  {
    key: 'date',
    header: 'DATE',
    render: (date : Subscription) => (
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4"/>
        <span>{date.date}</span>
      </div>
    ),
  },
  { key: 'user', header: 'USER' },
  { key: 'recipient', header: 'DESTINATAIRE', className: 'text-primary' },
  { key: 'location', header: 'LOCATION', className: 'text-primary' },
  {
    key: 'status',
    header: 'STATUS',
    render: (sub : Subscription) => (
      <span className={`badge ${sub.status === 'p' ? 'badge-success' : 'badge-error'}`}>
        {sub.status}
      </span>
    ),
  },
  {
    key: 'planType',
    header: 'GENRE',
    render: (sub : Subscription) => <span className="badge badge-ghost badge-sm">{sub.planType}</span>,
  },
  {
    key: 'currency',
    header: 'MONNAIE',
    
  },
  { key: 'cost', header: 'COUT' },
  { key: 'tax', header: 'TAX' },
  { key: 'total', header: 'TOTAL' },
];
