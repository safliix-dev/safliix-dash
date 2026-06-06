'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, Pencil, Trash2, Film, ImageIcon, X } from 'lucide-react';
import { useAttachments } from '@/lib/hooks/useAttachments';
import { usePlayback } from '@/lib/hooks/usePlayback';
import { AttachmentUpdateModal } from './AttachmentUpdateModal';
import ConfirmationDialog from '@/ui/components/confirmationDialog';
import VideoPlayer from '@/ui/components/videoPlayer';
import {
  ATTACHMENT_LABELS,
  isVideoAttachment,
  type ContentApiType,
  type PlaybackContentType,
  type ContentAttachment,
} from '@/types/api/attachments';

interface AttachmentsListProps {
  contentId: string;
  apiContentType: ContentApiType;
  playbackType: PlaybackContentType;
}

export function AttachmentsList({
  contentId,
  apiContentType,
  playbackType,
}: AttachmentsListProps) {
  const { attachments, loading, error, refresh, deleteAttachment } =
    useAttachments(apiContentType, contentId);

  const { mediaList, loading: playbackLoading, load: loadPlayback, reset: resetPlayback } =
    usePlayback();

  const [updateTarget, setUpdateTarget] = useState<ContentAttachment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentAttachment | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideoType, setPreviewVideoType] = useState<string | null>(null);

  const handlePreview = (att: ContentAttachment) => {
    if (isVideoAttachment(att.type)) {
      setPreviewVideoType(att.type);
      void loadPlayback(contentId, playbackType, att.type as Parameters<typeof loadPlayback>[2]);
    } else if (att.url) {
      setPreviewImage(att.url);
    }
  };

  const closeVideoPreview = () => {
    setPreviewVideoType(null);
    resetPlayback();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteStatus('loading');
    try {
      await deleteAttachment(deleteTarget.type);
      setDeleteStatus('success');
      setTimeout(() => {
        setDeleteTarget(null);
        setDeleteStatus('idle');
      }, 1000);
    } catch {
      setDeleteStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-dots loading-md text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error text-sm">
        {error}
        <button className="btn btn-ghost btn-xs ml-auto" onClick={refresh}>
          Réessayer
        </button>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <p className="text-white/40 text-sm text-center py-8 italic">
        Aucun fichier uploadé pour ce contenu.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((att) => {
          const isVideo = isVideoAttachment(att.type);
          const label = ATTACHMENT_LABELS[att.type] ?? att.type;

          return (
            <div
              key={att.mediaFileId}
              className="flex items-center gap-4 bg-base-200/40 border border-base-300 rounded-xl px-4 py-3"
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-base-300/50 flex items-center justify-center shrink-0">
                {isVideo
                  ? <Film className="w-4 h-4 text-primary" />
                  : <ImageIcon className="w-4 h-4 text-primary" />
                }
              </div>

              {/* Image thumbnail (images only) */}
              {!isVideo && att.url && (
                <div className="w-12 h-10 rounded-md overflow-hidden border border-base-300 shrink-0">
                  <Image
                    src={att.url}
                    alt={label}
                    width={48}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/40">{att.mimeType || '—'}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs gap-1 text-white/60 hover:text-white"
                  title="Prévisualiser"
                  onClick={() => handlePreview(att)}
                  disabled={!isVideo && !att.url}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Aperçu</span>
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-xs gap-1 text-primary hover:text-primary"
                  title="Mettre à jour"
                  onClick={() => setUpdateTarget(att)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mettre à jour</span>
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-xs gap-1 text-error/70 hover:text-error"
                  title="Supprimer"
                  onClick={() => {
                    setDeleteTarget(att);
                    setDeleteStatus('idle');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Supprimer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal mise à jour */}
      {updateTarget && (
        <AttachmentUpdateModal
          contentId={contentId}
          apiContentType={apiContentType}
          attachment={updateTarget}
          onSuccess={() => {
            setUpdateTarget(null);
            refresh();
          }}
          onClose={() => setUpdateTarget(null)}
        />
      )}

      {/* Confirmation suppression */}
      <ConfirmationDialog
        open={deleteTarget !== null}
        title="Supprimer le fichier"
        message={
          deleteTarget?.type === 'MAIN'
            ? `Supprimer la vidéo principale rendra ce contenu illisible pour les utilisateurs. Confirmer ?`
            : `Supprimer "${ATTACHMENT_LABELS[deleteTarget?.type ?? ''] ?? deleteTarget?.type}" ?`
        }
        status={deleteStatus}
        resultMessage={deleteStatus === 'success' ? 'Fichier supprimé.' : undefined}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteStatus('idle');
        }}
      />

      {/* Preview image */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 z-10 btn btn-circle btn-sm bg-black/50"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Aperçu"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Preview vidéo */}
      {previewVideoType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeVideoPreview}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideoPreview}
              className="absolute top-3 right-3 z-10 btn btn-circle btn-sm bg-black/50"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {playbackLoading ? (
              <div className="flex items-center justify-center h-64 bg-black">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            ) : (
              <VideoPlayer
                src={mediaList[0]?.url ?? null}
                title={ATTACHMENT_LABELS[previewVideoType] ?? previewVideoType}
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
