"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassphrase, createSessionToken } from "@/lib/auth";

export async function login(prevState: { error?: string } | undefined, formData: FormData) {
  const passphrase = String(formData.get("passphrase") ?? "");
  const from = String(formData.get("from") ?? "/dashboard") || "/dashboard";

  if (!checkPassphrase(passphrase)) {
    return { error: "パスフレーズが違います。" };
  }

  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60日
  });
  redirect(from.startsWith("/") ? from : "/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
