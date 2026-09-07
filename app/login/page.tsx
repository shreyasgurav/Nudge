import { signIn } from "@/lib/auth";
import { getCampaignTemplate } from "@/lib/templates/campaign-templates";

export const metadata = {
  title: "Login - Nudge",
  description: "Sign in to automate your Instagram engagement.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    template?: string;
  }>;
}) {
  const params = await searchParams;
  const selectedTemplate = getCampaignTemplate(params.template);
  const templateCallbackUrl = selectedTemplate
    ? `/campaigns/new?template=${selectedTemplate.slug}`
    : null;
  const callbackUrl = params.callbackUrl ?? templateCallbackUrl ?? "/dashboard";

  async function handleGoogleSignIn() {
    "use server";
    await signIn("google", {
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
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Comfortaa', sans-serif" }}
            >
              Welcome to Nudge
            </h1>
            <p className="text-base" style={{ color: "#7a7a72" }}>
              Sign in to automate your Instagram engagement
            </p>
          </div>

          <form action={handleGoogleSignIn}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              style={{ background: "white", color: "#1a1a1a", border: "1px solid #e0e0e0" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
