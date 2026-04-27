import "next-auth";

declare module "next-auth" {
  interface Session {

    refreshToken?: string;
    idToken?: string;
    error?: string;
  }

  interface User {
    roles?: string[];
  }

  interface JWT {
    refreshToken?: string;
    accessTokenExpires?: number;
    idToken?: string;
    user?: {
      name?: string;
      email?: string;
      roles?: string[];
    };
    error?: string;
  }
}
