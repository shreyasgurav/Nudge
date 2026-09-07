import { NextRequest, NextResponse } from "next/server";
import { canManageWorkspace, getCurrentWorkspaceContext } from "@/lib/workspace-access";
import { getBaseUrl, getMissingInstagramOAuthEnv } from "@/lib/env";
import { createOAuthState, getAuthorizationUrl } from "@/lib/meta/oauth";

export async function GET(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.redirect(`${getBaseUrl()}/login`);
  }
  if (!canManageWorkspace(context.role)) {
    return NextResponse.redirect(`${getBaseUrl()}/settings?instagram=forbidden`);
  }

  // getAuthorizationUrl and createOAuthState call requireEnv, which throws.
  // Without this check an incomplete .env surfaces as a 500 on a plain <a>
  // navigation, which reads to the user as the button doing nothing at all.
  const missingEnv = getMissingInstagramOAuthEnv();
  if (missingEnv.length > 0) {
    return NextResponse.redirect(
      `${getBaseUrl()}/settings?instagram=misconfigured&missing=${encodeURIComponent(
        missingEnv.join(",")
      )}`
    );
  }

  // Check if request is from mobile app
  const mobileApp = request.nextUrl.searchParams.get("mobileApp") === "true";

  const redirectUri = `${getBaseUrl()}/api/instagram/callback`;
  const state = createOAuthState(context.workspaceId, mobileApp);

  return NextResponse.redirect(getAuthorizationUrl(redirectUri, state));
}
