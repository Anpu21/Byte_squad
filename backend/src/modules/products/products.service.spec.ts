/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.entity';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<ProductsRepository>;
  let cloudinary: {
    isEnabled: jest.Mock;
    uploadImage: jest.Mock;
    deleteImage: jest.Mock;
  };

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<ProductsRepository>> = {
      createAndSave: jest.fn(),
      save: jest.fn(),
      findActive: jest.fn(),
      findById: jest.fn(),
      findByBarcode: jest.fn(),
      update: jest.fn(),
      listDistinctActiveCategories: jest.fn(),
      setActive: jest.fn(),
    };
    cloudinary = {
      isEnabled: jest.fn().mockReturnValue(false),
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: repoMock },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    service = module.get(ProductsService);
    repo = module.get(ProductsRepository);
  });

  describe('update', () => {
    it('throws NotFoundException for missing product', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('missing', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('merges DTO into existing product before save', async () => {
      const existing = { id: 'p1', name: 'Old', sellingPrice: 5 } as Product;
      repo.findById.mockResolvedValue(existing);
      repo.save.mockImplementation((p) => Promise.resolve(p));
      await service.update('p1', { name: 'New' });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', name: 'New', sellingPrice: 5 }),
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes by toggling isActive=false on the repo', async () => {
      await service.remove('p1');
      expect(repo.setActive).toHaveBeenCalledWith('p1', false);
    });
  });

  describe('setImage with Cloudinary disabled', () => {
    it('falls back to a base64 data URL', async () => {
      const product = { id: 'p1' } as Product;
      repo.findById.mockResolvedValue(product);
      const file = {
        mimetype: 'image/png',
        buffer: Buffer.from([0xff, 0xd8]),
      } as Express.Multer.File;

      await service.setImage('p1', file);
      expect(repo.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          imageUrl: expect.stringMatching(
            /^data:image\/png;base64,/,
          ) as unknown,
        }),
      );
    });
  });
});
