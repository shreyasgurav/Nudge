"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  adminCredentialsConfigured,
  createAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export interface AdminLoginState {
  error: string | null;
}

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  if (!adminCredentialsConfigured()) {
    return {
      error:
        "Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD in your environment.",
    };
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect("/admin/dashboard");
}

export async function logoutAdmin(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  redirect("/admin/login");
}
