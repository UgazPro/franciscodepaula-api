import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { SchoolYearService } from './school-year.service';
import { SchoolYearDTO, SectionDTO } from './school-year.dto';

@Controller('school-year')
export class SchoolYearController {
  constructor(private schoolYearService: SchoolYearService) {}

  @Get()
  async getSchoolYears() {
    return await this.schoolYearService.getSchoolYears();
  }

  @Get(':id')
  async getSchoolYearById(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolYearService.getSchoolYearById(id);
  }

  @Post()
  async createSchoolYear(@Body() data: SchoolYearDTO) {
    return await this.schoolYearService.createSchoolYear(data);
  }

  @Get('/periods')
  async getPeriods() {
    return await this.schoolYearService.getPeriods();
  }

  @Get('/levels')
  async getLevels() {
    return await this.schoolYearService.getHighSchoolLevels();
  }

  @Get('/sections')
  async getSections() {
    return await this.schoolYearService.getSections();
  }

  @Get('/sections/:id')
  async getSection(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolYearService.getSectionById(id);
  }

  @Post('/sections')
  async createSection(@Body() data: SectionDTO) {
    return await this.schoolYearService.createSection(data);
  }

  @Put('/sections/:id')
  async updateSection(@Param('id', ParseIntPipe) id: number, @Body() data: SectionDTO) {
    return await this.schoolYearService.updateSection(id, data);
  }
}
