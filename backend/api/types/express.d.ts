import 'express';

declare global {
  namespace Express {
    interface User {
      userId: number;
      displayName: string;
      type?: 'GOOGLE' | 'LOCAL';
      hash?: string;
      redirect?: string;
      [key: string]: unknown;
    }

    interface Locals {
      user: User;
      refreshToken: string;
    }
  }
}

export {};
