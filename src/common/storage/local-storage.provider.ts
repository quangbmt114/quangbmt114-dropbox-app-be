import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorageProvider } from '../interfaces/storage.interface';
import { ensureDirectory, fileExists as checkFileExists } from '../utils/file.util';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDirectory: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDirectory =
      this.configService.get<string>('LOCAL_UPLOAD_DIRECTORY') || './uploads';
    this.initializeDirectory();
  }

  private async initializeDirectory(): Promise<void> {
    try {
      await ensureDirectory(this.uploadDirectory);
      this.logger.log(`Local storage initialized at: ${this.uploadDirectory}`);
    } catch (error) {
      this.logger.error(`Failed to initialize upload directory: ${error.message}`);
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    this.logger.debug(`Uploading file to local storage: ${key}`);

    try {
      const filePath = path.join(this.uploadDirectory, key);
      const fileDir = path.dirname(filePath);

      // Ensure directory exists
      await ensureDirectory(fileDir);

      // If file is already in the uploads directory (from multer), just return the path
      if (file.path.startsWith(this.uploadDirectory)) {
        this.logger.debug(`File already in uploads directory: ${file.path}`);
        return file.path;
      }

      // Otherwise, copy file to the target location
      await fs.copyFile(file.path, filePath);
      
      // Delete original file if it's in a different location
      if (file.path !== filePath) {
        await fs.unlink(file.path).catch(() => {});
      }

      this.logger.log(`File uploaded successfully to local: ${filePath}`);
      return filePath;
    } catch (error) {
      this.logger.error(`Failed to upload file to local storage: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      
      if (await this.fileExists(key)) {
        await fs.unlink(filePath);
        this.logger.log(`File deleted from local storage: ${filePath}`);
        return true;
      }
      
      this.logger.warn(`File not found in local storage: ${filePath}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete file from local storage: ${error.message}`);
      return false;
    }
  }

  getFileUrl(key: string): string {
    // Return relative path - can be served by express.static or download endpoint
    return this.getFilePath(key);
  }

  async fileExists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return checkFileExists(filePath);
  }

  getStorageType(): 'local' | 's3' {
    return 'local';
  }

  private getFilePath(key: string): string {
    // Handle both absolute paths and keys
    if (path.isAbsolute(key)) {
      return key;
    }
    return path.join(this.uploadDirectory, key);
  }
}
