import { User } from '@/domain/auth/entities/user.entity';
import { RestfulFactory } from 'nicot';

export const UserFactory = new RestfulFactory(User, {
  skipNonQueryableFields: true,
});

export class CreateUserDto extends UserFactory.createDto {}

export class UpdateUserDto extends UserFactory.updateDto {}

export class FindAllUserDto extends UserFactory.findAllDto {}
