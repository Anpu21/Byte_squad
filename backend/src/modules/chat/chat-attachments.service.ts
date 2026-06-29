import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { CHAT_ATTACHMENT_FOLDER } from '@/modules/chat/chat-attachment.constants';
import type { ChatAttachmentUpload } from '@/modules/chat/types/chat-attachment-upload.type';

/**
 * Uploads a chat attachment to Cloudinary and returns its metadata. Stateless —
 * the realtime chat service owns the attachment record; this only puts the bytes
 * somewhere durable and hands back the URL + the client-reported file details.
 */
@Injectable()
export class ChatAttachmentsService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async upload(
    file: Express.Multer.File,
    userId: string,
  ): Promise<ChatAttachmentUpload> {
    const { url, publicId } = await this.cloudinary.uploadAttachment(file, {
      folder: CHAT_ATTACHMENT_FOLDER,
      publicId: `${userId}-${randomUUID()}`,
    });
    return {
      url,
      publicId,
      mimeType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
    };
  }
}
