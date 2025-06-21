import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import type { NextAuthOptions } from 'next-auth'

// Admin configuration - GitHub usernames and emails that can access admin features
const ADMIN_GITHUB_USERNAMES = process.env.ADMIN_GITHUB_USERNAMES?.split(',') || []
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || []

const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only allow GitHub authentication
      if (account?.provider !== 'github') {
        return false
      }

      // Check if user is an authorized admin by GitHub username or email
      const githubUsername = account.providerAccountId
      const userEmail = user.email
      
      const isAdminByUsername = ADMIN_GITHUB_USERNAMES.includes(githubUsername)
      const isAdminByEmail = userEmail && ADMIN_EMAILS.includes(userEmail)
      const isAdmin = isAdminByUsername || isAdminByEmail

      if (!isAdmin) {
        console.log(`Access denied for GitHub user: ${githubUsername} (${userEmail})`)
        return false
      }

      console.log(`Admin access granted for GitHub user: ${githubUsername} (${userEmail})`)
      return true
    },
    async jwt({ token, account, user }) {
      // Persist admin info in the token
      if (account && user) {
        token.isAdmin = true
        token.githubUsername = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.isAdmin = token.isAdmin
        session.user.githubUsername = token.githubUsername
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
