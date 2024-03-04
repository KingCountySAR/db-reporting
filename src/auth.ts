import NextAuth, { User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { ClientUser } from './app/models/clientUser';

export interface ServerUser extends User {
  email: string,
  name: string,
}

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      return !!auth
    },
    session({session, token}) {
/*
{
  session: {
    user: {
      name: string,
      email: string,
      image: url
    },
    expires: '2024-04-02T08:24:16.120Z'
  },
  token: {
    name: string,
    email: string,
    picture: url,
    sub: uuid,
    iat: 1709454255,
    exp: 1712046255,
    jti: uuid
  }
}
*/
      session.user.id = `google:${token.email}`;
      return session;
    }
  },
});