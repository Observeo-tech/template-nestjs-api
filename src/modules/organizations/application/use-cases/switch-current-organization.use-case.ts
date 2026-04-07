import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '@/modules/organizations/domain/repositories/organization.repository.interface';

@Injectable()
export class SwitchCurrentOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(userId: string, organizationId: string) {
    const organization = await this.organizationRepository.findAccessibleByIdForUser(
      organizationId,
      userId,
    );

    if (!organization) {
      throw new NotFoundException('Organization not found for current user');
    }

    return {
      data: organization,
      message: 'Current organization updated successfully',
    };
  }
}
