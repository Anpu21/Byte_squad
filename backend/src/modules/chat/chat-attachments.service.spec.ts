import { ForbiddenException } from '@nestjs/common';
import { ChatAttachmentsService } from '@/modules/chat/chat-attachments.service';
import type { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import type { CustomerGroupsService } from '@/modules/customer-groups/customer-groups.service';

describe('ChatAttachmentsService', () => {
  const file = {
    mimetype: 'application/pdf',
    originalname: 'receipt.pdf',
    size: 4321,
    buffer: Buffer.from('x'),
  } as Express.Multer.File;

  it('asserts membership, uploads via Cloudinary, and returns metadata from the file', async () => {
    const cloudinary = {
      uploadAttachment: jest.fn().mockResolvedValue({
        url: 'https://cdn.example.com/x.pdf',
        publicId: 'ledgerpro/chat-attachments/user-1-abc',
      }),
    } as unknown as CloudinaryService;
    const customerGroups = {
      assertMembership: jest
        .fn()
        .mockResolvedValue({ group: {}, membership: {} }),
    } as unknown as CustomerGroupsService;
    const service = new ChatAttachmentsService(cloudinary, customerGroups);

    const result = await service.upload(file, 'user-1', 'group-1');

    expect(customerGroups.assertMembership).toHaveBeenCalledWith(
      'group-1',
      'user-1',
    );
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

  it('rejects a non-member without spending a Cloudinary upload', async () => {
    const cloudinary = {
      uploadAttachment: jest.fn(),
    } as unknown as CloudinaryService;
    const customerGroups = {
      assertMembership: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('not a member')),
    } as unknown as CustomerGroupsService;
    const service = new ChatAttachmentsService(cloudinary, customerGroups);

    await expect(
      service.upload(file, 'intruder', 'group-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(cloudinary.uploadAttachment).not.toHaveBeenCalled();
  });
});
