'use client';

import { useState } from "react";
import { X } from "lucide-react";
import { PDFViewer } from "@react-pdf/renderer";
import PeriodSelector, { defaultPeriod, isoToFR, type PeriodValue } from "@/ui/components/periodSelector";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
import { UsersReport, type UserEntry } from "@/ui/pdf/UsersReport";
import type { Person } from "@/app/users/mapper";
import type { JSX } from "react";

interface UsersPdfModalProps {
  open: boolean;
  onClose: () => void;
  users: Person[];
}

function buildDocument(users: Person[], periodStart: string, periodEnd: string): JSX.Element {
  const entries: UserEntry[] = users.map((person, idx) => ({
    order: String(idx + 1).padStart(3, "0"),
    fullName: person.nom,
    country: "",
    email: person.mail,
    phone: person.tel,
  }));
  return (
    <UsersReport
      periodStart={periodStart}
      periodEnd={periodEnd}
      entries={entries}
    />
  );
}

export default function UsersPdfModal({ open, onClose, users }: UsersPdfModalProps) {
  const [reportPeriod, setReportPeriod] = useState<PeriodValue>(defaultPeriod);

  if (!open) return null;

  const periodStart = isoToFR(reportPeriod.start);
  const periodEnd = isoToFR(reportPeriod.end);
  const doc = buildDocument(users, periodStart, periodEnd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-base-300 flex-shrink-0">
          <h2 className="font-bold text-base flex-shrink-0">Rapport PDF — Utilisateurs</h2>
          <div className="flex-1 flex justify-center">
            <PeriodSelector value={reportPeriod} onChange={setReportPeriod} />
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de téléchargement */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 flex-shrink-0">
          <span className="text-sm text-white/60">
            {users.length} utilisateur{users.length > 1 ? "s" : ""}
          </span>
          <ClientPDFDownload
            label="Télécharger"
            className="btn btn-primary btn-xs rounded-full"
            fileName={`rapport-utilisateurs-${reportPeriod.start}_${reportPeriod.end}.pdf`}
            document={doc}
          />
        </div>

        {/* Prévisualisation */}
        <div className="flex-1 overflow-hidden">
          {users.length > 0 ? (
            <PDFViewer
              key={`users-${reportPeriod.start}-${reportPeriod.end}`}
              width="100%"
              height="100%"
              showToolbar={false}
            >
              {doc}
            </PDFViewer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Aucun utilisateur à afficher
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
