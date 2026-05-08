import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadOptions {
  folder: string;
  publicId: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.enabled = true;
      this.logger.log('Cloudinary enabled');
    } else {
      this.enabled = false;
      this.logger.warn(
        'Cloudinary disabled — falling back to base64. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET to enable.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async uploadImage(
    file: Express.Multer.File,
    opts: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    if (!this.enabled) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: opts.folder,
          public_id: opts.publicId,
          overwrite: true,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result?: UploadApiResponse) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No result from Cloudinary'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImageFromUrl(
    sourceUrl: string,
    opts: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    if (!this.enabled) {
      throw new Error('Cloudinary is not configured');
    }
    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder: opts.folder,
      public_id: opts.publicId,
      overwrite: true,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (err: unknown) {
      // Swallow not-found errors; surface anything else as a warning.
      const message = err instanceof Error ? err.message : String(err);
      if (!/not\s*found/i.test(message)) {
        this.logger.warn(
          `Cloudinary destroy failed for ${publicId}: ${message}`,
        );
      }
    }
  }
}
