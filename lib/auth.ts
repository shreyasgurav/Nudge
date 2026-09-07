import NextAuth, { type NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser, getPrimaryWorkspace } from "@/lib/workspace";
import { isEmailAllowedToSignIn } from "@/lib/env";

async function sendCustomMagicLinkEmail(email: string, url: string, provider: any) {
  const { host } = new URL(url);
  
  // Extract token from the magic link URL
  const token = url.split("token=")[1]?.split("&")[0];
  
  // Create app deep link
  const appLink = `nudge://auth?token=${token}&email=${encodeURIComponent(email)}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Nudge</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✈️ Nudge</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Instagram DM Automation</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #333;">Sign in to your account</h2>
    <p style="color: #666; margin-bottom: 25px;">Click one of the buttons below to sign in:</p>
    
    <!-- Open in App Button -->
    <a href="${appLink}" style="display: block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; text-align: center; margin-bottom: 15px; font-size: 16px;">
      📱 Open in Nudge App
    </a>
    
    <!-- Open in Browser Button -->
    <a href="${url}" style="display: block; background: #4CAF50; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; text-align: center; font-size: 16px;">
      🌐 Open in Browser
    </a>
    
    <p style="color: #999; font-size: 14px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
      <strong>Tip:</strong> Use "Open in App" if you have the Nudge iOS app installed, or "Open in Browser" to use the web version.
    </p>
  </div>
  
  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>If you didn't request this email, you can safely ignore it.</p>
    <p>This link will expire in 24 hours.</p>
  </div>
</body>
</html>
  `;

  const text = `Sign in to Nudge\n\nOpen in App: ${appLink}\n\nOr open in browser: ${url}\n\nIf you didn't request this email, you can safely ignore it.`;

  if (provider.server) {
    // Nodemailer
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport(provider.server);
    await transport.sendMail({
      to: email,
      from: provider.from,
      subject: `Sign in to Nudge`,
      text,
      html,
    });
  } else {
    // Resend
    const { Resend } = await import("resend");
    const resend = new Resend(provider.apiKey);
    await resend.emails.send({
      from: provider.from,
      to: email,
      subject: `Sign in to Nudge`,
      html,
    });
  }
}

type AdapterPrismaClient = Parameters<typeof PrismaAdapter>[0];

const emailFrom = process.env.EMAIL_FROM ?? "OpenReply <login@example.com>";
// Setting EMAIL_SERVER switches magic links to your own SMTP server, for
// self-hosters who do not want a third-party mail service. Resend stays the
// default, so an existing deployment is unaffected.
const smtpServer = process.env.EMAIL_SERVER;

/**
 * Provider id the login form has to sign in with. It differs per transport,
 * so it is derived here rather than hardcoded at the call site.
 */
export const EMAIL_PROVIDER_ID = smtpServer ? "nodemailer" : "resend";

export const authConfig = {
  adapter: PrismaAdapter(prisma as unknown as AdapterPrismaClient),
  providers: [
    smtpServer
      ? Nodemailer({ 
          server: smtpServer, 
          from: emailFrom,
          sendVerificationRequest: async ({ identifier: email, url, provider }) => {
            await sendCustomMagicLinkEmail(email, url, provider);
          },
        })
      : Resend({
          apiKey: process.env.RESEND_API_KEY ?? "missing-resend-api-key",
          from: emailFrom,
          sendVerificationRequest: async ({ identifier: email, url, provider }) => {
            await sendCustomMagicLinkEmail(email, url, provider);
          },
        }),
  ],
  callbacks: {
    // Runs before the magic link is sent, so a blocked address never receives
    // one, and again when the link is verified.
    async signIn({ user }) {
      return isEmailAllowedToSignIn(user?.email);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureWorkspaceForUser(user.id, user.email);
      }
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  session: {
    strategy: "database",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const workspace = await getPrimaryWorkspace(userId);
  if (workspace) return workspace.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const createdWorkspace = await ensureWorkspaceForUser(userId, user?.email);
  return createdWorkspace.id;
}
