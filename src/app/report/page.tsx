'use client';

import { useMemo, useState } from 'react';
import { Download,AlertCircle } from 'lucide-react';
import { reportsApi } from '@/lib/api/reports';
import { useAccessToken } from '@/lib/auth/useAccessToken';
import { formatApiError } from '@/lib/api/errors';
import { useToast } from '@/ui/components/toast/ToastProvider';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPdf } from '@/ui/pdf/ReportPdf';

type ReportItem = { id: string; name: string; status?: string };

const AVAILABLE_REPORTS: ReportItem[] = [
  { id: "general-rental", name: "Rapport général financier (location)", status: "PDF" },
  { id: "general-subscription", name: "Rapport général financier (abonnement)", status: "PDF" },
  { id: "ads-general", name: "Rapport général des pubs", status: "PDF" },
];

const SAMPLE_ENTRIES = [
  { order: "001", title: "La Quête du Désert", category: "Aventure", format: "HD", rentals: 18 },
  { order: "002", title: "Les Nuits de Lagos", category: "Drame", format: "Full HD", rentals: 12 },
  { order: "003", title: "Rires en Série", category: "Comédie", format: "SD", rentals: 9 },
  { order: "004", title: "Cyber Ombres", category: "Sci-Fi", format: "4K", rentals: 7 },
  { order: "005", title: "Soleil d'Afrique", category: "Documentaire", format: "HD", rentals: 11 },
];

const ReportSelectionCard = () => {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const accessToken = useAccessToken();
  const toast = useToast();

  const toggleReport = (report: string) => {
    setSelectedReports(prev => 
      prev.includes(report) 
        ? prev.filter(r => r !== report) 
        : [...prev, report]
    );
  };

  const handleGenerate = async () => {
    if (!selectedReports.length) return;
    setGenerating(true);
    try {
      // À adapter si l'API permet de télécharger plusieurs rapports en une requête.
      for (const reportId of selectedReports) {
        await reportsApi.download(reportId, accessToken);
      }
      toast.success({ title: "Rapports", description: "Téléchargement démarré." });
    } catch (err) {
      const friendly = formatApiError(err);
      toast.error({ title: "Rapports", description: friendly.message });
    } finally {
      setGenerating(false);
    }
  };

  const pdfDocument = useMemo(() => {
    return (
      <ReportPdf
        rightsholder="SA CHRIST"
        periodStart="25/10/2025"
        periodEnd="24/10/2025"
        entries={SAMPLE_ENTRIES}
      />
    );
  }, []);

  return (
    <div className="p-2 bg-neutral mx-2">
      <div className="rounded-xl shadow-lg overflow-hidden">
        <div className="text-primary-content p-6">
          <h1 className="text-2xl font-bold text-primary">Exportation rapport général</h1>
        </div>
        <div className='bg-white p-4  text-black rounded-xl flex items-center gap-2'>
          <AlertCircle className='w-10 h-10 text-primary'/>
          <div>
            <h4 className='text-bold'>Important</h4>
            <p className="">Veuillez sélectionner uniquement les rapports que vous souhaitez intégrer dans votre rapport général</p>
          </div>
        </div>
        <div className="divide-y divide-gray-300">
          {AVAILABLE_REPORTS.map((report) => {
            const isSelected = selectedReports.includes(report.id);
            return (
              <button
                key={report.id}
                type="button"
                className={`w-full text-left p-6 hover:bg-base-200 transition-colors ${
                  isSelected ? 'bg-base-200' : ''
                }`}
                onClick={() => toggleReport(report.id)}
              >
                <div className='w-full flex items-center justify-between'>
                  <div className="flex items-center">
                    <Download className="w-10 h-8 mr-2 text-primary" />
                    <div>
                      <h2 className="text-lg font-semibold">{report.name}</h2>
                      <p className="text-sm opacity-75">{report.status || ""}</p>
                    </div>
                    
                  </div>
                  <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleReport(report.id);
                      }}
                      className="checkbox checkbox-primary mr-4"
                    />
                </div>
              </button>
            );
          })}
        </div>
        <div className="bg-base-300 p-4 flex justify-end">
          <button 
            className="btn btn-primary"
            disabled={selectedReports.length === 0 || generating}
            onClick={handleGenerate}
          >
            {generating ? "Génération..." : `Générer le rapport (${selectedReports.length})`}
          </button>
          {selectedReports.length > 0 && (
            <PDFDownloadLink
              document={pdfDocument}
              fileName={`rapport-selection-${selectedReports.length}.pdf`}
              className="btn btn-ghost text-primary ml-3"
            >
              {(props) => props.loading ? "Préparation..." : "Télécharger en PDF"}
            </PDFDownloadLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportSelectionCard;
