import Link from "next/link";

export const metadata = {
  title: "Check your email - Nudge",
  description: "A sign-in link was sent to your email.",
};

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Logo at top */}
      <div className="pt-8 pb-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900">
          Nudge
        </h1>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Check your email</h2>
          <p className="text-base text-gray-600 mb-6">
            We sent you a secure sign-in link. Open it on this device to continue.
          </p>
          <Link 
            href="/login" 
            className="inline-block px-6 py-2 rounded-full text-sm text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
