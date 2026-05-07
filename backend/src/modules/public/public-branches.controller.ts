import { Controller, Get } from '@nestjs/common';
import { PublicService, PublicBranch } from '@/modules/public/public.service';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(`${APP_ROUTES.PUBLIC.BASE}/${APP_ROUTES.PUBLIC.BRANCHES}`)
export class PublicBranchesController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  list(): Promise<PublicBranch[]> {
    return this.publicService.listActiveBranches();
  }
}
