import { Inject, Injectable } from '@nestjs/common';
import {
  ORGANIZATION_REPORT_SETTINGS_REPOSITORY,
  type IOrganizationReportSettingsRepository,
} from '@/modules/reports/domain/repositories/organization-report-settings.repository.interface';

@Injectable()
export class GetCurrentOrganizationReportSettingsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPORT_SETTINGS_REPOSITORY)
    private readonly organizationReportSettingsRepository: IOrganizationReportSettingsRepository,
  ) {}

  async execute(organizationId: string) {
    const settings =
      await this.organizationReportSettingsRepository.findByOrganizationId(
        organizationId,
      );

    return {
      data: settings,
      message: 'Organization report settings retrieved successfully',
    };
  }
}
