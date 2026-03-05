import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../common/storage/storage.service';
import {
  UploadRecommendationQueryDto,
  UploadRecommendationDto,
} from './dto/upload-recommendation.dto';
import { formatFileSize, getFileTypeCategory } from '../../common/utils/file.util';
import { FILE_UPLOAD } from '../../common/constants';
import chunk from 'lodash/chunk';

@Injectable()
export class UploadRecommendationService {
  private readonly logger = new Logger(UploadRecommendationService.name);

  // Thresholds (configurable via environment)
  private readonly REGULAR_UPLOAD_MAX: number;
  private readonly CHUNKED_RECOMMENDED: number;
  private readonly CHUNKED_REQUIRED: number;

  // Network speed assumptions (bytes per second)
  private readonly ASSUMED_UPLOAD_SPEED: number;
  private readonly TIMEOUT_THRESHOLD = 5 * 60; // 5 minutes

  // Chunk size bounds
  private readonly MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB minimum
  private readonly MAX_CHUNK_SIZE = 50 * 1024 * 1024; // 50MB maximum

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    // Allow configuration override from environment
    this.REGULAR_UPLOAD_MAX = this.configService.get<number>('REGULAR_UPLOAD_MAX', 100 * 1024 * 1024);
    this.CHUNKED_RECOMMENDED = this.configService.get<number>('CHUNKED_RECOMMENDED', 50 * 1024 * 1024);
    this.CHUNKED_REQUIRED = this.configService.get<number>('CHUNKED_REQUIRED', 200 * 1024 * 1024);
    this.ASSUMED_UPLOAD_SPEED = this.configService.get<number>('ASSUMED_UPLOAD_SPEED', 5 * 1024 * 1024);

    this.logger.log('Upload recommendation service initialized', {
      regularUploadMax: formatFileSize(this.REGULAR_UPLOAD_MAX),
      chunkedRecommended: formatFileSize(this.CHUNKED_RECOMMENDED),
      chunkedRequired: formatFileSize(this.CHUNKED_REQUIRED),
      assumedSpeed: formatFileSize(this.ASSUMED_UPLOAD_SPEED) + '/s',
    });
  }

  /**
   * Get upload recommendation based on file size and type
   */
  getRecommendation(query: UploadRecommendationQueryDto): UploadRecommendationDto {
    this.logger.debug('Generating upload recommendation', {
      fileSize: query.fileSize,
      mimeType: query.mimeType,
    });

    const fileSize = query.fileSize;
    const fileSizeFormatted = formatFileSize(fileSize);
    const fileType = query.mimeType ? getFileTypeCategory(query.mimeType) : undefined;
    const storageType = this.storageService.getStorageType();
    const supportsDirectUpload = this.storageService.isS3Available();

    // Calculate estimated times
    const estimatedRegularTime = this.estimateUploadTime(fileSize);
    const estimatedChunkedTime = this.estimateChunkedUploadTime(fileSize, supportsDirectUpload);

    // Determine recommendation
    const shouldUseChunked = this.shouldUseChunkedUpload(fileSize, fileType);
    const isChunkedRequired = fileSize > this.CHUNKED_REQUIRED;

    let recommendedMethod: 'regular' | 'chunked';
    let reason: string;
    const warnings: string[] = [];
    const tips: string[] = [];

    // Decision logic
    if (isChunkedRequired) {
      recommendedMethod = 'chunked';
      reason = `File size (${fileSizeFormatted}) exceeds ${formatFileSize(this.CHUNKED_REQUIRED)}. Chunked upload is REQUIRED to avoid timeout and memory issues.`;
      warnings.push('⚠️ Regular upload will likely fail due to timeout');
      warnings.push('⚠️ Upload time may exceed 5 minutes');
    } else if (shouldUseChunked) {
      recommendedMethod = 'chunked';
      reason = `File size (${fileSizeFormatted}) is large. Chunked upload is RECOMMENDED for better reliability, progress tracking, and resume capability.`;
      tips.push('💡 You can resume if connection drops');
      tips.push('💡 Real-time progress tracking available');

      if (supportsDirectUpload) {
        tips.push('💡 Direct S3 upload available (faster!)');
      }
    } else {
      recommendedMethod = 'regular';
      reason = `File size (${fileSizeFormatted}) is small enough for regular upload. This is faster and simpler for files under ${formatFileSize(this.CHUNKED_RECOMMENDED)}.`;
      tips.push('✅ Quick single-request upload');
      tips.push('✅ No session management needed');
    }

    // Build response
    const recommendation: UploadRecommendationDto = {
      recommendedMethod,
      reason,
      fileSize,
      fileSizeFormatted,
      mimeType: query.mimeType,
      fileType,
      shouldUseChunked,
      estimatedTime: {
        regular: estimatedRegularTime,
        chunked: estimatedChunkedTime,
      },
      warnings,
      tips,
      storageType,
      supportsDirectUpload,
    };

    // Add chunked config if recommended
    if (shouldUseChunked) {
      recommendation.chunkedConfig = this.getChunkedConfig(fileSize, supportsDirectUpload);
    }

    // Add specific warnings based on file type
    if (fileType === 'video' && fileSize > 500 * 1024 * 1024) {
      warnings.push('📹 Large video detected - chunked upload highly recommended');
    }

    // Add storage-specific tips
    if (storageType === 'local' && fileSize > 1024 * 1024 * 1024) {
      warnings.push('💾 Local storage: Consider using S3 for better scalability');
    }

    if (supportsDirectUpload && shouldUseChunked) {
      tips.push('⚡ Direct S3 upload: No server bandwidth usage!');
      tips.push('🚀 Parallel chunk upload available');
    }

    this.logger.debug('Recommendation generated', {
      method: recommendedMethod,
      shouldUseChunked,
      fileSize: fileSizeFormatted,
    });

    return recommendation;
  }

  /**
   * Determine if chunked upload should be used
   */
  private shouldUseChunkedUpload(fileSize: number, fileType?: string): boolean {
    // Required for very large files
    if (fileSize > this.CHUNKED_REQUIRED) {
      return true;
    }

    // Recommended for moderately large files
    if (fileSize > this.CHUNKED_RECOMMENDED) {
      return true;
    }

    // Special case: Always recommend chunked for large videos
    if (fileType === 'video' && fileSize > 50 * 1024 * 1024) {
      return true;
    }

    return false;
  }

  /**
   * Get chunked upload configuration
   */
  private getChunkedConfig(
    fileSize: number,
    supportsDirectUpload: boolean,
  ): UploadRecommendationDto['chunkedConfig'] {
    // Calculate optimal chunk size
    const chunkSize = this.calculateOptimalChunkSize(fileSize);
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const estimatedTimePerChunk = this.estimateChunkUploadTime(chunkSize);

    // Parallel upload config (S3 only)
    const canUploadParallel = supportsDirectUpload;
    const maxParallelUploads = this.calculateMaxParallelUploads(fileSize);

    return {
      recommendedChunkSize: chunkSize,
      recommendedChunkSizeFormatted: formatFileSize(chunkSize),
      totalChunks,
      estimatedTimePerChunk,
      canResume: true,
      canUploadParallel,
      maxParallelUploads,
    };
  }

  /**
   * Calculate optimal chunk size based on file size
   * Uses logarithmic scaling for smooth progression
   */
  private calculateOptimalChunkSize(fileSize: number): number {
    const MB = 1024 * 1024;
    const GB = 1024 * MB;

    // Simple progressive scaling
    if (fileSize < 100 * MB) {
      return this.MIN_CHUNK_SIZE; // 5MB
    } else if (fileSize < 500 * MB) {
      return 10 * MB;
    } else if (fileSize < 2 * GB) {
      return 20 * MB;
    } else {
      return this.MAX_CHUNK_SIZE; // 50MB
    }
  }

  /**
   * Calculate maximum parallel uploads based on file size and network
   * Conservative defaults for reliability
   */
  private calculateMaxParallelUploads(fileSize: number): number {
    const GB = 1024 * 1024 * 1024;

    // Conservative approach: fewer parallel connections = more reliable
    if (fileSize < 500 * 1024 * 1024) {
      return 2; // Small files: 2 parallel (reduce overhead)
    } else if (fileSize < 2 * GB) {
      return 3; // Medium files: 3 parallel
    } else if (fileSize < 5 * GB) {
      return 4; // Large files: 4 parallel
    } else {
      return 5; // Very large files: 5 parallel (max)
    }
  }

  /**
   * Estimate regular upload time
   */
  private estimateUploadTime(fileSize: number): string {
    const seconds = fileSize / this.ASSUMED_UPLOAD_SPEED;

    if (seconds > this.TIMEOUT_THRESHOLD) {
      return `${Math.round(seconds / 60)} minutes (⚠️ May timeout)`;
    } else if (seconds > 60) {
      return `~${Math.round(seconds / 60)} minutes`;
    } else {
      return `~${Math.round(seconds)} seconds`;
    }
  }

  /**
   * Estimate chunked upload time
   */
  private estimateChunkedUploadTime(fileSize: number, hasDirectUpload: boolean): string {
    // Chunked upload has overhead but can be parallelized with S3
    const overhead = 1.2; // 20% overhead for session management
    const parallelFactor = hasDirectUpload ? 0.4 : 1.0; // 60% faster with parallel

    const seconds = (fileSize / this.ASSUMED_UPLOAD_SPEED) * overhead * parallelFactor;

    if (seconds > 60) {
      return `~${Math.round(seconds / 60)} minutes${hasDirectUpload ? ' (parallel)' : ''}`;
    } else {
      return `~${Math.round(seconds)} seconds${hasDirectUpload ? ' (parallel)' : ''}`;
    }
  }

  /**
   * Estimate time per chunk
   */
  private estimateChunkUploadTime(chunkSize: number): string {
    const seconds = chunkSize / this.ASSUMED_UPLOAD_SPEED;
    return `~${Math.round(seconds)} seconds`;
  }

  /**
   * Get upload limits based on file type
   */
  getUploadLimits(mimeType?: string): {
    maxSize: number;
    maxSizeFormatted: string;
    fileType?: string;
  } {
    const fileType = mimeType ? getFileTypeCategory(mimeType) : undefined;

    const maxSize = fileType === 'video' ? FILE_UPLOAD.MAX_VIDEO_SIZE : FILE_UPLOAD.MAX_FILE_SIZE;

    return {
      maxSize,
      maxSizeFormatted: formatFileSize(maxSize),
      fileType,
    };
  }

  /**
   * Generate parallel upload batches using lodash chunk
   * Splits chunk indices into batches for parallel processing
   */
  generateParallelUploadBatches(totalChunks: number, maxParallelUploads: number): number[][] {
    // Validate inputs
    if (totalChunks <= 0 || maxParallelUploads <= 0) {
      this.logger.warn('Invalid batch generation parameters', {
        totalChunks,
        maxParallelUploads,
      });
      return [];
    }

    // For small number of chunks, don't over-parallelize
    const effectiveParallel = Math.min(maxParallelUploads, totalChunks);

    const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
    const batches = chunk(chunkIndices, effectiveParallel);

    this.logger.debug('Generated parallel upload batches', {
      totalChunks,
      requestedParallel: maxParallelUploads,
      effectiveParallel,
      totalBatches: batches.length,
      firstBatchSize: batches[0]?.length,
      lastBatchSize: batches[batches.length - 1]?.length,
    });

    return batches;
  }

  /**
   * Adjust chunk size based on network speed (optional enhancement)
   * Can be called by client to dynamically adjust recommendations
   */
  adjustChunkSizeForNetworkSpeed(
    baseChunkSize: number,
    measuredSpeedBytesPerSec: number,
  ): number {
    const slowNetworkThreshold = 1 * 1024 * 1024; // 1MB/s
    const fastNetworkThreshold = 10 * 1024 * 1024; // 10MB/s

    let adjustedSize = baseChunkSize;

    // Slow network: reduce chunk size
    if (measuredSpeedBytesPerSec < slowNetworkThreshold) {
      adjustedSize = Math.max(this.MIN_CHUNK_SIZE, baseChunkSize * 0.5);
      this.logger.debug('Reduced chunk size for slow network', {
        measuredSpeed: formatFileSize(measuredSpeedBytesPerSec) + '/s',
        originalSize: formatFileSize(baseChunkSize),
        adjustedSize: formatFileSize(adjustedSize),
      });
    }
    // Fast network: can increase chunk size slightly
    else if (measuredSpeedBytesPerSec > fastNetworkThreshold) {
      adjustedSize = Math.min(this.MAX_CHUNK_SIZE, baseChunkSize * 1.5);
      this.logger.debug('Increased chunk size for fast network', {
        measuredSpeed: formatFileSize(measuredSpeedBytesPerSec) + '/s',
        originalSize: formatFileSize(baseChunkSize),
        adjustedSize: formatFileSize(adjustedSize),
      });
    }

    return Math.floor(adjustedSize);
  }

  /**
   * Get detailed chunk plan for a specific file
   * Useful for client-side implementation
   */
  getDetailedChunkPlan(
    fileSize: number,
    fileName?: string,
  ): {
    totalChunks: number;
    chunkSize: number;
    chunkSizeFormatted: string;
    lastChunkSize: number;
    lastChunkSizeFormatted: string;
    batches: number[][];
    estimatedTotalTime: string;
  } {
    const chunkSize = this.calculateOptimalChunkSize(fileSize);
    const totalChunks = Math.ceil(fileSize / chunkSize);
    const lastChunkSize = fileSize % chunkSize || chunkSize;
    const maxParallel = this.calculateMaxParallelUploads(fileSize);
    const batches = this.generateParallelUploadBatches(totalChunks, maxParallel);
    const supportsDirectUpload = this.storageService.isS3Available();
    const estimatedTotalTime = this.estimateChunkedUploadTime(fileSize, supportsDirectUpload);

    this.logger.debug('Generated detailed chunk plan', {
      fileName,
      fileSize: formatFileSize(fileSize),
      totalChunks,
      chunkSize: formatFileSize(chunkSize),
      totalBatches: batches.length,
    });

    return {
      totalChunks,
      chunkSize,
      chunkSizeFormatted: formatFileSize(chunkSize),
      lastChunkSize,
      lastChunkSizeFormatted: formatFileSize(lastChunkSize),
      batches,
      estimatedTotalTime,
    };
  }
}
