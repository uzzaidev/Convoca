import { DefaultSession } from "next-auth";
import { type SystemRole } from "@/lib/group-status";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      systemRole: SystemRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    systemRole: SystemRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    systemRole: SystemRole;
  }
}
