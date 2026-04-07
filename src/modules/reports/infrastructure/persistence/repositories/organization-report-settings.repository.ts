import { Inject, Injectable } from '@nestjs/common';
import type {
  IOrganizationReportSettingsRepository,
  OrganizationReportSettings,
  UpdateOrganizationReportSettingsInput,
  UploadOrganizationReportLogoInput,
} from '@/modules/reports/domain/repositories/organization-report-settings.repository.interface';
import { OBJX_SESSION } from '@/shared/infrastructure/database/database.tokens';
import type { ObjxSession } from '@/shared/infrastructure/database/database.types';
import {
  OrganizationReportSettingsModel,
  type OrganizationReportSettingsRecord,
} from '../models/organization-report-settings.model';

@Injectable()
export class OrganizationReportSettingsRepository
implements IOrganizationReportSettingsRepository {
  constructor(
    @Inject(OBJX_SESSION)
    private readonly objxSession: ObjxSession,
  ) {}

  async findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationReportSettings | null> {
    return this.objxSession.transaction(async (trxSession) => {
      const row = await this.findByOrganizationIdWithExecutor(
        trxSession,
        organizationId,
      );

      return row ? this.mapRow(row) : null;
    });
  }

  async upsertSettings(
    organizationId: string,
    updatedBy: string,
    input: UpdateOrganizationReportSettingsInput,
  ): Promise<OrganizationReportSettings> {
    return this.objxSession.transaction(async (trxSession) => {
      const current = await this.findByOrganizationIdWithExecutor(
        trxSession,
        organizationId,
      );
      const settingsPayload = this.buildSettingsPayload(input);

      if (!current) {
        await trxSession.execute(
          OrganizationReportSettingsModel.insert({
            organizationId,
            updatedBy,
            ...settingsPayload,
          }),
        );
      } else {
        await trxSession.execute(
          OrganizationReportSettingsModel
            .update({
              ...settingsPayload,
              updatedBy,
              updatedAt: new Date(),
            })
            .where(({ organizationId: currentOrganizationId }, op) =>
              op.eq(currentOrganizationId, organizationId),
            ),
        );
      }

      return this.requireByOrganizationId(trxSession, organizationId);
    });
  }

  async upsertLogo(
    organizationId: string,
    updatedBy: string,
    input: UploadOrganizationReportLogoInput,
  ): Promise<OrganizationReportSettings> {
    return this.objxSession.transaction(async (trxSession) => {
      const current = await this.findByOrganizationIdWithExecutor(
        trxSession,
        organizationId,
      );
      const logoPayload = {
        logoFileName: input.fileName,
        logoContentType: input.contentType,
        logoSizeBytes: input.sizeBytes,
        logoBlob: input.blob,
      };

      if (!current) {
        await trxSession.execute(
          OrganizationReportSettingsModel.insert({
            organizationId,
            updatedBy,
            ...logoPayload,
          }),
        );
      } else {
        await trxSession.execute(
          OrganizationReportSettingsModel
            .update({
              ...logoPayload,
              updatedBy,
              updatedAt: new Date(),
            })
            .where(({ organizationId: currentOrganizationId }, op) =>
              op.eq(currentOrganizationId, organizationId),
            ),
        );
      }

      return this.requireByOrganizationId(trxSession, organizationId);
    });
  }

  async deleteLogo(
    organizationId: string,
    updatedBy: string,
  ): Promise<OrganizationReportSettings> {
    return this.objxSession.transaction(async (trxSession) => {
      const current = await this.findByOrganizationIdWithExecutor(
        trxSession,
        organizationId,
      );
      const clearedLogoPayload = {
        logoFileName: null,
        logoContentType: null,
        logoSizeBytes: null,
        logoBlob: null,
      };

      if (!current) {
        await trxSession.execute(
          OrganizationReportSettingsModel.insert({
            organizationId,
            updatedBy,
            ...clearedLogoPayload,
          }),
        );
      } else {
        await trxSession.execute(
          OrganizationReportSettingsModel
            .update({
              ...clearedLogoPayload,
              updatedBy,
              updatedAt: new Date(),
            })
            .where(({ organizationId: currentOrganizationId }, op) =>
              op.eq(currentOrganizationId, organizationId),
            ),
        );
      }

      return this.requireByOrganizationId(trxSession, organizationId);
    });
  }

  private async findByOrganizationIdWithExecutor(
    executor: ObjxSession,
    organizationId: string,
  ): Promise<OrganizationReportSettingsRecord | null> {
    const rows = await executor.execute(
      OrganizationReportSettingsModel
        .query()
        .where(({ organizationId: currentOrganizationId }, op) =>
          op.eq(currentOrganizationId, organizationId),
        )
        .limit(1),
    );

    return rows[0] ?? null;
  }

  private async requireByOrganizationId(
    executor: ObjxSession,
    organizationId: string,
  ): Promise<OrganizationReportSettings> {
    const row = await this.findByOrganizationIdWithExecutor(
      executor,
      organizationId,
    );

    if (!row) {
      throw new Error('Organization report settings not found after upsert');
    }

    return this.mapRow(row);
  }

  private buildSettingsPayload(
    input: UpdateOrganizationReportSettingsInput,
  ): Partial<OrganizationReportSettingsRecord> {
    const payload: Partial<OrganizationReportSettingsRecord> = {};

    if (input.displayName !== undefined) {
      payload.displayName = input.displayName;
    }

    if (input.headerText !== undefined) {
      payload.headerText = input.headerText;
    }

    if (input.footerText !== undefined) {
      payload.footerText = input.footerText;
    }

    if (input.legalText !== undefined) {
      payload.legalText = input.legalText;
    }

    if (input.primaryColor !== undefined) {
      payload.primaryColor = input.primaryColor;
    }

    if (input.secondaryColor !== undefined) {
      payload.secondaryColor = input.secondaryColor;
    }

    return payload;
  }

  private mapRow(row: OrganizationReportSettingsRecord): OrganizationReportSettings {
    return {
      organizationId: row.organizationId,
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
      updatedBy: row.updatedBy ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
