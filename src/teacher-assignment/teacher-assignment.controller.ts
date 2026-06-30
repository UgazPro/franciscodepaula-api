import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TeacherAssignmentService } from './teacher-assignment.service';
import {
  CreateTeacherAssignmentDTO,
  UpdateTeacherAssignmentDTO,
  CreateSpecialGroupDTO,
  UpdateSpecialGroupDTO,
  AddStudentsToSpecialGroupDTO,
} from './teacher-assignment.dto';

@Controller('teacher-assignments')
export class TeacherAssignmentController {
  constructor(private service: TeacherAssignmentService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get('overview')
  async getOverview() {
    return await this.service.getOverview();
  }

  @Post()
  async create(@Body() data: CreateTeacherAssignmentDTO) {
    return await this.service.create(data);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTeacherAssignmentDTO,
  ) {
    return await this.service.update(id, data);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.service.toggleStatus(id);
  }

  //////////////////////////////////////////////////
  // SPECIAL GROUPS — CRPs
  //////////////////////////////////////////////////

  @Get('special-groups')
  async findSpecialGroups() {
    return await this.service.findSpecialGroups();
  }

  @Get('special-groups/available-students')
  async getAvailableStudentsForCRP() {
    return await this.service.getAvailableStudentsForCRP();
  }

  @Get('special-groups/:groupName')
  async findSpecialGroupByName(@Param('groupName') groupName: string) {
    return await this.service.findSpecialGroupByName(groupName);
  }

  @Post('special-groups')
  async createSpecialGroup(@Body() data: CreateSpecialGroupDTO) {
    return await this.service.createSpecialGroup(data);
  }

  @Put('special-groups/:id')
  async updateSpecialGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSpecialGroupDTO,
  ) {
    return await this.service.updateSpecialGroup(id, data);
  }

  @Patch('special-groups/:id/toggle-status')
  async toggleSpecialGroupStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.service.toggleSpecialGroupStatus(id);
  }

  @Get('special-groups/:groupName/students')
  async getSpecialGroupStudents(@Param('groupName') groupName: string) {
    return await this.service.getSpecialGroupStudents(groupName);
  }

  @Post('special-groups/:groupName/students')
  async addStudentsToSpecialGroup(
    @Param('groupName') groupName: string,
    @Body() data: AddStudentsToSpecialGroupDTO,
  ) {
    return await this.service.addStudentsToSpecialGroup(groupName, data.studentEnrollmentIds);
  }

  @Delete('special-groups/:groupName/students/:studentEnrollmentId')
  async removeStudentFromSpecialGroup(
    @Param('groupName') groupName: string,
    @Param('studentEnrollmentId', ParseIntPipe) studentEnrollmentId: number,
  ) {
    return await this.service.removeStudentFromSpecialGroup(groupName, studentEnrollmentId);
  }
}
