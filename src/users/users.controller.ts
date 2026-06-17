import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Put, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UserDTO,
  StudentDTO,
  EmployeeDTO,
  CreateRepresentativeDTO,
  UpdateRepresentativeDTO,
  UserPassword,
} from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  //////////////////////////////////////////////////
  // USERS
  //////////////////////////////////////////////////

  @Get()
  async getUsers() {
    return await this.usersService.getUsers();
  }

  // Get Students
  @Get('students')
  async getStudents(
    @Query('view') view?: string,
    @Query('levelId') levelId?: string,
    @Query('section') section?: string,
    @Query('gender') gender?: string,
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('ageExact') ageExact?: string,
  ) {
    return await this.usersService.getStudents(
      view,
      levelId ? +levelId : undefined,
      section,
      gender,
      ageMin ? +ageMin : undefined,
      ageMax ? +ageMax : undefined,
      ageExact ? +ageExact : undefined,
    );
  }

  // Get Staff (employees with person & role)
  @Get('staff')
  async getStaff() {
    return await this.usersService.getStaff();
  }

  // Check identification number uniqueness
  @Get('check-identification')
  async checkIdentification(
    @Query('value') value: string,
    @Query('excludePersonId') excludePersonId?: string,
  ) {
    return await this.usersService.checkIdentification(
      value,
      excludePersonId ? +excludePersonId : undefined,
    );
  }

  @Get('search')
  async searchPersons(@Query('q') q: string) {
    return await this.usersService.searchPersons(q);
  }

  //////////////////////////////////////////////////
  // REPRESENTATIVES
  //////////////////////////////////////////////////

  @Get('representatives')
  async getRepresentatives(
    @Query('search') search?: string,
    @Query('view') view?: string,
    @Query('minStudents') minStudents?: string,
  ) {
    return await this.usersService.searchRepresentatives(
      search,
      view,
      minStudents ? +minStudents : undefined,
    );
  }

  @Post('representatives')
  async createRepresentative(@Body() data: CreateRepresentativeDTO) {
    return await this.usersService.createRepresentative(data);
  }

  @Put('representatives/:id')
  async updateRepresentative(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRepresentativeDTO,
  ) {
    return await this.usersService.updateRepresentative(id, data);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getUserById(id);
  }

  @Post()
  async createUser(@Body() data: UserDTO) {
    return await this.usersService.createUser(data);
  }

  @Put(':id/password')
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UserPassword,
  ) {
    return await this.usersService.updatePassword({
      id,
      password: body.password,
    });
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.deleteUser(id);
  }

  //////////////////////////////////////////////////
  // STUDENTS
  //////////////////////////////////////////////////

  @Post('students')
  async createStudent(@Body() data: StudentDTO) {
    return await this.usersService.createStudent(data);
  }

  @Put('students/:id')
  async updateStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body() activity: StudentDTO,
  ) {
    return await this.usersService.updateStudent(id, activity);
  }

  @Delete('students/:id')
  async deleteStudent(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.deleteStudent(id);
  }

  //////////////////////////////////////////////////
  // EMPLOYEES
  //////////////////////////////////////////////////

  @Post('employees')
  async createEmployee(@Body() data: EmployeeDTO) {
    return await this.usersService.createEmployee(data);
  }
}
