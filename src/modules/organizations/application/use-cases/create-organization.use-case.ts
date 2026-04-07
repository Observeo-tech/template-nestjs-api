import { Inject, Injectable } from '@nestjs/common';
import {
  ORGANIZATION_REPOSITORY,
  type IOrganizationRepository,
} from '@/modules/organizations/domain/repositories/organization.repository.interface';

export interface CreateOrganizationInput {
  name: string;
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(userId: string, input: CreateOrganizationInput) {
    const organization = await this.organizationRepository.createForUser({
      name: input.name,
      userId,
    });

    return {
      data: organization,
      message: 'Organization created successfully',
    };
  }
}
