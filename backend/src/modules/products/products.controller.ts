import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ProductsService } from '@products/products.service';
import { CreateProductDto } from '@products/dto/create-product.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Product } from '@products/entities/product.entity';

@Controller(APP_ROUTES.PRODUCTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    create(@Body() createProductDto: CreateProductDto): Promise<Product> {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(): Promise<Product[]> {
        return this.productsService.findAll();
    }

    @Get(APP_ROUTES.PRODUCTS.BY_ID)
    findOne(@Param('id') id: string): Promise<Product | null> {
        return this.productsService.findById(id);
    }

    @Get(APP_ROUTES.PRODUCTS.BY_BARCODE)
    findByBarcode(@Param('barcode') barcode: string): Promise<Product | null> {
        return this.productsService.findByBarcode(barcode);
    }

    @Delete(APP_ROUTES.PRODUCTS.BY_ID)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    remove(@Param('id') id: string): Promise<void> {
        return this.productsService.remove(id);
    }
}
