import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      isAdmin: boolean
      githubUsername: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    isAdmin?: boolean
    githubUsername?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    isAdmin: boolean
    githubUsername: string
  }
}
