import { createExecutionContextManager } from '@qbobjx/core';
import { createPostgresSession } from '@qbobjx/postgres-driver';

export type ObjxExecutionContextManager = ReturnType<
  typeof createExecutionContextManager
>;
export type ObjxSession = ReturnType<typeof createPostgresSession>;
