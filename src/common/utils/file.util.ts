import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * File Utilities
 */

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExtension(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalFilename: string): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  return `file-${timestamp}-${random}${ext}`;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete file safely
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  } catch {
    return null;
  }
}

/**
 * Check if mime type is image
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if mime type is video
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if mime type is document
 */
export function isDocumentMimeType(mimeType: string): boolean {
  // Import from constants to avoid duplication
  const { FILE_UPLOAD } = require('../constants');
  return FILE_UPLOAD.DOCUMENT_MIME_TYPES.includes(mimeType);
}

/**
 * Get file type category from MIME type
 */
export function getFileTypeCategory(mimeType: string): 'video' | 'image' | 'document' | 'archive' | 'other' {
  if (isVideoMimeType(mimeType)) return 'video';
  if (isImageMimeType(mimeType)) return 'image';
  if (isDocumentMimeType(mimeType)) return 'document';
  if (mimeType === 'application/zip') return 'archive';
  return 'other';
}

/**
 * Convert bytes to megabytes
 */
export function bytesToMB(bytes: number): number {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

/**
 * Convert bytes to gigabytes
 */
export function bytesToGB(bytes: number): number {
  return Number((bytes / (1024 * 1024 * 1024)).toFixed(2));
}

/**
 * Get max file size based on MIME type
 */
export function getMaxFileSize(mimeType: string): number {
  const { FILE_UPLOAD } = require('../constants');
  return isVideoMimeType(mimeType) ? FILE_UPLOAD.MAX_VIDEO_SIZE : FILE_UPLOAD.MAX_FILE_SIZE;
}

/**
 * Ensure directory exists
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}


