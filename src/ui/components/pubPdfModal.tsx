'use client';

import { useState, useEffect, useMemo } from "react";
import { X, Download, FileText } from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PeriodSelector, { defaultPeriod, isoToFR, type PeriodValue } from "@/ui/components/periodSelector";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
import { PubReport, type PubEntry } from "@/ui/pdf/PubReport";
import { FinancePubReport, type FinancePubEntry } from "@/ui/pdf/FinancePubReport";
import { adsApi } from "@/lib/api/ads";
import type { AdsItem } from "@/types/api/ads";
import type { JSX } from "react";

type ReportMode = "client" | "general";

interface ClientGroup {
  name: string;
  ads: AdsItem[];
}

interface PubPdfModalProps {
  open: boolean;
  onClose: () => void;
}

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function getClientName(ad: AdsItem): string {
  return ad.clientName || ad.title || "Client inconnu";
}

function buildPubDocument(group: ClientGroup, periodStart: string, periodEnd: string): JSX.Element {
  const entries: PubEntry[] = group.ads.map((ad, idx) => ({
    order: String(idx + 1).padStart(3, "0"),
    title: ad.creativeTitle || ad.title || "",
    views: toNum(ad.stats?.views ?? ad.stats?.vues ?? 0),
    clicks: toNum(ad.stats?.interactions ?? ad.stats?.clicks ?? ad.stats?.conversions ?? 0),
  }));
  return (
    <PubReport
      clientName={group.name}
      periodStart={periodStart}
      periodEnd={periodEnd}
      entries={entries}
    />
  );
}

function buildFinanceDocument(ads: AdsItem[], periodStart: string, periodEnd: string): JSX.Element {
  const entries: FinancePubEntry[] = ads.map((ad, idx) => ({
    order: String(idx + 1).padStart(3, "0"),
    clientName: getClientName(ad),
    title: ad.creativeTitle || ad.title || "",
    views: toNum(ad.stats?.views ?? ad.stats?.vues ?? 0),
    clicks: toNum(ad.stats?.interactions ?? ad.stats?.clicks ?? ad.stats?.conversions ?? 0),
  }));
  return (
    <FinancePubReport
      periodStart={periodStart}
      periodEnd={periodEnd}
      entries={entries}
    />
  );
}

export default function PubPdfModal({ open, onClose }: PubPdfModalProps) {
  const [reportMode, setReportMode] = useState<ReportMode>("client");
  const [reportPeriod, setReportPeriod] = useState<PeriodValue>(defaultPeriod);
  const [rawAds, setRawAds] = useState<AdsItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setIsFetching(true);
    adsApi
      .list({ from: reportPeriod.start, to: reportPeriod.end, page: 1, pageSize: 200 }, controller.signal)
      .then(res => {
        const items: AdsItem[] = Array.isArray(res) ? res : ((res as { items?: AdsItem[] }).items ?? []);
        setRawAds(items);
      })
      .catch(err => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Erreur chargement pubs PDF:", err);
      })
      .finally(() => setIsFetching(false));
    return () => controller.abort();
  }, [open, reportPeriod]);

  const clientGroups = useMemo((): ClientGroup[] => {
    const map = new Map<string, AdsItem[]>();
    for (const ad of rawAds) {
      const key = getClientName(ad);
      map.set(key, [...(map.get(key) ?? []), ad]);
    }
    return Array.from(map.entries()).map(([name, ads]) => ({ name, ads }));
  }, [rawAds]);

  useEffect(() => {
    setSelectedClient(prev =>
      clientGroups.find(g => g.name === prev) ? prev : (clientGroups[0]?.name ?? "")
    );
  }, [clientGroups]);

  const selectedGroup = clientGroups.find(g => g.name === selectedClient);

  const handleDownloadAll = async () => {
    if (!clientGroups.length) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const group of clientGroups) {
        const doc = buildPubDocument(group, isoToFR(reportPeriod.start), isoToFR(reportPeriod.end));
        const blob = await pdf(doc).toBlob();
        zip.file(`rapport-pub-${group.name}.pdf`, blob);
      }
      // Ajoute aussi le rapport général dans le ZIP
      const generalDoc = buildFinanceDocument(rawAds, isoToFR(reportPeriod.start), isoToFR(reportPeriod.end));
      const generalBlob = await pdf(generalDoc).toBlob();
      zip.file(`rapport-pub-general.pdf`, generalBlob);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapports-pub-${reportPeriod.start}_${reportPeriod.end}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  if (!open || !isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

        {/* Ligne 1 : titre + période + fermeture */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-base-300 flex-shrink-0">
          <h2 className="font-bold text-base flex-shrink-0">Rapports PDF — Pubs</h2>
          <div className="flex-1 flex justify-center">
            <PeriodSelector value={reportPeriod} onChange={setReportPeriod} />
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ligne 2 : onglets type de rapport */}
        <div className="flex items-center gap-3 px-6 py-2 border-b border-base-300 flex-shrink-0 bg-base-200/30">
          {([["client", "Par client"], ["general", "Rapport général"]] as [ReportMode, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setReportMode(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                reportMode === val
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-white/50 hover:bg-base-200 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Corps */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (uniquement en mode "par client") */}
          {reportMode === "client" && (
            <div className="w-60 flex-shrink-0 border-r border-base-300 flex flex-col p-4 gap-5">
              <div className="flex flex-col flex-1 min-h-0">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                  Clients
                </p>
                {isFetching ? (
                  <div className="flex items-center justify-center flex-1">
                    <span className="loading loading-spinner loading-sm" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                    {clientGroups.map(group => (
                      <button
                        key={group.name}
                        onClick={() => setSelectedClient(group.name)}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                          selectedClient === group.name
                            ? "bg-primary/15 text-primary font-semibold"
                            : "hover:bg-base-200 text-white/70"
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                    {clientGroups.length === 0 && (
                      <p className="text-xs text-white/30 italic">Aucun client</p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleDownloadAll}
                disabled={isZipping || clientGroups.length === 0 || isFetching}
                className="btn btn-outline btn-primary btn-sm w-full flex-shrink-0"
              >
                {isZipping
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Download className="w-3.5 h-3.5" />}
                {isZipping ? "Génération ZIP..." : "Tout en ZIP"}
              </button>
            </div>
          )}

          {/* Zone de prévisualisation */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isFetching ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/30">
                <span className="loading loading-spinner loading-lg" />
                <p className="text-sm">Chargement des données...</p>
              </div>
            ) : reportMode === "general" ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 flex-shrink-0">
                  <span className="font-medium text-sm">Rapport général des pubs</span>
                  <ClientPDFDownload
                    label="Télécharger"
                    className="btn btn-primary btn-xs rounded-full"
                    fileName={`rapport-pub-general-${reportPeriod.start}_${reportPeriod.end}.pdf`}
                    document={buildFinanceDocument(rawAds, isoToFR(reportPeriod.start), isoToFR(reportPeriod.end))}
                  />
                </div>
                <div className="flex-1">
                  {rawAds.length > 0 ? (
                    <PDFViewer
                      key={`general-${reportPeriod.start}-${reportPeriod.end}`}
                      width="100%"
                      height="100%"
                      showToolbar={false}
                    >
                      {buildFinanceDocument(rawAds, isoToFR(reportPeriod.start), isoToFR(reportPeriod.end))}
                    </PDFViewer>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/30">
                      <FileText className="w-12 h-12" />
                      <p className="text-sm">Aucune donnée sur cette période</p>
                    </div>
                  )}
                </div>
              </>
            ) : selectedGroup ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 flex-shrink-0">
                  <span className="font-medium text-sm truncate">{selectedGroup.name}</span>
                  <ClientPDFDownload
                    label="Télécharger"
                    className="btn btn-primary btn-xs rounded-full"
                    fileName={`rapport-pub-${selectedGroup.name}-${reportPeriod.start}_${reportPeriod.end}.pdf`}
                    document={buildPubDocument(selectedGroup, isoToFR(reportPeriod.start), isoToFR(reportPeriod.end))}
                  />
                </div>
                <div className="flex-1">
                  <PDFViewer
                    key={`${selectedGroup.name}-${reportPeriod.start}-${reportPeriod.end}`}
                    width="100%"
                    height="100%"
                    showToolbar={false}
                  >
                    {buildPubDocument(selectedGroup, isoToFR(reportPeriod.start), isoToFR(reportPeriod.end))}
                  </PDFViewer>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/30">
                <FileText className="w-12 h-12" />
                <p className="text-sm">Sélectionnez un client pour prévisualiser</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
