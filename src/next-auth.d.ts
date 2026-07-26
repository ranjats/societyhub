import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    societyId: string;
    residentId?: string;
  }

  interface Session {
    user: {
      id?: string;
      role: string;
      societyId: string;
      residentId?: string;
      name?: string;
      email?: string;
      image?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    societyId: string;
    residentId?: string;
    id: string;
  }
}