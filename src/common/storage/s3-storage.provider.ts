import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import { IStorageProvider } from '../interfaces/storage.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly cloudfrontUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    this.region = this.configService.get<string>('AWS_S3_REGION');
    this.cloudfrontUrl = this.configService.get<string>('AWS_CLOUDFRONT_URL');

    const accessKeyId = this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      ...(endpoint && { endpoint }),
    });

    this.logger.log(`S3 storage initialized - Bucket: ${this.bucketName}, Region: ${this.region}`);
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    this.logger.debug(`Uploading file to S3: ${key}`);

    try {
      // Read file buffer
      const fileBuffer = await fs.readFile(file.path);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Delete local temp file
      await fs.unlink(file.path).catch(() => {});

      const url = this.getFileUrl(key);
      this.logger.log(`File uploaded successfully to S3: ${key}`);
      
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`);
      return false;
    }
  }

  getFileUrl(key: string): string {
    // If CloudFront URL is configured, use it for faster delivery
    if (this.cloudfrontUrl) {
      return `${this.cloudfrontUrl}/${key}`;
    }

    // Otherwise, return S3 URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      this.logger.error(`Error checking file existence in S3: ${error.message}`);
      return false;
    }
  }

  getStorageType(): 'local' | 's3' {
    return 's3';
  }

  /**
   * Generate a pre-signed URL for direct upload from client
   * @param key - The storage key
   * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
   */
  async generatePresignedUploadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a pre-signed URL for downloading a file
   * @param key - The storage key
   * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
   */
  async generatePresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
