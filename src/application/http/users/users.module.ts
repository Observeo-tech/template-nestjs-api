import { Module } from '@nestjs/common';
import { User } from '@/domain/auth/entities/user.entity';
import { TransactionalTypeOrmModule } from 'nicot';
import { UsersController } from './users.controller';
import { UserCrudService } from './users.service';

@Module({
  imports: [TransactionalTypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UserCrudService],
})
export class UsersModule {}
