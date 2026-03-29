import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/src/lib/DBconnection";
import User from "@/src/models/user";
// import Applicant from "@/models/applicant";
import bcrypt from "bcryptjs";

// Auto-set NEXTAUTH_URL for local development
if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NODE_ENV !== "production") {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  }
} else if (
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL_URL &&
  process.env.NEXTAUTH_URL.includes("vercel.app")
) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

export const authOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No user found with this email");
          }

          if (user.provider !== "credentials") {
            throw new Error(`Please login with ${user.provider}`);
          }

          if (!user.password) {
            throw new Error("Invalid account configuration");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            applicantId: user.applicantId?.toString(),
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user with OAuth profile image
            // We do NOT create an empty Applicant record here anymore
            // The user must complete registration separately
            const newUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: account.provider,
              // applicantId will be undefined until they register
            });
            await newUser.save();
          } else {
            // Update existing user's image if logging in with OAuth
            if (user.image && user.image !== existingUser.image) {
              existingUser.image = user.image;
              existingUser.name = user.name || existingUser.name;
              await existingUser.save();
            }
          }
          
          // We need to fetch the fresh user data to get the applicantId (if it exists)
          // or leave it undefined if it doesn't
          const currentUser = existingUser || await User.findOne({ email: user.email });
          user.applicantId = currentUser.applicantId?.toString();
          
          return true;
        } catch (error) {
          console.error("Error saving user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image || profile?.picture || profile?.image;
        token.provider = account?.provider;
        token.applicantId = user.applicantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.provider = token.provider;
        session.user.applicantId = token.applicantId;

        if (token.image) {
          session.user.image = token.image;
        }

        if (session?.user?.email && !session.user.image) {
          try {
            await connectDB();
            const dbUser = await User.findOne({ email: session.user.email });
            if (dbUser?.image) {
              session.user.image = dbUser.image;
            }
            if (dbUser) {
              session.user.id = dbUser._id.toString();
              session.user.provider = dbUser.provider || token.provider;
              session.user.applicantId = dbUser.applicantId?.toString();
            }
          } catch (error) {
            console.error("Error fetching user in session callback:", error);
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};
