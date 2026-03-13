import { Injectable } from '@nestjs/common';
import { InjectTransactionalRepository } from 'nicot';
import { Repository } from 'typeorm';
import { User } from '@/domain/auth/entities/user.entity';
import { UserFactory } from './users.factory';

@Injectable()
export class UserCrudService extends UserFactory.crudService() {
  constructor(
    @InjectTransactionalRepository(User)
    repo: Repository<User>,
  ) {
    super(repo);
  }
}
