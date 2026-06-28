import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDTO, UpdateSubjectDTO, AssignSubjectToLevelDTO } from './subjects.dto';

@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  async findAll() {
    return await this.subjectsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.subjectsService.findOne(id);
  }

  @Post()
  async create(@Body() data: CreateSubjectDTO) {
    return await this.subjectsService.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSubjectDTO,
  ) {
    return await this.subjectsService.update(id, data);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.subjectsService.toggleStatus(id);
  }

  //////////////////////////////////////////////////
  // LEVEL SUBJECTS
  //////////////////////////////////////////////////

  @Get('levels/all')
  async getAllLevelSubjects() {
    return await this.subjectsService.getAllLevelSubjects();
  }

  @Get('levels/:levelId')
  async getSubjectsByLevel(@Param('levelId', ParseIntPipe) levelId: number) {
    return await this.subjectsService.getSubjectsByLevel(levelId);
  }

  @Post('levels/:levelId')
  async assignSubjectToLevel(
    @Param('levelId', ParseIntPipe) levelId: number,
    @Body() data: AssignSubjectToLevelDTO,
  ) {
    return await this.subjectsService.assignSubjectToLevel(levelId, data.subjectId);
  }

  @Delete('levels/:levelId/subjects/:subjectId')
  async removeSubjectFromLevel(
    @Param('levelId', ParseIntPipe) levelId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return await this.subjectsService.removeSubjectFromLevel(levelId, subjectId);
  }
}
