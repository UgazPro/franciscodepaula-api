import { Controller, Get } from '@nestjs/common';
import { MainLoadService } from './main-load.service';
import { DtoBaseResponse } from '@/utilities/base.dto';

@Controller('main-load')
export class MainLoadController {

    constructor(private readonly mainLoadService: MainLoadService) {}


    
}