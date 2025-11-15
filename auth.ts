import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

// Validate AUTH_SECRET is set
if (!process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET environment variable is not set. Please set it in your .env file. " +
    "You can generate one with: openssl rand -base64 32"
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing credentials');
          return null;
        }

        try {
          // Use case-insensitive email matching to handle email case variations
          const result = await pool.query(
            'SELECT id, email, name, image, password FROM user_profiles WHERE LOWER(email) = LOWER($1)',
            [credentials.email as string]
          );

          const user = result.rows[0];

          if (!user) {
            console.error(`[Auth] User not found: ${credentials.email}`);
            return null;
          }

          if (!user.password) {
            console.error(`[Auth] User has no password: ${user.email}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            console.error(`[Auth] Invalid password for: ${user.email}`);
            return null;
          }

          console.log(`[Auth] Successful login: ${user.email}`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});

