'use client';

import { usePDF,DocumentProps } from "@react-pdf/renderer";
import { ReactElement, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ClientPDFDownloadProps {
  document: ReactElement<DocumentProps>;
  fileName: string;
  label?: string;
  className?: string;
}

export default function ClientPDFDownload(props: ClientPDFDownloadProps) {
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button className={`${props.className} opacity-50`} disabled>
        {props.label || "Télécharger"}
      </button>
    );
  }

  if (!shouldGenerate) {
    return (
      <button 
        onClick={() => setShouldGenerate(true)} 
        className={props.className}
      >
        <Download className="w-3 h-3 mr-1" />
        {props.label || "Télécharger"}
      </button>
    );
  }

  return <PDFGeneratorAndDownloader {...props} onComplete={() => setShouldGenerate(false)} />;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PDFGeneratorAndDownloader({ document, fileName, label: _label, className, onComplete }: ClientPDFDownloadProps & { onComplete: () => void }) {
  const [instance] = usePDF({ document });

  useEffect(() => {
    if (instance.url) {
      const link = window.document.createElement('a');
      link.href = instance.url;
      link.download = fileName;
      link.click();
      // On réinitialise après un court délai pour permettre de re-cliquer plus tard
      const timer = setTimeout(() => onComplete(), 1000);
      return () => clearTimeout(timer);
    }
  }, [instance.url, fileName, onComplete]);

  return (
    <button className={`${className} cursor-wait`} disabled>
      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      {instance.loading ? "Génération..." : "Prêt !"}
    </button>
  );
}