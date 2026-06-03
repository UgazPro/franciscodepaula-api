import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Put, } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UserDTO,
  StudentDTO,
  EmployeeDTO,
  RepresentativeDTO,
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
  async getStudents() {
    return await this.usersService.getStudents();
  }

  // Get Staff (employees with person & role)
  @Get('staff')
  async getStaff() {
    return await this.usersService.getStaff();
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

  //////////////////////////////////////////////////
  // REPRESENTATIVES
  //////////////////////////////////////////////////

  @Post('representatives')
  async createRepresentative(@Body() data: RepresentativeDTO) {
    return await this.usersService.createRepresentative(data);
  }

  @Put('representatives/:id')
  async updateRepresentative(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RepresentativeDTO,
  ) {
    return await this.usersService.updateRepresentative(id, data);
  }
}
