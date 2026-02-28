/**
 * Storage provider interface
 * All storage implementations must follow this contract
 */
export interface IStorageProvider {
  /**
   * Upload a file
   * @param file - The file to upload
   * @param key - The storage key/path
   * @returns URL or path to the uploaded file
   */
  uploadFile(file: Express.Multer.File, key: string): Promise<string>;

  /**
   * Delete a file
   * @param key - The storage key/path
   * @returns True if deleted successfully
   */
  deleteFile(key: string): Promise<boolean>;

  /**
   * Get file URL
   * @param key - The storage key/path
   * @returns Accessible URL for the file
   */
  getFileUrl(key: string): string;

  /**
   * Check if file exists
   * @param key - The storage key/path
   * @returns True if file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Get storage type
   */
  getStorageType(): 'local' | 's3';
}

/**
 * File upload result
 */
export interface IFileUploadResult {
  key: string;
  url: string;
  storageType: 'local' | 's3';
}
