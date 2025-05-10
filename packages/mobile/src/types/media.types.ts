/**
 * Media type
 */
export type MediaType = 'image' | 'gif' | 'video';

/**
 * Media file reference
 */
export interface MediaFile {
  key: string;
  url: string;
}

/**
 * Response from upload URL API
 */
export interface MediaUploadResponse {
  uploadUrl: string;
  fileKey: string;
}

/**
 * Response from confirm upload API
 */
export interface MediaConfirmResponse {
  original: MediaFile;
  processed: {
    [key: string]: MediaFile;
  };
}

/**
 * Response from exercise GIFs API
 */
export interface ExerciseGifsResponse {
  gifs: MediaFile[];
}

/**
 * Exercise GIF format
 */
export interface ExerciseGifFormats {
  gif: MediaFile;
  webp: MediaFile;
  mp4: MediaFile;
}

/**
 * Image formats with different sizes
 */
export interface ImageFormats {
  thumbnail: MediaFile;
  mobile: MediaFile;
  tablet: MediaFile;
}

/**
 * Video formats
 */
export interface VideoFormats {
  thumbnail: MediaFile;
  mp4: MediaFile;
  webm: MediaFile;
}

/**
 * Media upload status
 */
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

/**
 * Media upload progress
 */
export interface UploadProgress {
  status: UploadStatus;
  progress: number;
  error?: string;
}