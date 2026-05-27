import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentDTO, StudentSectionDTO, StudentRepresentativeDTO } from './enrollment.dto';

@Controller('enrollment')
export class EnrollmentController {
  constructor(private service: EnrollmentService) {}

  /////////////////////////////////////////////////
  // ENROLLMENTS
  /////////////////////////////////////////////////

  @Post()
  createEnrollment(@Body() dto: EnrollmentDTO) {
    return this.service.createEnrollment(dto);
  }

  @Get('/pending')
  getPendingEnrollments() {
    return this.service.getPendingEnrollments();
  }

  @Get()
  getEnrollments(
    @Query('schoolYearId') schoolYearId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.service.getEnrollments(
      schoolYearId ? +schoolYearId : undefined,
      sectionId ? +sectionId : undefined,
      studentId ? +studentId : undefined,
    );
  }

  @Get(':id')
  getEnrollment(@Param('id') id: string) {
    return this.service.getEnrollmentById(+id);
  }

  @Put(':id')
  updateEnrollment(@Param('id') id: string, @Body() dto: EnrollmentDTO) {
    return this.service.updateEnrollment(+id, dto);
  }

  /////////////////////////////////////////////////
  // STUDENT SECTIONS
  /////////////////////////////////////////////////

  @Get('/sections')
  getStudentSections() {
    return this.service.getStudentSections();
  }

  @Post('/sections')
  createStudentSection(@Body() dto: StudentSectionDTO) {
    return this.service.createStudentSection(dto);
  }

  @Put('/sections/:id')
  updateStudentSection(@Param('id') id: string, @Body() dto: StudentSectionDTO) {
    return this.service.updateStudentSection(+id, dto);
  }

  /////////////////////////////////////////////////
  // STUDENT REPRESENTATIVES
  /////////////////////////////////////////////////

  @Post('/representatives')
  createRepresentative(@Body() dto: StudentRepresentativeDTO) {
    return this.service.createStudentRepresentative(dto);
  }

  @Delete('/representatives')
  deleteRepresentative(
    @Query('studentId') studentId: string,
    @Query('representativeId') representativeId: string,
  ) {
    return this.service.deleteStudentRepresentative(+studentId, +representativeId);
  }
}
