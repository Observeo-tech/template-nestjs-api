import type { AppSessionContext } from '@/shared/context/app-session-context';

export function buildObjxExecutionContextValues(
  session?: AppSessionContext,
): Record<string, unknown> {
  if (!session) {
    return {};
  }

  const values: Record<string, unknown> = {
    authenticated: session.authenticated ?? false,
  };

  if (session.userId) {
    values.userId = session.userId;
  }

  if (session.email) {
    values.email = session.email;
  }

  if (session.name) {
    values.name = session.name;
  }

  if (session.currentOrganizationId) {
    values.currentOrganizationId = session.currentOrganizationId;
  }

  if (session.currentOrganizationName) {
    values.currentOrganizationName = session.currentOrganizationName;
  }

  if (session.currentOrganizationRole) {
    values.currentOrganizationRole = session.currentOrganizationRole;
  }

  return values;
}
