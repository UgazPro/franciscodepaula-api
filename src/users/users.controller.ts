import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Put, } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDTO, StudentDTO, EmployeeDTO, TeacherDTO, RepresentativeDTO, UserPassword, } from './users.dto';

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

  //////////////////////////////////////////////////
  // EMPLOYEES
  //////////////////////////////////////////////////

  @Post('employees')
  async createEmployee(@Body() data: EmployeeDTO) {
    return await this.usersService.createEmployee(data);
  }

  //////////////////////////////////////////////////
  // TEACHERS
  //////////////////////////////////////////////////

  @Post('teachers')
  async createTeacher(@Body() data: TeacherDTO) {
    return await this.usersService.createTeacher(data);
  }

  //////////////////////////////////////////////////
  // REPRESENTATIVES
  //////////////////////////////////////////////////

  @Post('representatives')
  async createRepresentative(@Body() data: RepresentativeDTO) {
    return await this.usersService.createRepresentative(data);
  }
}
