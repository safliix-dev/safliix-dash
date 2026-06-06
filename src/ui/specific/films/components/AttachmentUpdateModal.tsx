'use client';

import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadApi } from '@/lib/api/uploads';
import { isVideoAttachment, ATTACHMENT_LABELS, type ContentApiType } from '@/types/api/attachments';
import type { ContentAttachment } from '@/types/api/attachments';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface AttachmentUpdateModalProps {
  contentId: string;
  apiContentType: ContentApiType;
  attachment: ContentAttachment;
  onSuccess: () => void;
  onClose: () => void;
}

export function AttachmentUpdateModal({
  contentId,
  apiContentType,
  attachment,
  onSuccess,
  onClose,
}: AttachmentUpdateModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = isVideoAttachment(attachment.type);
  const label = ATTACHMENT_LABELS[attachment.type] ?? attachment.type;
  const accept = isVideo ? 'video/*' : 'image/*';

  const handleReplace = async () => {
    if (!selectedFile) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMsg(null);

    try {
      const slots = await uploadApi.presignUploads(contentId, apiContentType, [
        {
          key: attachment.type,
          // @ts-expect-error extra fields required by the API but not in the TS type
          name: selectedFile.name,
          type: selectedFile.type || 'application/octet-stream',
          attachmentType: attachment.type,
          file: selectedFile,
        },
      ]);

      await axios.put(slots[0].uploadUrl, selectedFile, {
        headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded ?? 0) * 100) / (e.total ?? 1));
          setProgress(pct);
        },
      });

      await uploadApi.finalizeUploads(contentId, {
        entityId: contentId,
        mediaFileIds: [slots[0].mediaFileId],
      });

      setStatus('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : 'Erreur lors du remplacement.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-base-100 border border-base-300 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            Mettre à jour — <span className="text-primary">{label}</span>
          </h3>
          <button
            onClick={onClose}
            disabled={status === 'uploading'}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File selector */}
        {status !== 'success' && (
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-base-300 rounded-xl p-6 flex flex-col items-center gap-3 hover:border-primary/60 transition"
          >
            <Upload className="w-8 h-8 text-white/40" />
            {selectedFile ? (
              <p className="text-sm text-white text-center truncate max-w-full px-2">
                {selectedFile.name}
              </p>
            ) : (
              <>
                <p className="text-sm text-white/60">
                  {isVideo ? 'Sélectionner une vidéo' : 'Sélectionner une image'}
                </p>
                <p className="text-xs text-white/30">
                  {isVideo ? 'MP4, MOV, MKV…' : 'JPG, PNG, WEBP…'}
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] ?? null);
                setStatus('idle');
              }}
            />
          </div>
        )}

        {/* Progress bar */}
        {status === 'uploading' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/60">
              <span>Upload en cours…</span>
              <span>{progress}%</span>
            </div>
            <progress className="progress progress-primary w-full" value={progress} max={100} />
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle className="w-4 h-4" />
            Fichier remplacé avec succès.
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-error text-sm">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={status === 'uploading'}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!selectedFile || status === 'uploading' || status === 'success'}
            onClick={handleReplace}
          >
            {status === 'uploading' ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              'Mettre à jour'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
