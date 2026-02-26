import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { BranchesService } from '@branches/branches.service';
import { CreateBranchDto } from '@branches/dto/create-branch.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Branch } from '@branches/entities/branch.entity';

@Controller(APP_ROUTES.BRANCHES.BASE)
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

    @Get(APP_ROUTES.BRANCHES.BY_ID)
    findOne(@Param('id') id: string): Promise<Branch | null> {
        return this.branchesService.findById(id);
    }

    @Delete(APP_ROUTES.BRANCHES.BY_ID)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.branchesService.remove(id);
    }
}
