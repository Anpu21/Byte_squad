import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../../shared/constants/enums.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';
import { Branch } from './entities/branch.entity.js';

@Controller(BACKEND_ROUTES.BRANCHES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createBranchDto: CreateBranchDto): Promise<Branch> {
        return this.branchesService.create(createBranchDto);
    }

    @Get()
    findAll(): Promise<Branch[]> {
        return this.branchesService.findAll();
    }

    @Get(BACKEND_ROUTES.BRANCHES.BY_ID)
    findOne(@Param('id') id: string): Promise<Branch | null> {
        return this.branchesService.findById(id);
    }

    @Delete(BACKEND_ROUTES.BRANCHES.BY_ID)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.branchesService.remove(id);
    }
}
