import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SchoolYearService } from './school-year.service';
import { CreateSchoolYearDTO, UpdateSchoolYearDTO, SectionDTO, HighSchoolLevelDTO } from './school-year.dto';

@Controller('school-year')
export class SchoolYearController {
  constructor(private schoolYearService: SchoolYearService) {}

  @Get()
  async getSchoolYears() {
    return await this.schoolYearService.getSchoolYears();
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

  @Get('/active')
  async getActiveSchoolYear() {
    return await this.schoolYearService.getActiveSchoolYear();
  }

  @Get(':id')
  async getSchoolYearById(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolYearService.getSchoolYearById(id);
  }

  @Post()
  async createSchoolYear(@Body() data: CreateSchoolYearDTO) {
    return await this.schoolYearService.createSchoolYear(data);
  }

  @Put(':id')
  async updateSchoolYear(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSchoolYearDTO,
  ) {
    return await this.schoolYearService.updateSchoolYear(id, data);
  }

  @Put(':id/toggle-active')
  async toggleSchoolYearActive(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolYearService.toggleSchoolYearActive(id);
  }

  @Post('/levels')
  async createLevel(@Body() data: HighSchoolLevelDTO) {
    return await this.schoolYearService.createLevel(data);
  }

  @Put('/levels/:id')
  async updateLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: HighSchoolLevelDTO,
  ) {
    return await this.schoolYearService.updateLevel(id, data);
  }

  @Delete('/levels/:id')
  async deleteLevel(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolYearService.deleteLevel(id);
  }

  @Post('/sections')
  async createSection(@Body() data: SectionDTO) {
    return await this.schoolYearService.createSection(data);
  }

  @Put('/sections/:id')
  async updateSection(@Param('id', ParseIntPipe) id: number, @Body() data: SectionDTO) {
    return await this.schoolYearService.updateSection(id, data);
  }

  @Delete('/sections/:id')
  async deleteSection(@Param('id', ParseIntPipe) id: number) {
    return await this.schoolYearService.deleteSection(id);
  }
}
