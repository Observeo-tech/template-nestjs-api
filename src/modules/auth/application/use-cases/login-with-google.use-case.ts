import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { toPublicUser } from '@/modules/users/domain/entities/user.entity';
import { USER_REPOSITORY, type IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';
import { GoogleAuthService } from '../services/google-auth.service';

export interface LoginWithGoogleInput {
  idToken: string;
}

@Injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async execute(input: LoginWithGoogleInput) {
    const identity = await this.googleAuthService.verifyIdToken(input.idToken);

    const existingGoogleUser = await this.userRepository.findByGoogleId(identity.googleId);

    if (existingGoogleUser) {
      const updatedUser = await this.userRepository.update(existingGoogleUser.id, {
        email: identity.email,
        name: identity.name,
        avatarUrl: identity.avatarUrl,
      });

      return {
        user: toPublicUser(updatedUser ?? existingGoogleUser),
        message: 'Google login successful',
      };
    }

    const existingEmailUser = await this.userRepository.findByEmail(identity.email);

    if (existingEmailUser) {
      if (
        existingEmailUser.googleId &&
        existingEmailUser.googleId !== identity.googleId
      ) {
        throw new ConflictException('Google account is already linked to another user');
      }

      const linkedUser = await this.userRepository.update(existingEmailUser.id, {
        googleId: identity.googleId,
        name: identity.name,
        avatarUrl: identity.avatarUrl,
      });

      if (!linkedUser) {
        throw new UnauthorizedException('Google authentication failed');
      }

      return {
        user: toPublicUser(linkedUser),
        message: 'Google account linked successfully',
      };
    }

    const createdUser = await this.userRepository.create({
      email: identity.email,
      name: identity.name,
      password: null,
      googleId: identity.googleId,
      avatarUrl: identity.avatarUrl,
    });

    return {
      user: toPublicUser(createdUser),
      message: 'Google account created successfully',
    };
  }
}
