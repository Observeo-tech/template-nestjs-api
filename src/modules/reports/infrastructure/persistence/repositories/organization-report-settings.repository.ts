import { Inject, Injectable } from '@nestjs/common';
import type { Knex } from 'knex';
import type {
  IOrganizationReportSettingsRepository,
  OrganizationReportSettings,
  UpdateOrganizationReportSettingsInput,
  UploadOrganizationReportLogoInput,
} from '@/modules/reports/domain/repositories/organization-report-settings.repository.interface';
import { DatabaseRlsContextService } from '@/shared/infrastructure/database/database-rls-context.service';
import { KNEX_CONNECTION } from '@/shared/infrastructure/database/database.constants';

@Injectable()
export class OrganizationReportSettingsRepository
implements IOrganizationReportSettingsRepository {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
    private readonly databaseRlsContextService: DatabaseRlsContextService,
  ) {}

  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationReportSettings | null> {
    const row = await this.knex('organization_report_settings')
      .select('*')
      .where({ organization_id: organizationId })
      .first();

    return row ? this.mapRow(row) : null;
  }

  async upsertSettings(
    organizationId: string,
    updatedBy: string,
    input: UpdateOrganizationReportSettingsInput,
  ): Promise<OrganizationReportSettings> {
    return this.knex.transaction(async (trx) => {
      await this.databaseRlsContextService.applyToTransaction(trx);

      const insertPayload = {
        organization_id: organizationId,
        updated_by: updatedBy,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
        ...this.buildSettingsPayload(input),
      };
      const mergePayload = {
        updated_by: updatedBy,
        updated_at: trx.fn.now(),
        ...this.buildSettingsPayload(input),
      };

      await trx('organization_report_settings')
        .insert(insertPayload)
        .onConflict('organization_id')
        .merge(mergePayload);

      return this.findByOrganizationIdWithExecutor(trx, organizationId);
    });
  }

  async upsertLogo(
    organizationId: string,
    updatedBy: string,
    input: UploadOrganizationReportLogoInput,
  ): Promise<OrganizationReportSettings> {
    return this.knex.transaction(async (trx) => {
      await this.databaseRlsContextService.applyToTransaction(trx);

      await trx('organization_report_settings')
        .insert({
          organization_id: organizationId,
          logo_file_name: input.fileName,
          logo_content_type: input.contentType,
          logo_size_bytes: input.sizeBytes,
          logo_blob: input.blob,
          updated_by: updatedBy,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .onConflict('organization_id')
        .merge({
          logo_file_name: input.fileName,
          logo_content_type: input.contentType,
          logo_size_bytes: input.sizeBytes,
          logo_blob: input.blob,
          updated_by: updatedBy,
          updated_at: trx.fn.now(),
        });

      return this.findByOrganizationIdWithExecutor(trx, organizationId);
    });
  }

  async deleteLogo(
    organizationId: string,
    updatedBy: string,
  ): Promise<OrganizationReportSettings> {
    return this.knex.transaction(async (trx) => {
      await this.databaseRlsContextService.applyToTransaction(trx);

      await trx('organization_report_settings')
        .insert({
          organization_id: organizationId,
          updated_by: updatedBy,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .onConflict('organization_id')
        .merge({
          logo_file_name: null,
          logo_content_type: null,
          logo_size_bytes: null,
          logo_blob: null,
          updated_by: updatedBy,
          updated_at: trx.fn.now(),
        });

      return this.findByOrganizationIdWithExecutor(trx, organizationId);
    });
  }

  private async findByOrganizationIdWithExecutor(
    executor: Knex.Transaction,
    organizationId: string,
  ): Promise<OrganizationReportSettings> {
    const row = await executor('organization_report_settings')
      .select('*')
      .where({ organization_id: organizationId })
      .first();

    if (!row) {
      throw new Error('Organization report settings not found after upsert');
    }

    return this.mapRow(row);
  }

  private buildSettingsPayload(
    input: UpdateOrganizationReportSettingsInput,
  ): Record<string, string | null> {
    const payload: Record<string, string | null> = {};

    if (input.displayName !== undefined) {
      payload.display_name = input.displayName;
    }

    if (input.headerText !== undefined) {
      payload.header_text = input.headerText;
    }

    if (input.footerText !== undefined) {
      payload.footer_text = input.footerText;
    }

    if (input.legalText !== undefined) {
      payload.legal_text = input.legalText;
    }

    if (input.primaryColor !== undefined) {
      payload.primary_color = input.primaryColor;
    }

    if (input.secondaryColor !== undefined) {
      payload.secondary_color = input.secondaryColor;
    }

    return payload;
  }

  private mapRow(row: Record<string, any>): OrganizationReportSettings {
    return {
      organizationId: String(row.organizationId),
      displayName: row.displayName ?? null,
      headerText: row.headerText ?? null,
      footerText: row.footerText ?? null,
      legalText: row.legalText ?? null,
      primaryColor: row.primaryColor ?? null,
      secondaryColor: row.secondaryColor ?? null,
      logoFileName: row.logoFileName ?? null,
      logoContentType: row.logoContentType ?? null,
      logoSizeBytes: row.logoSizeBytes ?? null,
      logoBlob: row.logoBlob ?? null,
      updatedBy: row.updatedBy ? String(row.updatedBy) : null,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
    };
  }
}
