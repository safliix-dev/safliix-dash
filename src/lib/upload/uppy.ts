import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import axios from 'axios';

/**
 * Upload un film/documentaire vers S3 via Multipart Upload.
 * Supporte des fichiers jusqu'à 50 Go avec reprise sur erreur.
 */
export async function uploadLargeVideo(
  file: File,
  movieId: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const uppy = new Uppy({
    id: `video-upload-${movieId}`,
    autoProceed: true,
    restrictions: { maxFileSize: 50 * 1024 * 1024 * 1024 }, // 50 Go
  });

  uppy.use(AwsS3, {
    limit: 5, // Nombre d'uploads simultanés vers S3
    shouldUseMultipart: true, // ACTIVE LE MODE MULTIPART POUR LES GROS FICHIERS

    // 1. Appel au backend pour créer l'ID d'upload
    createMultipartUpload: async (file) => {
      const { data } = await axios.post('/video/upload/start', {
        filename: file.name,
        contentType: file.type || 'video/mp4',
        movieId,
      });
      return { uploadId: data.uploadId, key: data.key };
    },

    // 2. Signature de chaque morceau (chunk)
    signPart: async (file, { uploadId, key, partNumber }) => {
      const { data } = await axios.get('/video/upload/part-url', {
        params: { key, uploadId, partNumber },
      });
      return { url: data.url };
    },

    // 3. Lister les morceaux déjà uploadés (requis par les types AwsS3)
    listParts: async (file, { uploadId, key }) => {
      const { data } = await axios.get('/video/upload/list-parts', {
        params: { key, uploadId },
      });
      // retourne directement un tableau de AwsS3Part
      return data.parts || [];
    },

    // 4. Annuler l'upload multipart (requis par les types AwsS3)
    abortMultipartUpload: async (file, { uploadId, key }) => {
      await axios.post('/video/upload/abort', { uploadId, key });
    },

    // 5. Demande de fusion finale
    completeMultipartUpload: async (file, { uploadId, key, parts }) => {
      const { data } = await axios.post('/video/upload/complete', {
        uploadId,
        key,
        parts,
      });
      return { location: data.finalUrl };
    },
  });

  return new Promise((resolve, reject) => {
    uppy.on('upload-progress', (_, progress) => {
      if (typeof progress.percentage === 'number') {
        onProgress?.(progress.percentage);
      }
    });

    uppy.on('complete', (result) => {
      if (result.successful && result.successful.length > 0) {
        const responseBody = result.successful[0].response?.body;
        const finalUrl = responseBody && typeof responseBody.location === 'string' ? responseBody.location : undefined;
        uppy.close();
        if (finalUrl) {
          resolve(finalUrl);
        } else {
          reject(new Error("L'upload a réussi mais l'URL finale est manquante."));
        }
      } else {
        const error = result.failed?.[0]?.error;
        uppy.close();
        reject(error || new Error("L'upload a échoué sans erreur explicite."));
      }
    });
  });
}