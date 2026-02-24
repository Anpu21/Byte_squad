import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../../shared/constants/enums.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';
import { Product } from './entities/product.entity.js';

@Controller(BACKEND_ROUTES.PRODUCTS.BASE)
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

    @Get(BACKEND_ROUTES.PRODUCTS.BY_ID)
    findOne(@Param('id') id: string): Promise<Product | null> {
        return this.productsService.findById(id);
    }

    @Get(BACKEND_ROUTES.PRODUCTS.BY_BARCODE)
    findByBarcode(@Param('barcode') barcode: string): Promise<Product | null> {
        return this.productsService.findByBarcode(barcode);
    }

    @Delete(BACKEND_ROUTES.PRODUCTS.BY_ID)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    remove(@Param('id') id: string): Promise<void> {
        return this.productsService.remove(id);
    }
}
