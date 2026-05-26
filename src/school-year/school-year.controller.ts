import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Put, } from '@nestjs/common';
import { SchoolYearService } from './school-year.service';

@Controller('school-year')
export class SchoolYearController {

    constructor(private schoolYearService: SchoolYearService){}

    @Get()
    async getSchoolYears() {
        return await this.schoolYearService.getSchoolYears();
    }    

}