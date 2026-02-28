import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider, IFileUploadResult } from '../interfaces/storage.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: IStorageProvider;
  private readonly storageType: 'local' | 's3';

  constructor(
    private readonly configService: ConfigService,
    private readonly localProvider: LocalStorageProvider,
    private readonly s3Provider: S3StorageProvider,
  ) {
    this.storageType = this.determineStorageType();
    this.provider = this.storageType === 's3' ? this.s3Provider : this.localProvider;
    
    this.logger.log(`Storage service initialized with provider: ${this.storageType.toUpperCase()}`);
  }

  /**
   * Determine which storage provider to use based on configuration
   */
  private determineStorageType(): 'local' | 's3' {
    const configuredType = this.configService.get<string>('STORAGE_TYPE');
    
    // Check if S3 is configured
    const hasS3Config = this.hasS3Configuration();
    
    if (configuredType === 's3' && hasS3Config) {
      this.logger.log('Using S3 storage provider');
      return 's3';
    }
    
    if (configuredType === 's3' && !hasS3Config) {
      this.logger.warn(
        'S3 storage requested but credentials not found. Falling back to local storage.',
      );
    }
    
    this.logger.log('Using local storage provider');
    return 'local';
  }

  /**
   * Check if S3 configuration is complete
   */
  private hasS3Configuration(): boolean {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const region = this.configService.get<string>('AWS_S3_REGION');
    const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');

    return !!(bucketName && region && accessKeyId && secretAccessKey);
  }

  /**
   * Upload a file using the configured storage provider
   */
  async uploadFile(file: Express.Multer.File, key: string): Promise<IFileUploadResult> {
    try {
      const url = await this.provider.uploadFile(file, key);
      
      return {
        key,
        url,
        storageType: this.provider.getStorageType(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      
      // If S3 fails, fallback to local storage
      if (this.storageType === 's3') {
        this.logger.warn('S3 upload failed, attempting fallback to local storage');
        const url = await this.localProvider.uploadFile(file, key);
        
        return {
          key,
          url,
          storageType: 'local',
        };
      }
      
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      // Try to delete from current provider
      const deleted = await this.provider.deleteFile(key);
      
      if (!deleted && this.storageType === 's3') {
        // If not found in S3, try local storage as fallback
        this.logger.debug('File not found in S3, checking local storage');
        return await this.localProvider.deleteFile(key);
      }
      
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(key: string): string {
    return this.provider.getFileUrl(key);
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      // Check current provider
      const exists = await this.provider.fileExists(key);
      
      if (!exists && this.storageType === 's3') {
        // If not in S3, check local storage
        return await this.localProvider.fileExists(key);
      }
      
      return exists;
    } catch (error) {
      this.logger.error(`Error checking file existence: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current storage type
   */
  getStorageType(): 'local' | 's3' {
    return this.storageType;
  }

  /**
   * Get storage provider instance (for advanced operations)
   */
  getProvider(): IStorageProvider {
    return this.provider;
  }

  /**
   * Check if S3 is available
   */
  isS3Available(): boolean {
    return this.storageType === 's3';
  }

  /**
   * Generate pre-signed URL for direct upload (S3 only)
   */
  async generatePresignedUploadUrl(key: string, expiresIn?: number): Promise<string | null> {
    if (this.storageType === 's3' && this.s3Provider instanceof S3StorageProvider) {
      return this.s3Provider.generatePresignedUploadUrl(key, expiresIn);
    }
    
    this.logger.warn('Pre-signed URLs are only available with S3 storage');
    return null;
  }

  /**
   * Generate pre-signed URL for download (S3 only)
   */
  async generatePresignedDownloadUrl(key: string, expiresIn?: number): Promise<string | null> {
    if (this.storageType === 's3' && this.s3Provider instanceof S3StorageProvider) {
      return this.s3Provider.generatePresignedDownloadUrl(key, expiresIn);
    }
    
    this.logger.warn('Pre-signed URLs are only available with S3 storage');
    return null;
  }
}
