'use client';

import DataTable from "@/ui/components/dataTable";
import { Subscription,columnsSub } from "./mapper";

export default function Page(){

  const subscriptions: Subscription[] = [
  {
    date: '2025-01-15',
    user: 'Alice Doe',
    recipient: 'Alice Doe',
    location: 'Paris',
    status: 'e',
    planType: 'P',
    currency: 'EUR',
    cost: 10,
    tax: 1.8,
    total: 11.8,
  },
  {
    date: '2025-01-17',
    user: 'John Smith',
    recipient: 'John Smith',
    location: 'Berlin',
    status: 'p',
    planType: 'B',
    currency: 'EUR',
    cost: 5,
    tax: 0.9,
    total: 5.9,
  },
  {
    date: '2025-02-01',
    user: 'Fatima Khaled',
    recipient: 'Fatima Khaled',
    location: 'Casablanca',
    status: 'e',
    planType: 'P',
    currency: 'MAD',
    cost: 100,
    tax: 20,
    total: 120,
  },
  {
    date: '2025-02-05',
    user: 'Carlos Mendes',
    recipient: 'Ana Mendes',
    location: 'Lisbon',
    status: 'e',
    planType: 'B',
    currency: 'EUR',
    cost: 6,
    tax: 1.2,
    total: 7.2,
  },
  {
    date: '2025-02-10',
    user: 'Maria Gonzalez',
    recipient: 'Maria Gonzalez',
    location: 'Madrid',
    status: 'p',
    planType: 'P',
    currency: 'EUR',
    cost: 12,
    tax: 2.4,
    total: 14.4,
  },
  {
    date: '2025-02-12',
    user: 'Jean Kouassi',
    recipient: 'Jean Kouassi',
    location: 'Abidjan',
    status: 'e',
    planType: 'B',
    currency: 'XOF',
    cost: 3000,
    tax: 600,
    total: 3600,
  },
  {
    date: '2025-02-13',
    user: 'Sara Lee',
    recipient: 'Tom Lee',
    location: 'Seoul',
    status: 'e',
    planType: 'P',
    currency: 'KRW',
    cost: 9000,
    tax: 1800,
    total: 10800,
  },
  {
    date: '2025-02-14',
    user: 'Mehdi Djalil',
    recipient: 'Mehdi Djalil',
    location: 'Tunis',
    status: 'p',
    planType: 'B',
    currency: 'TND',
    cost: 8,
    tax: 1.6,
    total: 9.6,
  },
  {
    date: '2025-02-15',
    user: 'Lucie Ndom',
    recipient: 'Lucie Ndom',
    location: 'Yaoundé',
    status: 'e',
    planType: 'P',
    currency: 'XAF',
    cost: 5000,
    tax: 1000,
    total: 6000,
  },
  {
    date: '2025-02-18',
    user: 'Omar Sy',
    recipient: 'Omar Sy',
    location: 'Dakar',
    status: 'e',
    planType: 'P',
    currency: 'XOF',
    cost: 4500,
    tax: 900,
    total: 5400,
  },
  {
    date: '2025-02-19',
    user: 'Anna Kim',
    recipient: 'Minho Kim',
    location: 'Busan',
    status: 'p',
    planType: 'B',
    currency: 'KRW',
    cost: 7000,
    tax: 1400,
    total: 8400,
  },
  {
    date: '2025-02-20',
    user: 'Mohamed Diallo',
    recipient: 'Mohamed Diallo',
    location: 'Conakry',
    status: 'e',
    planType: 'B',
    currency: 'GNF',
    cost: 50000,
    tax: 10000,
    total: 60000,
  },
  {
    date: '2025-02-22',
    user: 'Emily Wong',
    recipient: 'Emily Wong',
    location: 'Singapore',
    status: 'p',
    planType: 'P',
    currency: 'SGD',
    cost: 15,
    tax: 3,
    total: 18,
  },
  {
    date: '2025-02-24',
    user: 'Thierry Bako',
    recipient: 'Thierry Bako',
    location: 'Cotonou',
    status: 'e',
    planType: 'B',
    currency: 'XOF',
    cost: 3500,
    tax: 700,
    total: 4200,
  },
  {
    date: '2025-02-26',
    user: 'Awa Traoré',
    recipient: 'Mariam Traoré',
    location: 'Bamako',
    status: 'e',
    planType: 'P',
    currency: 'XOF',
    cost: 6000,
    tax: 1200,
    total: 7200,
  }
];

  return (
    <div className="">
      
      <div className="tabs tabs-lift">
        <input type="radio" name="my_tabs_3" className="tab" aria-label="Abonnement" />
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <DataTable data={subscriptions} columns={columnsSub}/>
        </div>

        <input type="radio" name="my_tabs_3" className="tab" aria-label="Location" defaultChecked />
        <div className="tab-content bg-base-100 border-base-300 p-6">Tab content 2</div>

        
      </div>
    </div>
  )
}