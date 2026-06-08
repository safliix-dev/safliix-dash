'use client';

import { useState, useEffect } from "react";
import { X, Download, FileText } from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PeriodSelector, { defaultPeriod, isoToFR, type PeriodValue } from "@/ui/components/periodSelector";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
import { RightsHolderMoviesReport, type MovieReportEntry } from "@/ui/pdf/RightsHolderMoviesReport";

export interface ReportGroup {
  id: string;
  name: string;
  fileName: string;
  entries: MovieReportEntry[];
}

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  groups: ReportGroup[];
  mode: "location" | "abonnement";
  title?: string;
}

export default function PdfPreviewModal({
  open,
  onClose,
  groups,
  mode,
  title = "Rapports PDF",
}: PdfPreviewModalProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [reportPeriod, setReportPeriod] = useState<PeriodValue>(defaultPeriod);
  const [isMounted, setIsMounted] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (groups.length > 0 && !groups.find((g) => g.id === selectedId)) {
      setSelectedId(groups[0].id);
    }
  }, [groups, selectedId]);

  const selectedGroup = groups.find((g) => g.id === selectedId);

  const handleDownloadAll = async () => {
    if (!groups.length) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const group of groups) {
        const blob = await pdf(
          <RightsHolderMoviesReport
            mode={mode}
            rightsholderName={group.name}
            periodStart={isoToFR(reportPeriod.start)}
            periodEnd={isoToFR(reportPeriod.end)}
            entries={group.entries}
          />
        ).toBlob();
        zip.file(group.fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapports-${mode}-${reportPeriod.start}_${reportPeriod.end}.zip`;
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
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-base-300 flex-shrink-0">
          <h2 className="font-bold text-base flex-shrink-0">{title}</h2>
          <div className="flex-1 flex justify-center">
            <PeriodSelector value={reportPeriod} onChange={setReportPeriod} />
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-60 flex-shrink-0 border-r border-base-300 flex flex-col p-4 gap-5">
            <div className="flex flex-col flex-1 min-h-0">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Ayants-droit</p>
              <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedId(group.id)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                      selectedId === group.id
                        ? "bg-primary/15 text-primary font-semibold"
                        : "hover:bg-base-200 text-white/70"
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
                {groups.length === 0 && (
                  <p className="text-xs text-white/30 italic">Aucun ayant-droit</p>
                )}
              </div>
            </div>

            <button
              onClick={handleDownloadAll}
              disabled={isZipping || groups.length === 0}
              className="btn btn-outline btn-primary btn-sm w-full flex-shrink-0"
            >
              {isZipping ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isZipping ? "Génération ZIP..." : "Tout en ZIP"}
            </button>
          </div>

          {/* Preview area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedGroup ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 flex-shrink-0">
                  <span className="font-medium text-sm truncate">{selectedGroup.name}</span>
                  <ClientPDFDownload
                    label="Télécharger"
                    className="btn btn-primary btn-xs rounded-full"
                    fileName={selectedGroup.fileName}
                    document={
                      <RightsHolderMoviesReport
                        mode={mode}
                        rightsholderName={selectedGroup.name}
                        periodStart={isoToFR(reportPeriod.start)}
                        periodEnd={isoToFR(reportPeriod.end)}
                        entries={selectedGroup.entries}
                      />
                    }
                  />
                </div>
                <div className="flex-1">
                  <PDFViewer
                    key={`${selectedGroup.id}-${reportPeriod.start}-${reportPeriod.end}-${mode}`}
                    width="100%"
                    height="100%"
                    showToolbar={false}
                  >
                    <RightsHolderMoviesReport
                      mode={mode}
                      rightsholderName={selectedGroup.name}
                      periodStart={isoToFR(reportPeriod.start)}
                      periodEnd={isoToFR(reportPeriod.end)}
                      entries={selectedGroup.entries}
                    />
                  </PDFViewer>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/30">
                <FileText className="w-12 h-12" />
                <p className="text-sm">Sélectionnez un ayant-droit pour prévisualiser</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
