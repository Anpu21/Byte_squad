import { ChatAttachmentsService } from '@/modules/chat/chat-attachments.service';
import type { CloudinaryService } from '@common/cloudinary/cloudinary.service';

describe('ChatAttachmentsService', () => {
  it('uploads via Cloudinary and returns metadata from the file', async () => {
    const cloudinary = {
      uploadAttachment: jest.fn().mockResolvedValue({
        url: 'https://cdn.example.com/x.pdf',
        publicId: 'ledgerpro/chat-attachments/user-1-abc',
      }),
    } as unknown as CloudinaryService;
    const service = new ChatAttachmentsService(cloudinary);
    const file = {
      mimetype: 'application/pdf',
      originalname: 'receipt.pdf',
      size: 4321,
      buffer: Buffer.from('x'),
    } as Express.Multer.File;

    const result = await service.upload(file, 'user-1');

    expect(cloudinary.uploadAttachment).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ folder: 'ledgerpro/chat-attachments' }),
    );
    expect(result).toEqual({
      url: 'https://cdn.example.com/x.pdf',
      publicId: 'ledgerpro/chat-attachments/user-1-abc',
      mimeType: 'application/pdf',
      fileName: 'receipt.pdf',
      size: 4321,
    });
  });
});
