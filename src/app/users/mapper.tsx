import { ColumnConfig } from "@/ui/components/dataTable";
import Link from "next/link";
import Image from "next/image";

export type Person = {
  id:string;
  nom: string;
  numero: number;
  tel: string;
  mail: string;
  status: string;
  genre: 'H' | 'F' | '-';
  date: string; // ex: '2025-06-30'
  imgProfileUrl: string;
};

export const columns : ColumnConfig<Person>[] = [
  { key: 'numero', header: 'ID' },
  {
    header: '',
    render: (person : Person) => (
      <Link href={`/users/${person.numero}`} className="flex items-center gap-3 hover:text-primary">
        <div className="avatar">
          <div className="mask mask-squircle h-12 w-12">
            <Image width={48} height={48} src={person.imgProfileUrl} alt={person.nom} />
          </div>
        </div>
        
      </Link>
    ),
  },

  { header: 'TEL', 
    className: 'text-primary',
    render: (person:Person) => <span>{`${person.nom}`}</span> 
  
  },
  
  { key: 'tel', header: 'TEL', className: 'text-primary' },
  { key: 'mail', header: 'MAIL', className: 'text-primary' },
  {
    key: 'status',
    header: 'STATUS',
    render: (person : Person) => (
      <span className={`badge ${person.status === 'actif' ? 'badge-success' : 'badge-error'}`}>
        {person.status}
      </span>
    ),
  },
  {
    key: 'genre',
    header: 'GENRE',
    render: (person : Person) => <span className="badge badge-ghost badge-sm">{person.genre}</span>,
  },
  {
    key: 'numero',
    header: 'TOP USER',
    render: (person : Person) =>
      person.numero <= 3 ? (
        <span className="badge badge-primary">Top</span>
      ) : (
        <span className="badge badge-ghost">-</span>
      ),
  },
  { key: 'date', header: 'DATE' },
];
