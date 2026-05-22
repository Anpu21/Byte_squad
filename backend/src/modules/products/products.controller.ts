import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from '@products/products.service';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { UpdateProductDto } from '@products/dto/update-product.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Product } from '@products/entities/product.entity';

@Controller(APP_ROUTES.PRODUCTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(APP_ROUTES.PRODUCTS.CATEGORIES)
  getCategories(): Promise<string[]> {
    return this.productsService.getCategories();
  }

  @Get(APP_ROUTES.PRODUCTS.BY_ID)
  findOne(@Param('id') id: string): Promise<Product | null> {
    return this.productsService.findById(id);
  }

  @Get(APP_ROUTES.PRODUCTS.BY_BARCODE)
  findByBarcode(@Param('barcode') barcode: string): Promise<Product | null> {
    return this.productsService.findByBarcode(barcode);
  }

  @Patch(APP_ROUTES.PRODUCTS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Post(APP_ROUTES.PRODUCTS.IMAGE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Product> {
    return this.productsService.setImage(id, file);
  }

  @Delete(APP_ROUTES.PRODUCTS.IMAGE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeImage(@Param('id') id: string): Promise<Product> {
    return this.productsService.setImage(id, null);
  }

  @Delete(APP_ROUTES.PRODUCTS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
