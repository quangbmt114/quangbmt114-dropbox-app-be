import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
    path: string;
    createdAt: Date;
  }> {
    // Store file metadata in database
    const uploadedFile = await this.prisma.file.create({
      data: {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        path: file.path,
        userId,
      },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        path: true,
        createdAt: true,
      },
    });

    return uploadedFile;
  }

  async getUserFiles(userId: string) {
    const files = await this.prisma.file.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        size: true,
        mimeType: true,
        path: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return files;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    // Find file and check ownership
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        path: true,
        userId: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check if user owns the file
    if (file.userId !== userId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.path);
    } catch (error) {
      // File might not exist on disk, continue with database deletion
      console.error('Error deleting file from disk:', error);
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });
  }
}


