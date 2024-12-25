import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/user.enitiy';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Get('')
  async findByPhoneNo(@Query('phoneNo') phoneNo: string): Promise<User> {
    return this.userService.findPatientByPhoneNumber(phoneNo);
  }

  @Patch()
  updateUser() {
    // return this.userService.updateUser();
  }
}
