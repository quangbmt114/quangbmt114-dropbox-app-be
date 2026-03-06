import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../../common/logger/logger.service';

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

@Injectable()
export class ThumbnailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Generate thumbnail from video file
   * @param videoPath - Full path to video file
   * @param outputDir - Directory to save thumbnail
   * @param filename - Base filename for thumbnail (without extension)
   * @returns Relative path to generated thumbnail
   */
  async generateVideoThumbnail(
    videoPath: string,
    outputDir: string,
    filename: string,
  ): Promise<string> {
    try {
      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });

      const thumbnailFilename = `${filename}-thumb.jpg`;
      const thumbnailPath = path.join(outputDir, thumbnailFilename);

      // Check if video file exists
      try {
        await access(videoPath, fs.constants.R_OK);
      } catch (error) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      this.logger.log('Generating video thumbnail', {
        context: 'ThumbnailService',
        videoPath,
        thumbnailPath,
      });

      // Generate thumbnail
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['1'], // Extract frame at 1 second
            filename: thumbnailFilename,
            folder: outputDir,
            size: '640x360', // 16:9 aspect ratio, medium quality
          })
          .on('end', () => {
            this.logger.log('Thumbnail generated successfully', {
              context: 'ThumbnailService',
              thumbnailPath,
            });
            resolve();
          })
          .on('error', (err) => {
            this.logger.error('Failed to generate thumbnail', err.stack, {
              context: 'ThumbnailService',
              error: err.message,
              videoPath,
            });
            reject(err);
          });
      });

      return thumbnailPath;
    } catch (error) {
      this.logger.error('Error in generateVideoThumbnail', error.stack, {
        context: 'ThumbnailService',
        error: error.message,
        videoPath,
      });
      throw error;
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateMultipleSizes(
    videoPath: string,
    outputDir: string,
    filename: string,
  ): Promise<{ small: string; medium: string; large: string }> {
    const sizes = {
      small: '320x180', // Good for lists
      medium: '640x360', // Good for grids
      large: '1280x720', // Good for full preview
    };

    const thumbnails = {
      small: '',
      medium: '',
      large: '',
    };

    await mkdir(outputDir, { recursive: true });

    for (const [size, dimensions] of Object.entries(sizes)) {
      const thumbnailFilename = `${filename}-thumb-${size}.jpg`;
      const thumbnailPath = path.join(outputDir, thumbnailFilename);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: ['1'],
            filename: thumbnailFilename,
            folder: outputDir,
            size: dimensions,
          })
          .on('end', () => resolve())
          .on('error', reject);
      });

      thumbnails[size] = thumbnailPath;
    }

    return thumbnails;
  }

  /**
   * Get video duration and metadata
   */
  async getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          this.logger.error('Failed to get video metadata', err.stack, {
            context: 'ThumbnailService',
            error: err.message,
            videoPath,
          });
          reject(err);
        } else {
          const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
          resolve({
            duration: metadata.format.duration || 0,
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            format: metadata.format.format_name || 'unknown',
          });
        }
      });
    });
  }

  /**
   * Extract frame at specific time (e.g., middle of video)
   */
  async generateThumbnailAtTime(
    videoPath: string,
    outputPath: string,
    timeInSeconds: number,
  ): Promise<void> {
    const outputDir = path.dirname(outputPath);
    const filename = path.basename(outputPath);

    await mkdir(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeInSeconds],
          filename: filename,
          folder: outputDir,
          size: '640x360',
        })
        .on('end', () => resolve())
        .on('error', reject);
    });
  }
}
