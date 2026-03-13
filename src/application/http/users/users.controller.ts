import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { TransactionalTypeOrmInterceptor } from 'nicot';
import { UserResponseDto } from '../auth/dtos/auth-response.dto';
import { ApiDoc } from '../common/decorators';
import { ResponseHelper } from '../common/helpers/response-helper';
import {
  CreateUserDto,
  FindAllUserDto,
  UpdateUserDto,
  UserFactory,
} from './users.factory';
import { UserCrudService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserCrudService) {}

  @Post()
  @UseInterceptors(TransactionalTypeOrmInterceptor())
  @ApiBody({ type: CreateUserDto })
  @ApiDoc({
    summary: 'Create user',
    response: UserResponseDto,
  })
  async create(@UserFactory.createParam() dto: CreateUserDto) {
    const result = await this.userService.create(dto);
    return ResponseHelper.success(result.data, result.message);
  }

  @Get(':id')
  @ApiDoc({
    summary: 'Get user by ID',
    response: UserResponseDto,
    params: [
      {
        name: 'id',
        description: 'User ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
  })
  async findOne(@UserFactory.idParam() id: string) {
    const result = await this.userService.findOne(id);
    return ResponseHelper.success(result.data, result.message);
  }

  @Get()
  @ApiDoc({
    summary: 'List users',
    response: UserResponseDto,
    isPaginated: true,
    query: [
      { name: 'id', description: 'Filter by user ID' },
      { name: 'email', description: 'Filter by email' },
      { name: 'name', description: 'Filter by name' },
      { name: 'pageCount', description: 'Page number', example: 1 },
      { name: 'recordsPerPage', description: 'Page size', example: 25 },
    ],
  })
  async findAll(@UserFactory.findAllParam() dto: FindAllUserDto) {
    const result = await this.userService.findAll(dto);
    return ResponseHelper.paginated(
      result.data,
      result.pageCount,
      result.recordsPerPage,
      result.total,
      result.message,
    );
  }

  @Patch(':id')
  @UseInterceptors(TransactionalTypeOrmInterceptor())
  @ApiBody({ type: UpdateUserDto })
  @ApiDoc({
    summary: 'Update user',
    params: [
      {
        name: 'id',
        description: 'User ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
  })
  async update(
    @UserFactory.idParam() id: string,
    @UserFactory.updateParam() dto: UpdateUserDto,
  ) {
    const result = await this.userService.update(id, dto);
    return ResponseHelper.success(null, result.message);
  }

  @Delete(':id')
  @UseInterceptors(TransactionalTypeOrmInterceptor())
  @ApiDoc({
    summary: 'Delete user',
    params: [
      {
        name: 'id',
        description: 'User ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
    ],
  })
  async delete(@UserFactory.idParam() id: string) {
    const result = await this.userService.delete(id);
    return ResponseHelper.success(null, result.message);
  }
}
