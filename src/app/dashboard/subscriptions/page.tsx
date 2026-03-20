'use client';

import Header from "@/ui/components/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import { useAccessToken } from "@/lib/auth/useAccessToken";
import { formatApiError } from "@/lib/api/errors";
import { useToast } from "@/ui/components/toast/ToastProvider";

const placeholderAvatar = "/gildas.png";

type Transaction = {
  profile: string;
  method: string;
  type: string;
  pays: string;
  monnaie: string;
  cout: number;
  tax: number;
  total: number;
  id: string;
};


export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAccessToken();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await subscriptionsApi.list({ page: 1, pageSize: 20 }, accessToken);
        if (cancelled) return;
        const mapped: Transaction[] = res.items.map((s) => ({
          id: s.id,
          profile: s.userName || s.userId,
          method: s.paymentMethod,
          type: s.planId,
          pays: s.country || "",
          monnaie: s.currency || "XOF",
          cout: s.total ?? 0,
          tax: 0,
          total: s.total ?? 0,
        }));
        setTransactions(mapped);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        const friendly = formatApiError(err);
        setError(friendly.message);
        toast.error({ title: "Abonnements", description: friendly.message });
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
    <div>
      <Header title="Abonnements" className="rounded-2xl border border-base-300 px-5 py-3">
        
        <div className="mb-3 flex items-center gap-2">
        <Link href="/dashboard/subscriptions/plans" className="btn btn-ghost btn-sm border-base-300 rounded-full">
          Voir les plans
        </Link>
        <Link href="/dashboard/subscriptions/promos" className="btn btn-secondary btn-sm rounded-full ml-2">
          Voir les promos
        </Link>
      </div>
      </Header>
      
      {loading && <div className="alert alert-info text-sm">Chargement des abonnements...</div>}
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <div className="mt-4 bg-neutral shadow-base-200 shadow-xl">
        <table className="table table-zebra text-sm">
          {/* head */}
          <thead className="bg-base-200">
            <tr>
              <th>PROFILE</th>
              <th>METHOD</th>
              <th>TYPE</th>
              <th>PAYS</th>
              <th>MONNAIE</th>
              <th>COUT</th>
              <th>TAX</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="mask mask-squircle h-12 w-12">
                        <img
                          src={placeholderAvatar}
                          alt={transaction.profile}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{transaction.profile}</div>
                    </div>
                  </div>
                </td>
                <td>{transaction.method}</td>
                <td>{transaction.type}</td>
                <td>{transaction.pays}</td>
                <td>{transaction.monnaie}</td>
                <td>{transaction.cout.toLocaleString('fr-FR', { style: 'currency', currency: transaction.monnaie })}</td>
                <td>{transaction.tax.toLocaleString('fr-FR', { style: 'currency', currency: transaction.monnaie })}</td>
                <td>{transaction.total.toLocaleString('fr-FR', { style: 'currency', currency: transaction.monnaie })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && transactions.length === 0 && (
          <div className="p-4 text-sm text-white/70">Aucune transaction d&apos;abonnement.</div>
        )}
      </div>
    </div>
       
  )
}
