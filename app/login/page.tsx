import { EMAIL_PROVIDER_ID, signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";
import Link from "next/link";

export const metadata = {
  title: "Login - Nudge",
  description: "Sign in to automate your Instagram engagement.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkEmail?: string;
    callbackUrl?: string;
    template?: string;
  }>;
}) {
  const params = await searchParams;
  const checkEmail = params.checkEmail === "1";
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  async function sendMagicLink(formData: FormData) {
    "use server";
    await signIn(EMAIL_PROVIDER_ID, {
      email: String(formData.get("email") ?? ""),
      redirectTo: callbackUrl,
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f7f5" }}>
      {/* Logo — top center */}
      <div className="pt-10 pb-2 text-center">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Comfortaa', sans-serif", color: "#1a1a1a" }}
        >
          nudge
        </span>
      </div>

      {/* Centered form area */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ marginTop: "-4rem" }}>
        <div className="w-full max-w-sm">
          {checkEmail ? (
            <div>
              <h1
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Comfortaa', sans-serif" }}
              >
                Check your email
              </h1>
              <p className="text-base mb-6" style={{ color: "#7a7a72" }}>
                We sent you a secure sign-in link. Open it on this device to
                continue.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2.5 rounded-full transition-all"
                style={{ background: "#6B9FE8", color: "white" }}
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <form action={sendMagicLink} className="space-y-3">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                className="nudge-input"
              />
              <div>
                <button type="submit" className="btn-nudge">
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
