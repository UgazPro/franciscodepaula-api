import { PrismaService } from '@/prisma/prisma.service';
import { DtoBaseResponse } from '@/utilities/base.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MainLoadService {

    constructor(private readonly prismaService: PrismaService) {}

    async loadInitialData(): Promise<DtoBaseResponse> {
        // Implementation for loading initial data
        return new DtoBaseResponse();
    }

}
