import { ColumnConfig } from "@/ui/components/dataTable";
import Link from "next/link";
import Image from "next/image";

export type Admin = {
  id:string;
  nom: string;
  numero: number;
  tel: string;
  mail: string;
  status: 'actif' | 'inactif';
  role: string;
  genre: 'H' | 'F' | '-';
  date: string; // ex: '2025-06-30'
  imgProfileUrl: string;
};

export const columns : ColumnConfig<Admin>[] = [
  { header: '', 
    render: (admin:Admin) => (
      <span>{admin.numero}</span>
    ) 
  },
  
  {
    header: '',
    render: (admin : Admin) => (
      <Link href={`/admins/${admin.id}`} className="flex items-center gap-3 hover:text-primary">
        <div className="avatar">
          <div className="mask mask-squircle h-12 w-12">
            <Image width={48} height={48} src={admin.imgProfileUrl} alt={admin.nom} />
          </div>
        </div>
      </Link>
    ),
  },
  {
    key: 'nom', header:'NOM',
    render: (admin:Admin) => (
      <span>{admin.nom}</span>
    ) 
  },
  
  { key: 'tel', header: 'TEL', className: 'text-primary',  
    render: (admin:Admin) => (
      <span>{admin.tel}</span>
    ),
  },
  { key: 'mail', header: 'MAIL', className: 'text-primary' },
  {
    key: 'role',
    header: 'ROLE',
    render: (admin : Admin) => (
      <span className={`badge ${admin.status === 'actif' ? 'badge-success' : 'badge-error'}`}>
        {admin.role}
      </span>
    ),
  },
  {
    key: 'genre',
    header: 'GENRE',
    render: (admin : Admin) => <span className="badge badge-ghost badge-sm">{admin.genre}</span>,
  },
  
  { key: 'date', header: 'DATE' },
];
