import { Model } from 'objection';
import { generateSnowflakeId } from '@/shared/ids/snowflake-id.util';

export abstract class SnowflakeModel extends Model {
  id!: string;

  $beforeInsert(): void {
    if (!this.id) {
      this.id = generateSnowflakeId();
    }
  }

  $formatDatabaseJson(json: Record<string, unknown>): Record<string, unknown> {
    const formatted = super.$formatDatabaseJson(json);

    if (formatted.id !== undefined && formatted.id !== null) {
      formatted.id = String(formatted.id);
    }

    return formatted;
  }

  $parseDatabaseJson(json: Record<string, unknown>): Record<string, unknown> {
    const parsed = super.$parseDatabaseJson(json);

    if (parsed.id !== undefined && parsed.id !== null) {
      parsed.id = String(parsed.id);
    }

    return parsed;
  }
}
