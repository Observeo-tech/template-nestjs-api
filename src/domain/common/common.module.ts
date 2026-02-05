import { Module } from '@nestjs/common';
import { SessionStorageModule } from './session-storage/session-storage.module';

@Module({
  imports: [SessionStorageModule],
  exports: [SessionStorageModule],
})
export class CommonModule {}
