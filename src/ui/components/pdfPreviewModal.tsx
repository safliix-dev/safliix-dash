'use client';

import { useState, useEffect, useMemo } from "react";
import { X, Download, FileText } from "lucide-react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import PeriodSelector, { defaultPeriod, isoToFR, type PeriodValue } from "@/ui/components/periodSelector";
import ClientPDFDownload from "@/ui/components/clientPdfDownloader";
import { LocationReport, type LocationEntry } from "@/ui/pdf/LocationReport";
import { AbonnementReport, type AbonnementEntry } from "@/ui/pdf/AbonnementReport";
import { ContentListReport, type ContentListEntry } from "@/ui/pdf/ContentListReport";
import { imageRightsApi } from "@/lib/api/imageRights";
import type { RightsHolderContentResponse } from "@/types/api/imageRights";
import type { JSX } from "react";
import type { FilmListItem, RentalFilmStats, SubscriptionFilmStats } from "@/types/api/films";
import type { SeriesListItem } from "@/types/api/series";

type Mode = "location" | "abonnement";
type ContentSubtype = "regular" | "divers";

interface DisplayGroup {
  id: string;
  name: string;
  fileName: string;
  rawGroup: RightsHolderContentResponse;
}

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  contentType: "movie" | "serie";
  title?: string;
}

function buildFileName(lastName: string, contentType: string, mode: Mode, subtype: ContentSubtype): string {
  if (subtype === "divers") return `rapport-${lastName}-divers.pdf`;
  const typeLabel = contentType === "movie" ? "films" : "series";
  return `rapport-${lastName}-${typeLabel}-${mode}.pdf`;
}

function buildDocument(
  rawGroup: RightsHolderContentResponse,
  name: string,
  periodStart: string,
  periodEnd: string,
  contentType: "movie" | "serie",
  mode: Mode,
  contentSubtype: ContentSubtype,
): JSX.Element {
  if (contentSubtype === "divers") {
    const allItems = contentType === "movie" ? rawGroup.movies : rawGroup.series;
    const entries: ContentListEntry[] = allItems
      .filter(item => item.entertainmentMode === "Divers")
      .map((item, idx) => ({
        order: String(idx + 1).padStart(3, "0"),
        rightsholderName: name,
        title: item.title || "",
        category: item.category || "",
        format: item.format || "",
      }));
    return (
      <ContentListReport
        contentType="divers"
        periodStart={periodStart}
        periodEnd={periodEnd}
        entries={entries}
      />
    );
  }

  if (contentType === "movie" && mode === "location") {
    const entries: LocationEntry[] = rawGroup.movies
      .filter(m => m.entertainmentMode !== "Divers" && m.type === "location")
      .map((film, idx) => ({
        order: String(idx + 1).padStart(3, "0"),
        title: film.title,
        category: film.category || "",
        format: film.format || "",
        rentals: film.type === "location" ? (film.stats as RentalFilmStats)?.totalRentals : 0,
        totalRevenue: film.stats?.revenue || 0,
      }));
    return (
      <LocationReport
        rightsholderName={name}
        periodStart={periodStart}
        periodEnd={periodEnd}
        entries={entries}
      />
    );
  }

  // abonnement (films ou séries)
  const items =
    contentType === "movie"
      ? rawGroup.movies.filter(m => m.entertainmentMode !== "Divers" && m.type === "abonnement")
      : rawGroup.series.filter(s => s.entertainmentMode !== "Divers");

  const entries: AbonnementEntry[] = items.map((item, idx) => {
    if (contentType === "movie") {
      const film = item as FilmListItem;
      const s = film.type === "abonnement" ? film.stats as SubscriptionFilmStats : null;
      return {
        order: String(idx + 1).padStart(3, "0"),
        title: film.title,
        category: film.category || "",
        format: film.format || "",
        subscriptions: "",
        catalogDuration: s?.catalogTotalMinutes ?? "",
        viewingTime: s?.totalMinutesWatched ?? "",
        viewingPercentage: s?.subscriberViewPercentage ?? "",
        revenue: s?.revenue ?? "",
      };
    }
    const serie = item as SeriesListItem;
    const s = serie.stats;
    return {
      order: String(idx + 1).padStart(3, "0"),
      title: serie.title,
      category: serie.category || "",
      format: serie.format || "",
      subscriptions: "",
      catalogDuration: s?.catalogTotalMinutes ?? "",
      viewingTime: s?.totalMinutesWatched ?? "",
      viewingPercentage: s?.subscriberViewPercentage ?? "",
      revenue: s?.revenue ?? "",
    };
  });

  return (
    <AbonnementReport
      rightsholderName={name}
      periodStart={periodStart}
      periodEnd={periodEnd}
      entries={entries}
      contentType={contentType}
    />
  );
}

export default function PdfPreviewModal({
  open,
  onClose,
  contentType,
  title = "Rapports PDF",
}: PdfPreviewModalProps) {
  const [mode, setMode] = useState<Mode>("location");
  const [contentSubtype, setContentSubtype] = useState<ContentSubtype>("regular");
  const [reportPeriod, setReportPeriod] = useState<PeriodValue>(defaultPeriod);
  const [rawData, setRawData] = useState<RightsHolderContentResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setIsFetching(true);
    imageRightsApi
      .contentsList(contentType, { from: reportPeriod.start, to: reportPeriod.end, signal: controller.signal })
      .then(data => setRawData(data))
      .catch(err => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Erreur chargement rapports PDF:", err);
      })
      .finally(() => setIsFetching(false));
    return () => controller.abort();
  }, [open, reportPeriod, contentType]);

  const displayGroups = useMemo((): DisplayGroup[] => {
    const result: DisplayGroup[] = [];
    for (const group of rawData) {
      const items = contentType === "movie" ? group.movies : group.series;
      const relevant = items.filter(item => {
        if (contentSubtype === "divers") {
          return item.entertainmentMode === "Divers";
        }
        if (contentType === "movie") {
          const film = item as FilmListItem;
          return film.entertainmentMode !== "Divers" && film.type === mode;
        }
        return item.entertainmentMode !== "Divers";
      });
      if (relevant.length > 0) {
        result.push({
          id: group.id,
          name: `${group.firstName} ${group.lastName}`,
          fileName: buildFileName(group.lastName, contentType, mode, contentSubtype),
          rawGroup: group,
        });
      }
    }
    return result;
  }, [rawData, contentType, mode, contentSubtype]);

  useEffect(() => {
    setSelectedId(prev =>
      displayGroups.find(g => g.id === prev) ? prev : (displayGroups[0]?.id ?? "")
    );
  }, [displayGroups]);

  const selectedGroup = displayGroups.find(g => g.id === selectedId);

  const handleDownloadAll = async () => {
    if (!displayGroups.length) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const group of displayGroups) {
        const doc = buildDocument(
          group.rawGroup, group.name,
          isoToFR(reportPeriod.start), isoToFR(reportPeriod.end),
          contentType, mode, contentSubtype,
        );
        const blob = await pdf(doc).toBlob();
        zip.file(group.fileName, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapports-${contentType}-${mode}-${contentSubtype}-${reportPeriod.start}_${reportPeriod.end}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  if (!open || !isMounted) return null;

  const showModeTabs = contentType === "movie" && contentSubtype === "regular";
  const subtypeRegularLabel = contentType === "movie" ? "Films" : "Séries";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

        {/* Ligne 1 : titre + période + fermeture */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-base-300 shrink-0">
          <h2 className="font-bold text-base shrink-0">{title}</h2>
          <div className="flex-1 flex justify-center">
            <PeriodSelector value={reportPeriod} onChange={setReportPeriod} />
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ligne 2 : onglets sous-type + onglets mode */}
        <div className="flex items-center gap-3 px-6 py-2 border-b border-base-300 shrink-0 bg-base-200/30">
          {/* Sous-type : Films/Séries | Divers */}
          <div className="flex items-center gap-1">
            {([["regular", subtypeRegularLabel], ["divers", "Divers"]] as [ContentSubtype, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setContentSubtype(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  contentSubtype === val
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-white/50 hover:bg-base-200 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mode : Location | Abonnement (films, sous-type régulier seulement) */}
          {showModeTabs && (
            <>
              <div className="h-4 w-px bg-base-300" />
              <div className="flex items-center gap-1">
                {([["location", "Location"], ["abonnement", "Abonnement"]] as [Mode, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setMode(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mode === val
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-white/50 hover:bg-base-200 hover:text-white/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Corps */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-60 shrink-0 border-r border-base-300 flex flex-col p-4 gap-5">
            <div className="flex flex-col flex-1 min-h-0">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                Ayants-droit
              </p>
              {isFetching ? (
                <div className="flex items-center justify-center flex-1">
                  <span className="loading loading-spinner loading-sm" />
                </div>
              ) : (
                <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                  {displayGroups.map(group => (
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
                  {displayGroups.length === 0 && (
                    <p className="text-xs text-white/30 italic">Aucun ayant-droit</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleDownloadAll}
              disabled={isZipping || displayGroups.length === 0 || isFetching}
              className="btn btn-outline btn-primary btn-sm w-full shrink-0"
            >
              {isZipping
                ? <span className="loading loading-spinner loading-xs" />
                : <Download className="w-3.5 h-3.5" />}
              {isZipping ? "Génération ZIP..." : "Tout en ZIP"}
            </button>
          </div>

          {/* Zone de prévisualisation */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isFetching ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/30">
                <span className="loading loading-spinner loading-lg" />
                <p className="text-sm">Chargement des données...</p>
              </div>
            ) : selectedGroup ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
                  <span className="font-medium text-sm truncate">{selectedGroup.name}</span>
                  <ClientPDFDownload
                    label="Télécharger"
                    className="btn btn-primary btn-xs rounded-full"
                    fileName={selectedGroup.fileName}
                    document={buildDocument(
                      selectedGroup.rawGroup, selectedGroup.name,
                      isoToFR(reportPeriod.start), isoToFR(reportPeriod.end),
                      contentType, mode, contentSubtype,
                    )}
                  />
                </div>
                <div className="flex-1">
                  <PDFViewer
                    key={`${selectedGroup.id}-${reportPeriod.start}-${reportPeriod.end}-${mode}-${contentSubtype}`}
                    width="100%"
                    height="100%"
                    showToolbar={false}
                  >
                    {buildDocument(
                      selectedGroup.rawGroup, selectedGroup.name,
                      isoToFR(reportPeriod.start), isoToFR(reportPeriod.end),
                      contentType, mode, contentSubtype,
                    )}
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
