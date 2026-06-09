'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Eye, X, Download } from 'lucide-react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import PeriodSelector, { defaultPeriod, isoToFR, type PeriodValue } from '@/ui/components/periodSelector';
import ClientPDFDownload from '@/ui/components/clientPdfDownloader';
import { FinanceLocationReport, type FinanceLocationEntry } from '@/ui/pdf/FinanceLocationReport';
import { FinanceAbonnementReport, type FinanceAbonnementEntry } from '@/ui/pdf/FinanceAbonnementReport';
import { ContentListReport, type ContentListEntry } from '@/ui/pdf/ContentListReport';
import { imageRightsApi } from '@/lib/api/imageRights';
import type { RightsHolderContentResponse } from '@/types/api/imageRights';
import type { JSX } from 'react';

// ─── Définition des rapports disponibles ─────────────────────────────────────

type ReportId = 'finance-location' | 'finance-abonnement' | 'liste-films' | 'liste-series' | 'liste-divers';

const REPORTS: { id: ReportId; title: string; subtitle: string; color: string }[] = [
  {
    id: 'finance-location',
    title: 'Finance Location',
    subtitle: 'Tous les ayants-droits · Revenus de location par film',
    color: '#8BC34A',
  },
  {
    id: 'finance-abonnement',
    title: 'Finance Abonnement',
    subtitle: 'Tous les ayants-droits · Revenus d\'abonnement par film',
    color: '#0EA5E9',
  },
  {
    id: 'liste-films',
    title: 'Liste des Films',
    subtitle: 'Catalogue complet des films par ayant-droit',
    color: '#14B8A6',
  },
  {
    id: 'liste-series',
    title: 'Liste des Séries',
    subtitle: 'Catalogue complet des séries par ayant-droit',
    color: '#14B8A6',
  },
  {
    id: 'liste-divers',
    title: 'Vidéos Divers',
    subtitle: 'Contenus divers par ayant-droit',
    color: '#14B8A6',
  },
];

// ─── Constructeurs de documents PDF ──────────────────────────────────────────

function buildFinanceLocation(
  movies: RightsHolderContentResponse[],
  pStart: string,
  pEnd: string,
): JSX.Element {
  let n = 1;
  const entries: FinanceLocationEntry[] = movies.flatMap(group => {
    const name = `${group.firstName} ${group.lastName}`;
    return group.movies
      .filter(m => m.type === 'location' && m.entertainmentMode !== 'Divers')
      .map(film => ({
        order: String(n++).padStart(3, '0'),
        rightsholderName: name,
        title: film.title,
        category: film.category || '',
        format: film.format || '',
        rentals: film.stats?.type === 'location' ? film.stats.stats.totalRentals : '',
        totalRevenue: film.stats?.stats.revenue || '',
      }));
  });
  return <FinanceLocationReport periodStart={pStart} periodEnd={pEnd} entries={entries} />;
}

function buildFinanceAbonnement(
  movies: RightsHolderContentResponse[],
  pStart: string,
  pEnd: string,
): JSX.Element {
  let n = 1;
  const entries: FinanceAbonnementEntry[] = movies.flatMap(group => {
    const name = `${group.firstName} ${group.lastName}`;
    return group.movies
      .filter(m => m.type === 'abonnement' && m.entertainmentMode !== 'Divers')
      .map(film => {
        const s = film.stats?.type === 'abonnement' ? film.stats.stats : null;
        return {
          order: String(n++).padStart(3, '0'),
          rightsholderName: name,
          title: film.title,
          category: film.category || '',
          format: film.format || '',
          subscriptions: '',
          catalogDuration: s?.catalogTotalMinutes ?? '',
          viewingTime: s?.totalMinutesWatched ?? '',
          viewingPercentage: s?.subscriberViewPercentage ?? '',
          revenue: s?.revenue ?? '',
        };
      });
  });
  return <FinanceAbonnementReport periodStart={pStart} periodEnd={pEnd} entries={entries} />;
}

function buildContentList(
  data: RightsHolderContentResponse[],
  source: 'movie' | 'serie',
  listType: 'films' | 'series' | 'divers',
  pStart: string,
  pEnd: string,
): JSX.Element {
  let n = 1;
  const entries: ContentListEntry[] = data.flatMap(group => {
    const name = `${group.firstName} ${group.lastName}`;
    const items = source === 'movie' ? group.movies : group.series;
    return items
      .filter(item =>
        listType === 'divers'
          ? item.entertainmentMode === 'Divers'
          : item.entertainmentMode !== 'Divers',
      )
      .map(item => ({
        order: String(n++).padStart(3, '0'),
        rightsholderName: name,
        title: item.title,
        category: item.category || '',
        format: item.format || '',
      }));
  });
  return <ContentListReport contentType={listType} periodStart={pStart} periodEnd={pEnd} entries={entries} />;
}

function getDocument(
  id: ReportId,
  movies: RightsHolderContentResponse[],
  series: RightsHolderContentResponse[],
  pStart: string,
  pEnd: string,
): JSX.Element {
  switch (id) {
    case 'finance-location':   return buildFinanceLocation(movies, pStart, pEnd);
    case 'finance-abonnement': return buildFinanceAbonnement(movies, pStart, pEnd);
    case 'liste-films':        return buildContentList(movies, 'movie', 'films', pStart, pEnd);
    case 'liste-series':       return buildContentList(series, 'serie', 'series', pStart, pEnd);
    case 'liste-divers':       return buildContentList(movies, 'movie', 'divers', pStart, pEnd);
  }
}

// ─── Modal de prévisualisation ────────────────────────────────────────────────

function PreviewModal({
  title,
  doc,
  fileName,
  onClose,
}: {
  title: string;
  doc: JSX.Element;
  fileName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 flex-shrink-0">
          <span className="font-bold text-base">{title}</span>
          <div className="flex items-center gap-3">
            <ClientPDFDownload
              label="Télécharger"
              className="btn btn-primary btn-xs rounded-full"
              fileName={fileName}
              document={doc}
            />
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            {doc}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ReportPage() {
  const [reportPeriod, setReportPeriod] = useState<PeriodValue>(defaultPeriod);
  const [moviesData, setMoviesData] = useState<RightsHolderContentResponse[]>([]);
  const [seriesData, setSeriesData] = useState<RightsHolderContentResponse[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReportId[]>([]);
  const [preview, setPreview] = useState<{ id: ReportId; title: string } | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const fetchData = useCallback(() => {
    const controller = new AbortController();
    setIsFetching(true);
    const opts = { from: reportPeriod.start, to: reportPeriod.end, signal: controller.signal };
    Promise.all([
      imageRightsApi.contentsList('movie', opts),
      imageRightsApi.contentsList('serie', opts),
    ])
      .then(([movies, series]) => {
        setMoviesData(movies);
        setSeriesData(series);
      })
      .catch(err => {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Erreur chargement rapports:', err);
      })
      .finally(() => setIsFetching(false));
    return controller;
  }, [reportPeriod]);

  useEffect(() => {
    const controller = fetchData();
    return () => controller.abort();
  }, [fetchData]);

  const periodStart = isoToFR(reportPeriod.start);
  const periodEnd   = isoToFR(reportPeriod.end);

  const toggleSelect = (id: ReportId) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id],
    );

  const handleDownloadAll = async () => {
    if (!selectedIds.length) return;
    setIsZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const id of selectedIds) {
        const doc = getDocument(id, moviesData, seriesData, periodStart, periodEnd);
        const blob = await pdf(doc).toBlob();
        zip.file(`${id}-${reportPeriod.start}_${reportPeriod.end}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapports-generaux-${reportPeriod.start}_${reportPeriod.end}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  const previewReport = REPORTS.find(r => r.id === preview?.id);
  const previewDoc = previewReport && isMounted
    ? getDocument(previewReport.id, moviesData, seriesData, periodStart, periodEnd)
    : null;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="rounded-2xl border border-base-300 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Rapports généraux</h1>
          <p className="text-sm text-white/50 mt-0.5">Génération des rapports financiers et catalogues</p>
        </div>
        <PeriodSelector value={reportPeriod} onChange={setReportPeriod} />
      </div>

      {/* Notice */}
      <div className="bg-base-200 border border-base-300 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-white/70">
          Sélectionnez les rapports à inclure dans le ZIP, ou utilisez{' '}
          <span className="text-white/90 font-medium">Aperçu</span> pour visualiser et télécharger individuellement.
        </p>
      </div>

      {/* Grille des rapports */}
      {isFetching ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORTS.map(report => {
            const isSelected = selectedIds.includes(report.id);
            const doc = isMounted
              ? getDocument(report.id, moviesData, seriesData, periodStart, periodEnd)
              : null;

            return (
              <div
                key={report.id}
                className={`rounded-xl border transition-colors ${
                  isSelected
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-base-300 bg-base-200/40'
                }`}
              >
                {/* Bandeau couleur */}
                <div
                  className="h-1 rounded-t-xl"
                  style={{ backgroundColor: report.color }}
                />

                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox sélection */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(report.id)}
                      className="checkbox checkbox-primary checkbox-sm mt-1 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{report.title}</p>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{report.subtitle}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPreview({ id: report.id, title: report.title })}
                      disabled={!isMounted}
                      className="btn btn-ghost btn-xs rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Aperçu
                    </button>
                    {doc && (
                      <ClientPDFDownload
                        label="PDF"
                        className="btn btn-outline btn-primary btn-xs rounded-lg"
                        fileName={`${report.id}-${reportPeriod.start}_${reportPeriod.end}.pdf`}
                        document={doc}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action ZIP */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleDownloadAll}
          disabled={selectedIds.length === 0 || isZipping || isFetching}
          className="btn btn-primary btn-sm rounded-xl"
        >
          {isZipping ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isZipping
            ? 'Génération ZIP...'
            : `Télécharger en ZIP (${selectedIds.length})`}
        </button>
      </div>

      {/* Modal de prévisualisation */}
      {preview && previewDoc && isMounted && (
        <PreviewModal
          title={preview.title}
          doc={previewDoc}
          fileName={`${preview.id}-${reportPeriod.start}_${reportPeriod.end}.pdf`}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
