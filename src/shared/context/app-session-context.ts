export interface AppSessionContext {
  userId?: string;
  email?: string;
  name?: string;
  authenticated?: boolean;
}

export interface AppCurrentUser {
  id: string;
  email?: string;
  name?: string;
}
