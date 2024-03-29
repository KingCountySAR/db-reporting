import NextAuth, { DefaultSession } from "next-auth"
import { ServerUser } from "auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: ServerUser
  }

  interface Profile {
    hd?: string
  }
}