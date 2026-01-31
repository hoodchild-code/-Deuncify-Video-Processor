declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      passwordHash: string;
      createdAt: Date;
    }
  }
}
