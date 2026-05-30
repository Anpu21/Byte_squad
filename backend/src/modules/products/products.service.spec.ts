/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SellableUnitDto } from './dto/sellable-unit.dto';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';

/**
 * Build a SellableUnitDto row inline without forcing every test to spell
 * out every field. Tests use plain objects shaped like the DTO — the
 * service only reads `name`, `isBase`, `conversionToBase`, `displayOrder`.
 */
function unit(partial: Partial<SellableUnitDto>): SellableUnitDto {
  return {
    name: 'each',
    isBase: false,
    conversionToBase: 1,
    displayOrder: 0,
    ...partial,
  } as SellableUnitDto;
}

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<ProductsRepository>;
  let dataSource: { transaction: jest.Mock };
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
      saveUnits: jest.fn().mockResolvedValue([]),
      replaceUnits: jest.fn().mockResolvedValue([]),
    };
    cloudinary = {
      isEnabled: jest.fn().mockReturnValue(false),
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };
    // dataSource.transaction(cb) runs the callback with a stub manager —
    // the repository mocks ignore the manager argument so a single sentinel
    // value is enough to satisfy `saveUnits`/`replaceUnits` signatures.
    const fakeManager = { getRepository: jest.fn() };
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (cb: (m: typeof fakeManager) => Promise<unknown>) =>
            cb(fakeManager),
        ),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: repoMock },
        { provide: CloudinaryService, useValue: cloudinary },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ProductsService);
    repo = module.get(ProductsRepository);
  });

  describe('create', () => {
    it('persists taxRate and discountAllowed', async () => {
      const dto: CreateProductDto = {
        name: 'Tax-bearing Widget',
        barcode: '0123456789',
        category: 'general',
        costPrice: 50,
        sellingPrice: 100,
        taxRate: 15,
        discountAllowed: false,
      };
      repo.createAndSave.mockImplementation((input) =>
        Promise.resolve({
          id: 'p-new',
          baseUnit: 'each',
          ...input,
        } as Product),
      );

      const created = await service.create(dto);

      expect(repo.createAndSave).toHaveBeenCalledWith(
        expect.objectContaining({
          taxRate: 15,
          discountAllowed: false,
        }),
      );
      expect(created.taxRate).toBe(15);
      expect(created.discountAllowed).toBe(false);
    });

    it('auto-seeds default sellable units for the new product', async () => {
      const dto: CreateProductDto = {
        name: 'Bulk Rice',
        barcode: '9876543210',
        category: 'grains',
        costPrice: 1,
        sellingPrice: 2,
      };
      repo.createAndSave.mockImplementation((input) =>
        Promise.resolve({
          id: 'p-kg-1',
          ...input,
          baseUnit: 'kg',
        } as Product),
      );

      await service.create(dto);

      expect(repo.saveUnits).toHaveBeenCalledTimes(1);
      const seeds = repo.saveUnits.mock.calls[0][0];
      expect(seeds).toHaveLength(2);
      expect(seeds[0]).toMatchObject({
        productId: 'p-kg-1',
        name: 'kg',
        isBase: true,
        conversionToBase: 1,
        displayOrder: 0,
      });
      expect(seeds[1]).toMatchObject({
        productId: 'p-kg-1',
        name: 'g',
        isBase: false,
        conversionToBase: 0.001,
        displayOrder: 1,
      });
    });

    it('with explicit sellableUnits persists those rows, not the defaults', async () => {
      const customUnits: SellableUnitDto[] = [
        unit({
          name: 'kg',
          isBase: true,
          conversionToBase: 1,
          displayOrder: 0,
        }),
        unit({
          name: 'g',
          isBase: false,
          conversionToBase: 0.001,
          displayOrder: 1,
        }),
        unit({
          name: 'case-12',
          isBase: false,
          conversionToBase: 12,
          displayOrder: 2,
        }),
      ];
      const dto: CreateProductDto = {
        name: 'Custom-Unit Rice',
        barcode: '5555',
        category: 'grains',
        costPrice: 1,
        sellingPrice: 2,
        baseUnit: 'kg',
        sellableUnits: customUnits,
      };
      repo.createAndSave.mockImplementation((input) =>
        Promise.resolve({
          id: 'p-kg-custom',
          ...input,
          baseUnit: 'kg',
        } as Product),
      );

      await service.create(dto);

      expect(repo.saveUnits).toHaveBeenCalledTimes(1);
      const seeds = repo.saveUnits.mock.calls[0][0];
      expect(seeds).toHaveLength(3);
      expect(seeds[0]).toMatchObject({
        productId: 'p-kg-custom',
        name: 'kg',
        isBase: true,
        conversionToBase: 1,
      });
      expect(seeds[2]).toMatchObject({
        productId: 'p-kg-custom',
        name: 'case-12',
        conversionToBase: 12,
      });
    });
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

    it('that changes baseUnit triggers replaceUnits with the new defaults', async () => {
      const existing = {
        id: 'p-1',
        name: 'Migrating Item',
        baseUnit: 'each',
      } as Product;
      repo.findById.mockResolvedValue(existing);
      repo.save.mockImplementation((p) => Promise.resolve(p));

      const dto: UpdateProductDto = { baseUnit: 'kg' };
      await service.update('p-1', dto);

      expect(repo.replaceUnits).toHaveBeenCalledTimes(1);
      const [productId, seeds] = repo.replaceUnits.mock.calls[0];
      expect(productId).toBe('p-1');
      expect(seeds).toHaveLength(2);
      expect(seeds[0]).toMatchObject({
        name: 'kg',
        isBase: true,
        conversionToBase: 1,
        productId: 'p-1',
      });
      expect(seeds[1]).toMatchObject({
        name: 'g',
        isBase: false,
        conversionToBase: 0.001,
        productId: 'p-1',
      });
    });

    it('that supplies sellableUnits triggers replaceUnits with the provided rows', async () => {
      const existing = {
        id: 'p-2',
        name: 'Bulk Sugar',
        baseUnit: 'kg',
      } as Product;
      repo.findById.mockResolvedValue(existing);
      repo.save.mockImplementation((p) => Promise.resolve(p));
      const customUnits: SellableUnitDto[] = [
        unit({
          name: 'kg',
          isBase: true,
          conversionToBase: 1,
          displayOrder: 0,
        }),
        unit({
          name: 'g',
          isBase: false,
          conversionToBase: 0.001,
          displayOrder: 1,
        }),
        unit({
          name: 'sack-50',
          isBase: false,
          conversionToBase: 50,
          displayOrder: 2,
        }),
      ];

      await service.update('p-2', { sellableUnits: customUnits });

      expect(repo.replaceUnits).toHaveBeenCalledTimes(1);
      const [productId, seeds] = repo.replaceUnits.mock.calls[0];
      expect(productId).toBe('p-2');
      expect(seeds).toHaveLength(3);
      expect(seeds[2]).toMatchObject({
        name: 'sack-50',
        conversionToBase: 50,
        productId: 'p-2',
      });
    });

    it('with neither baseUnit nor sellableUnits leaves the units alone', async () => {
      const existing = {
        id: 'p-3',
        name: 'Olive Oil',
        baseUnit: 'l',
        sellingPrice: 100,
      } as Product;
      repo.findById.mockResolvedValue(existing);
      repo.save.mockImplementation((p) => Promise.resolve(p));

      await service.update('p-3', { sellingPrice: 999 });

      expect(repo.replaceUnits).not.toHaveBeenCalled();
      expect(repo.saveUnits).not.toHaveBeenCalled();
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
