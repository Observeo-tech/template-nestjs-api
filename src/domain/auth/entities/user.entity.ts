export class User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
